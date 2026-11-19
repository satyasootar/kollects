import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../../config/config.js";

/**
 * Access and refresh tokens use different secrets and a `typ` claim, so one can never stand in
 * for the other. Both carry `sid` (the Session id) so logout / revocation takes effect immediately.
 */
export interface TokenClaims {
    _id: string;
    sid: string;
    typ: "access" | "refresh";
}

export const sha256 = (value: string) => crypto.createHash("sha256").update(value).digest("hex");

export const signAccessToken = (userId: string, sid: string) =>
    jwt.sign({ _id: userId, sid, typ: "access" }, config.JWT_ACCESS_SECRET, {
        algorithm: "HS256",
        expiresIn: config.ACCESS_TOKEN_EXPIRY ?? "15m",
    });

// jti makes every refresh token unique, so two rotations in the same second still hash differently.
export const signRefreshToken = (userId: string, sid: string) =>
    jwt.sign({ _id: userId, sid, typ: "refresh", jti: crypto.randomUUID() }, config.JWT_REFRESH_SECRET, {
        algorithm: "HS256",
        expiresIn: config.REFRESH_TOKEN_EXPIRY ?? "7d",
    });

function verify(token: unknown, secret: string, typ: TokenClaims["typ"]): TokenClaims | null {
    if (typeof token !== "string" || !token) return null;
    try {
        const claims = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Partial<TokenClaims>;
        return claims.typ === typ && typeof claims._id === "string" && typeof claims.sid === "string"
            ? (claims as TokenClaims)
            : null;
    } catch {
        return null;
    }
}

export const verifyAccessToken = (token: unknown) => verify(token, config.JWT_ACCESS_SECRET, "access");
export const verifyRefreshToken = (token: unknown) => verify(token, config.JWT_REFRESH_SECRET, "refresh");
