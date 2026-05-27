import helmet from "helmet";

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https://ik.imagekit.io"],
      connectSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Required for Google OAuth popup mode — allows the popup to postMessage back
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
});

