import { rateLimit } from "express-rate-limit";

/**
 * Standard rate limiter factory.
 * Disabled in test mode (NODE_ENV=test) to allow rapid test execution.
 */
export const createRateLimiter = (
    windowMs: number = 15 * 60 * 1000, 
    max: number = 100, 
    message: string = "Too many requests from this IP, please try again later."
) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            status: 429,
            message
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: () => process.env.ENVIRONMENT === "test",
    });
};

export const authRateLimiter = createRateLimiter(15 * 60 * 1000, 10, "Too many login attempts. Please try again in 15 minutes.");
// Endpoints that send email: strict, since each hit can reach someone's inbox.
export const emailRateLimiter = createRateLimiter(60 * 60 * 1000, 5, "Too many requests. Please try again in an hour.");
// Token/password endpoints: tokens are 256-bit, so this only caps grinding. Loose enough for
// many users behind one school/office IP (a 429 on refresh would sign them all out).
export const tokenRateLimiter = createRateLimiter(15 * 60 * 1000, 30);
export const refreshRateLimiter = createRateLimiter(15 * 60 * 1000, 300);
export const responseRateLimiter = createRateLimiter(1 * 60 * 1000, 5, "You are voting too fast. Please slow down.");
