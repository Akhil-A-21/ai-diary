import webpush from "web-push";
import { db, pushSubscriptions } from "./db";
import { eq } from "drizzle-orm";

function setupVapid() {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "mailto:admin@aidiary.app";
  if (pub && priv) {
    webpush.setVapidDetails(email, pub, priv);
  }
}
setupVapid();

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}

export async function sendPushToUser(
  userEmail: string,
  payload: { title: string; body: string; url?: string }
) {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userEmail, userEmail));

  for (const sub of subs) {
    let keys: { p256dh: string; auth: string };
    try {
      keys = JSON.parse(sub.keys);
    } catch {
      continue;
    }
    const subscription = { endpoint: sub.endpoint, keys };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 410 || status === 404) {
        // Subscription expired — remove it
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, sub.id));
      } else {
        console.error("[push] Failed to send to", sub.endpoint, err);
      }
    }
  }
}
