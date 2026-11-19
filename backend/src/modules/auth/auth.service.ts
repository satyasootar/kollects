import bcrypt from "bcrypt";
import crypto from "crypto";
import config from "../../config/config.js";
import { User } from "../user/user.model.js";
import { Session } from "../session/session.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendEmail } from "../../utils/mail.js";
import { renderEmail } from "../../utils/email-layout.js";
import { escapeHtml } from "../../utils/html.js";
import {
    userZodSchema,
    type UpdateProfileInput,
    type CompleteOnboardingInput
} from "../user/user.validation.js";
import type { 
    RegisterInput, 
    LoginInput, 
    ChangePasswordInput, 
    ForgotPasswordInput, 
    ResetPasswordInput, 
    VerifyEmailInput 
} from "./auth.validation.js";
import { assertFeature } from "../billing/billing.service.js";
import { BRAND_DEFAULTS } from "../branding/branding.validation.js";
import { sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js";

/** Creates a new session and returns its access + refresh token pair. */
export async function generateAccessAndRefreshTokens(userId: string) {
    const expiresInDays = parseInt((config.REFRESH_TOKEN_EXPIRY as string || "7d").replace(/\D/g, "")) || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const session = new Session({ userId, expiresAt, isActive: true });
    const sid = session._id.toString();
    const refreshToken = signRefreshToken(userId, sid);
    session.tokenHash = sha256(refreshToken);
    await session.save();

    return { accessToken: signAccessToken(userId, sid), refreshToken };
}

const AUTH_EMAIL_COOLDOWN_MS = 60_000;

/** Atomically claims the right to send one auth email to this user; false while the cooldown runs. */
async function claimEmailSlot(userId: unknown, field: "lastVerificationEmailAt" | "lastResetEmailAt") {
    const res = await User.updateOne(
        { _id: userId, $or: [{ [field]: { $exists: false } }, { [field]: { $lt: new Date(Date.now() - AUTH_EMAIL_COOLDOWN_MS) } }] },
        { [field]: new Date() }
    );
    return res.modifiedCount > 0;
}

/**
 * Generates a verification token and sends an email to the user.
 * Silently skips if one was sent to this address in the last minute.
 */
export async function sendVerificationEmail(userId: string) {
    if (!(await claimEmailSlot(userId, "lastVerificationEmailAt"))) return;
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = sha256(token); // only the emailed copy is usable
    user.emailVerificationExpiry = expiry;
    await user.save();

    const verificationUrl = `${config.CLIENT_URL}/auth/verify-email?token=${token}`;
    
    const { success, error } = await sendEmail({
        to: user.email,
        subject: "Verify your email for Kollects",
        html: renderEmail({
            preheader: "Confirm your email to finish setting up Kollects.",
            heading: "Welcome to Kollects",
            bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(user.name || "there")}, confirm your email address to start creating polls and forms.</p>`,
            cta: { label: "Verify email", url: verificationUrl },
            footnote: `The link works for 24 hours. Button not working? Paste this into your browser:<br><a href="${escapeHtml(verificationUrl)}" style="color:#71717a;word-break:break-all">${escapeHtml(verificationUrl)}</a>`,
        }),
        text: `Welcome to Kollects! Verify your email (link valid for 24 hours): ${verificationUrl}`,
    });

    if (!success) {
        throw new ApiError(500, `Failed to send verification email: ${JSON.stringify(error)}`);
    }
}

/**
 * Registers a new user and triggers the verification email flow.
 */
export async function register(input: RegisterInput) {
    const existingUser = await User.findOne({ email: input.email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await User.create({
        name: input.name,
        email: input.email,
        passwordHash,
    });

    sendVerificationEmail(user._id.toString()).catch(console.error);

    const createdUser = await User.findById(user._id).select("-passwordHash");
    if (!createdUser) throw new ApiError(500, "Failed to register user");

    const tokens = await generateAccessAndRefreshTokens(user._id.toString());
    return { user: createdUser, ...tokens };
}

const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

/**
 * Authenticates a user with email and password.
 * Five wrong passwords lock the account for 15 minutes, whichever IPs they came from.
 */
export async function login(input: LoginInput) {
    const user = await User.findOne({ email: input.email }).select("+passwordHash");
    
    if (!user || !user.passwordHash) {
        throw new ApiError(401, "Invalid email or password");
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
        throw new ApiError(429, "Too many failed sign-in attempts. Try again in 15 minutes.");
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
        const updated = await User.findByIdAndUpdate(user._id, { $inc: { failedLoginCount: 1 } }, { new: true });
        if ((updated?.failedLoginCount ?? 0) >= MAX_FAILED_LOGINS) {
            await User.updateOne({ _id: user._id }, { failedLoginCount: 0, lockUntil: new Date(Date.now() + LOGIN_LOCK_MS) });
        }
        throw new ApiError(401, "Invalid email or password");
    }
    if (user.failedLoginCount || user.lockUntil) {
        await User.updateOne({ _id: user._id }, { $unset: { failedLoginCount: 1, lockUntil: 1 } });
    }

    // Password login needs a proven inbox, so nobody can pre-register someone else's address
    // and keep using it. The session created at sign-up is the only unverified one.
    if (!user.isEmailVerified) {
        sendVerificationEmail(user._id.toString()).catch(console.error);
        throw new ApiError(403, "Please verify your email first. We've sent you a new verification link.");
    }

    const loggedInUser = await User.findById(user._id).select("-passwordHash");
    const tokens = await generateAccessAndRefreshTokens(user._id.toString());

    return { user: loggedInUser, ...tokens };
}

/** Logs out by deleting the session the refresh token belongs to. */
export async function logout(refreshToken: string) {
    const claims = verifyRefreshToken(refreshToken);
    if (claims) await Session.deleteOne({ _id: claims.sid, userId: claims._id });
    return { success: true };
}

// A second tab may refresh with the token another tab just rotated; allow that briefly.
const ROTATION_GRACE_MS = 30_000;

/**
 * Rotates the refresh token. Presenting a token that was already rotated (outside the grace
 * window) means it was stolen, so every session of that user is revoked.
 * `refreshToken` is omitted from the result on the grace path: the caller already has the new one.
 */
export async function refreshAccessToken(incomingRefreshToken: string | undefined) {
    const claims = verifyRefreshToken(incomingRefreshToken);
    if (!claims) throw new ApiError(401, "Refresh token is invalid or expired");

    const hash = sha256(incomingRefreshToken!);
    const refreshToken = signRefreshToken(claims._id, claims.sid);
    const rotated = await Session.findOneAndUpdate(
        { _id: claims.sid, userId: claims._id, tokenHash: hash, isActive: true, expiresAt: { $gt: new Date() } },
        { tokenHash: sha256(refreshToken), prevTokenHash: hash, rotatedAt: new Date() }
    );

    let issued: { accessToken: string; refreshToken?: string };
    if (rotated) {
        issued = { accessToken: signAccessToken(claims._id, claims.sid), refreshToken };
    } else {
        const session = await Session.findOne({ _id: claims.sid, userId: claims._id });
        const inGrace = session?.prevTokenHash === hash && !!session.rotatedAt
            && Date.now() - session.rotatedAt.getTime() < ROTATION_GRACE_MS;
        if (!session || !inGrace) {
            // Reuse of a rotated token: assume theft and end every session of this user.
            if (session) await Session.deleteMany({ userId: session.userId });
            throw new ApiError(401, "Refresh token is invalid or expired");
        }
        issued = { accessToken: signAccessToken(claims._id, claims.sid) };
    }

    const user = await User.findById(claims._id).select("-passwordHash");
    if (!user) throw new ApiError(401, "Refresh token is invalid or expired");
    return { user, ...issued };
}

/** Whether the account can sign in with a password (Google-only accounts have none yet). */
export async function hasPassword(userId: unknown) {
    return !!(await User.exists({ _id: userId, passwordHash: { $type: "string", $ne: "" } }));
}

/**
 * Changes the password for an authenticated user, or adds a first one to a Google-only
 * account (no old password exists to check; the signed-in session is the proof of identity).
 */
export async function changePassword(userId: string, input: ChangePasswordInput, currentSessionId?: string) {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) throw new ApiError(404, "User not found");

    const created = !user.passwordHash;
    if (!created) {
        if (!input.oldPassword) throw new ApiError(400, "Enter your current password");
        const isPasswordValid = await bcrypt.compare(input.oldPassword, user.passwordHash!);
        if (!isPasswordValid) throw new ApiError(400, "Invalid old password");
    }

    user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    await user.save();

    // Sign out every other device; the one making the change stays signed in.
    await Session.deleteMany({ userId: user._id, ...(currentSessionId ? { _id: { $ne: currentSessionId } } : {}) });
    if (!created) notifyPasswordChanged(user).catch(console.error);

    return { success: true, created };
}

/**
 * Verifies a user's email address using a verification token.
 */
export async function verifyEmail(input: VerifyEmailInput) {
    const user = await User.findOne({
        emailVerificationToken: sha256(input.token),
        emailVerificationExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(400, "Invalid or expired verification token");

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    return { success: true };
}

/**
 * Initiates the password reset flow by sending a reset link via email.
 */
export async function forgotPassword(input: ForgotPasswordInput) {
    const user = await User.findOne({ email: input.email });
    // Same response whether the address is unknown or still in its cooldown (no enumeration).
    if (!user || !(await claimEmailSlot(user._id, "lastResetEmailAt"))) return { success: true };

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 30 * 60 * 1000);

    user.passwordResetToken = sha256(token); // only the emailed copy is usable
    user.passwordResetExpiry = expiry;
    await user.save();

    const resetUrl = `${config.CLIENT_URL}/auth/reset-password?token=${token}`;

    const { success, error } = await sendEmail({
        to: user.email,
        subject: "Reset your Kollects password",
        html: renderEmail({
            preheader: "Use this link to choose a new password.",
            heading: "Reset your password",
            bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(user.name || "there")}, we got a request to reset your password. Choose a new one below.</p>`,
            cta: { label: "Reset password", url: resetUrl },
            footnote: `The link works for 30 minutes. If you didn't ask for this, ignore this email and your password stays the same.<br><a href="${escapeHtml(resetUrl)}" style="color:#71717a;word-break:break-all">${escapeHtml(resetUrl)}</a>`,
        }),
        text: `Reset your Kollects password (link valid for 30 minutes): ${resetUrl}\nIf you didn't ask for this, ignore this email.`,
    });

    if (!success) {
        throw new ApiError(500, `Failed to send reset email: ${JSON.stringify(error)}`);
    }

    return { success: true };
}

/**
 * Resets a user's password using a valid reset token.
 */
export async function resetPassword(input: ResetPasswordInput) {
    const user = await User.findOne({
        passwordResetToken: sha256(input.token),
        passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) throw new ApiError(400, "Invalid or expired reset token");

    user.passwordHash = await bcrypt.hash(input.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.isEmailVerified = true; // the reset link proved they own the inbox
    user.failedLoginCount = undefined;
    user.lockUntil = undefined;
    await user.save();

    // Whoever else was signed in (possibly the reason for the reset) is signed out.
    await Session.deleteMany({ userId: user._id });
    notifyPasswordChanged(user).catch(console.error);

    return { success: true };
}

/** Tells the owner their password changed, with a way back in if it wasn't them. */
async function notifyPasswordChanged(user: { email: string; name?: string | null }) {
    const resetUrl = `${config.CLIENT_URL}/auth/forgot-password`;
    await sendEmail({
        to: user.email,
        subject: "Your Kollects password was changed",
        html: renderEmail({
            preheader: "Your password was just changed.",
            heading: "Your password was changed",
            bodyHtml: `<p style="margin:0 0 12px">Hi ${escapeHtml(user.name || "there")}, the password for your Kollects account was just changed and other devices were signed out.</p><p style="margin:0 0 12px">If this wasn't you, reset your password right away.</p>`,
            cta: { label: "Reset password", url: resetUrl },
        }),
        text: `The password for your Kollects account was just changed. If this wasn't you, reset it now: ${resetUrl}`,
    });
}

/**
 * Updates a user's profile information.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (input.name) user.name = input.name;
    if (input.avatarUrl) user.avatarUrl = input.avatarUrl;
    
    if (input.branding) {
        // The profile form resends branding on every save; only an actual change needs the plan.
        const cur: Record<string, unknown> = { ...BRAND_DEFAULTS, ...((user.toObject().branding as any) ?? {}) };
        const changed = Object.entries(input.branding).some(([k, v]) => v !== undefined && v !== cur[k]);
        if (changed) await assertFeature(userId, "branding");
        const next = Object.fromEntries(Object.entries(input.branding).filter(([, v]) => v !== undefined));
        user.set("branding", { ...cur, ...next });
    }

    await user.save();

    const updatedUser = await User.findById(userId).select("-passwordHash");
    return updatedUser;
}

/**
 * Records the new-user onboarding answers and marks onboarding as complete.
 */
export async function completeOnboarding(userId: string, input: CompleteOnboardingInput) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    user.hasCompletedOnboarding = true;
    user.onboarding = { ...input };

    await user.save();

    const updatedUser = await User.findById(userId).select("-passwordHash");
    return updatedUser;
}
