import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// Regression checks for the Nov 2026 security audit (#7–#16).
vi.mock("../../config/config.js", () => ({
  default: {
    JWT_ACCESS_SECRET: "access-secret-access-secret-access",
    JWT_REFRESH_SECRET: "refresh-secret-refresh-secret-refr",
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_EXPIRY: "7d",
    CLOUDINARY_CLOUD_NAME: "kollects-cloud",
    GOOGLE_CLIENT_ID: "id",
    GOOGLE_CLIENT_SECRET: "secret",
    GOOGLE_CALLBACK_URL: "http://localhost/cb",
  },
}));
vi.mock("../session/session.model.js", () => ({
  Session: { findOneAndUpdate: vi.fn(), findOne: vi.fn(), deleteMany: vi.fn(), deleteOne: vi.fn() },
}));
vi.mock("../user/user.model.js", () => ({ User: { findById: vi.fn(), findOne: vi.fn() } }));
vi.mock("../poll/poll.model.js", () => ({ Poll: { findOne: vi.fn() } }));
vi.mock("../../utils/mail.js", () => ({ sendEmail: vi.fn() }));
vi.mock("../billing/billing.service.js", () => ({ assertFeature: vi.fn() }));

import { Session } from "../session/session.model.js";
import { User } from "../user/user.model.js";
import { Poll } from "../poll/poll.model.js";
import { sha256, signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./tokens.js";
import { refreshAccessToken } from "./auth.service.js";
import { refreshTokenSchema } from "./auth.validation.js";
import { csvCell } from "../../utils/csv.js";
import { submitFormResponseSchema } from "../form-response/form-response.validation.js";
import * as AnalyticsController from "../analytics/analytics.controller.js";
import passport from "../../config/passport.js";

const m = (fn: unknown) => fn as ReturnType<typeof vi.fn>;
beforeEach(() => vi.clearAllMocks());

describe("#8 token types", () => {
  it("never accepts a refresh token as an access token (or vice versa)", () => {
    const access = signAccessToken("u1", "s1");
    const refresh = signRefreshToken("u1", "s1");
    expect(verifyAccessToken(access)).toMatchObject({ _id: "u1", sid: "s1", typ: "access" });
    expect(verifyAccessToken(refresh)).toBeNull();
    expect(verifyRefreshToken(access)).toBeNull();
    expect(verifyRefreshToken(refresh)).toMatchObject({ _id: "u1", sid: "s1", typ: "refresh" });
  });

  it("rejects old-style tokens, alg=none and non-strings", () => {
    expect(verifyAccessToken(jwt.sign({ _id: "u1" }, "access-secret-access-secret-access"))).toBeNull();
    expect(verifyAccessToken(jwt.sign({ _id: "u1", sid: "s1", typ: "access" }, null as any, { algorithm: "none" }))).toBeNull();
    expect(verifyAccessToken({ $ne: null })).toBeNull();
  });
});

describe("#8 refresh rotation and reuse detection", () => {
  it("rotates a current token", async () => {
    m(Session.findOneAndUpdate).mockResolvedValue({ _id: "s1" });
    m(User.findById).mockReturnValue({ select: async () => ({ _id: "u1" }) });
    const result = await refreshAccessToken(signRefreshToken("u1", "s1"));
    expect(verifyAccessToken(result.accessToken)).toBeTruthy();
    expect(verifyRefreshToken(result.refreshToken)).toBeTruthy();
  });

  it("revokes every session when an already-rotated token is replayed", async () => {
    const stolen = signRefreshToken("u1", "s1");
    m(Session.findOneAndUpdate).mockResolvedValue(null);
    m(Session.findOne).mockResolvedValue({ userId: "u1", prevTokenHash: "something-else", rotatedAt: new Date() });
    await expect(refreshAccessToken(stolen)).rejects.toMatchObject({ statusCode: 401 });
    expect(Session.deleteMany).toHaveBeenCalledWith({ userId: "u1" });
  });

  it("lets a second tab refresh with the just-rotated token (grace window) without revoking", async () => {
    const token = signRefreshToken("u1", "s1");
    m(Session.findOneAndUpdate).mockResolvedValue(null);
    m(Session.findOne).mockResolvedValue({ userId: "u1", prevTokenHash: sha256(token), rotatedAt: new Date() });
    m(User.findById).mockReturnValue({ select: async () => ({ _id: "u1" }) });
    const result = await refreshAccessToken(token);
    expect(result.refreshToken).toBeUndefined();
    expect(Session.deleteMany).not.toHaveBeenCalled();
  });
});

describe("#10 refresh token input", () => {
  it("rejects operator objects and arrays", () => {
    expect(refreshTokenSchema.safeParse({ $ne: null }).success).toBe(false);
    expect(refreshTokenSchema.safeParse(["a"]).success).toBe(false);
    expect(refreshTokenSchema.safeParse("a.b.c").success).toBe(true);
  });
});

describe("#7 poll analytics ownership", () => {
  it("returns 404 for a poll the caller doesn't own, for every handler", async () => {
    m(Poll.findOne).mockResolvedValue(null);
    const req: any = { params: { pollId: "507f1f77bcf86cd799439011", questionId: "q", responseId: "r" }, query: {}, user: { _id: "intruder" } };
    const handlers = ["getWordCloud", "getSnapshot", "getFullAnalytics", "getRespondents", "resendReceipt", "getSummary", "getTimeline", "exportData"];
    for (const name of handlers) {
      await expect((AnalyticsController as any)[name](req, {})).rejects.toMatchObject({ statusCode: 404 });
    }
    expect(Poll.findOne).toHaveBeenCalledWith(expect.objectContaining({ creatorId: "intruder" }));
  });
});

describe("#9 Google account linking", () => {
  const verify = (profile: object) =>
    new Promise<any>((resolve) => (passport as any)._strategy("google")._verify("at", "rt", profile, (_e: unknown, u: unknown) => resolve(u)));
  const profile = (verified: boolean) => ({ id: "g1", displayName: "V", emails: [{ value: "v@x.dev", verified }], photos: [] });
  const existing = (isEmailVerified: boolean) => {
    const doc: any = { _id: "u1", passwordHash: "attacker-hash", isEmailVerified, save: vi.fn() };
    m(User.findOne).mockReturnValue({ select: async () => doc });
    return doc;
  };

  it("drops the password and sessions of an unverified account it links to", async () => {
    const doc = existing(false);
    await verify(profile(true));
    expect(doc.passwordHash).toBeUndefined();
    expect(Session.deleteMany).toHaveBeenCalledWith({ userId: "u1" });
    expect(doc.isEmailVerified).toBe(true);
  });

  it("keeps the password of an already verified account", async () => {
    const doc = existing(true);
    await verify(profile(true));
    expect(doc.passwordHash).toBe("attacker-hash");
    expect(Session.deleteMany).not.toHaveBeenCalled();
  });

  it("refuses a Google profile whose email isn't verified", async () => {
    existing(false);
    expect(await verify(profile(false))).toBe(false);
  });
});

describe("#16 hardening", () => {
  it("neutralises spreadsheet formulas in CSV cells", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell("@cmd")).toBe(`"'@cmd"`);
    expect(csvCell("plain")).toBe(`"plain"`);
    expect(csvCell(-5)).toBe("-5");
  });

  it("only accepts file answers uploaded to our Cloudinary folder", () => {
    const submit = (url: string) =>
      submitFormResponseSchema.safeParse({ sessionToken: "s", answers: [{ questionId: "q", fileUrls: [{ url, name: "f.pdf", size: 10, mimeType: "application/pdf" }] }] }).success;
    expect(submit("https://res.cloudinary.com/kollects-cloud/raw/upload/v1/kollects/answers/f.pdf")).toBe(true);
    expect(submit("https://evil.example/fake-login")).toBe(false);
    expect(submit("https://res.cloudinary.com/someone-else/raw/upload/v1/kollects/f.pdf")).toBe(false);
  });
});
