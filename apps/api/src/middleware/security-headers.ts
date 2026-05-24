import { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent browsers from guessing the MIME type
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking by not allowing the site to be framed
  res.setHeader("X-Frame-Options", "DENY");

  // Enable XSS filtering in browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Control how much referrer information is included with requests
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Define approved sources of content that the browser may load
  res.setHeader("Content-Security-Policy", "default-src 'self'");

  // Enforce HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  next();
}
