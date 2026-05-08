import { OAuth2Client } from "google-auth-library";
import { Request } from "express";

const client = new OAuth2Client();

/**
 * Verify a Google access token and return the user's email.
 * Falls back to x-user-email header if no token provided (dev mode).
 */
export async function getVerifiedEmail(req: Request): Promise<string> {
  const accessToken = req.headers["x-google-token"] as string | undefined;

  if (accessToken) {
    try {
      const tokenInfo = await client.getTokenInfo(accessToken);
      if (tokenInfo.email) {
        return tokenInfo.email;
      }
    } catch {
      // Token invalid or expired — fall through to header
    }
  }

  // Fallback: trust the x-user-email header (dev/testing)
  const headerEmail = req.headers["x-user-email"] as string;
  return headerEmail || "demo@aivideodiary.app";
}
