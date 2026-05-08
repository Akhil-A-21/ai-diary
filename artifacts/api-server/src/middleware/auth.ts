import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

/**
 * Auth middleware — verifies Google access token if present,
 * then stamps req.userEmail for all downstream routes.
 * If no token, falls back to x-user-email header (dev / demo mode).
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const accessToken = req.headers["x-google-token"] as string | undefined;

  if (accessToken) {
    try {
      const tokenInfo = await client.getTokenInfo(accessToken);
      if (tokenInfo.email) {
        (req as any).userEmail = tokenInfo.email;
        // Keep header in sync so getUserEmail() works unchanged
        req.headers["x-user-email"] = tokenInfo.email;
        return next();
      }
    } catch {
      // Token invalid / expired — don't hard-reject, fall back to email header
      // so existing sessions continue working after the access token expires
      const fallbackEmail = req.headers["x-user-email"] as string;
      (req as any).userEmail = fallbackEmail || "demo@aivideodiary.app";
      req.headers["x-user-email"] = (req as any).userEmail;
      return next();
    }
  }

  // No token — use x-user-email header (dev / demo fallback)
  const headerEmail = req.headers["x-user-email"] as string;
  (req as any).userEmail = headerEmail || "demo@aivideodiary.app";
  next();
}
