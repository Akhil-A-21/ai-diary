import { Request } from "express";

/**
 * Synchronously extract user email from request headers.
 * The x-user-email header is set by the frontend after Google login.
 * Token verification is handled by the auth middleware.
 */
export function getUserEmail(req: Request): string {
  const email = req.headers["x-user-email"] as string;
  return email || "demo@aivideodiary.app";
}
