import { Request } from "express";

export function getUserEmail(req: Request): string {
  const email =
    req.headers["x-user-email"] as string ||
    "demo@aivideodiary.app";
  return email;
}
