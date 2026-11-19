import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../modules/auth/tokens.js";
import { Session } from "../modules/session/session.model.js";
import { User } from "../modules/user/user.model.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to verify the JWT access token from cookies or Authorization header.
 * Attaches the user object to the request if valid.
 */
export const verifyJWT = async (req: Request, _res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized: No token provided");
        }

        const claims = verifyAccessToken(token);
        if (!claims) throw new ApiError(401, "Invalid or expired session");

        // The session check makes logout and password resets take effect immediately.
        const [user, session] = await Promise.all([
            User.findById(claims._id).select("-passwordHash"),
            Session.exists({ _id: claims.sid, userId: claims._id, isActive: true }),
        ]);

        if (!user || !session) {
            throw new ApiError(401, "Invalid or expired session");
        }

        if (!user.isActive) {
            throw new ApiError(403, "Your account is deactivated");
        }

        (req as any).user = user;
        (req as any).sessionId = claims.sid;
        next();
    } catch (error: any) {
        // Only our own messages reach the client; library errors stay generic.
        next(new ApiError(401, error instanceof ApiError ? error.message : "Invalid or expired session"));
    }
};
