import express from "express"
import type { Application } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import rootRouter from "../routes/index.js"
import { errorHandler } from "../middlewares/error.middleware.js"
import passport from "../config/passport.js"
import config from "../config/config.js"
import { metricsMiddleware } from "../utils/metrics.js"
import { ApiError } from "../utils/ApiError.js"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])

export function createServerApplication(): Application {
    const app = express()
    app.set('trust proxy', 1); 
    app.use(cors({
        origin: config.ENVIRONMENT === "production" 
            ? config.CLIENT_URL 
            : ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
        exposedHeaders: ["X-Export-Truncated"],
    }))
    
    app.use(metricsMiddleware)
    // JSON only: no urlencoded parser, so a cross-site <form> can't produce a body we accept.
    app.use(express.json())
    app.use(cookieParser())

    // CSRF: auth cookies are SameSite=None in production, so require a header a cross-site form can't
    // send (and a cross-origin fetch can't send without passing the CORS preflight).
    app.use((req, _res, next) => {
        if (SAFE_METHODS.has(req.method) || req.get("X-Requested-With") === "kollects") return next()
        next(new ApiError(403, "Bad request origin"))
    })
    app.use(passport.initialize())

    app.use("/api", rootRouter)

    app.use(errorHandler)

    return app
}