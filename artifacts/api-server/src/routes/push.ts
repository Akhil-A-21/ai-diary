import { Router, Request, Response } from "express";
import { db, pushSubscriptions } from "../lib/db";
import { eq, and } from "drizzle-orm";
import { getUserEmail } from "../lib/getUserEmail";
import { getVapidPublicKey, sendPushToUser } from "../lib/push";

const router = Router();

// Return the public VAPID key so the frontend can subscribe
router.get("/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ key: getVapidPublicKey() });
});

// Save a push subscription for the authenticated user
router.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: "Missing endpoint or keys" });

    // Upsert: delete old matching endpoint first, then insert fresh
    await db
      .delete(pushSubscriptions)
      .where(
        and(eq(pushSubscriptions.userEmail, userEmail), eq(pushSubscriptions.endpoint, endpoint))
      );
    await db.insert(pushSubscriptions).values({ userEmail, endpoint, keys: JSON.stringify(keys) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save subscription" });
  }
});

// Remove a push subscription
router.post("/unsubscribe", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    const { endpoint } = req.body;
    if (endpoint) {
      await db
        .delete(pushSubscriptions)
        .where(
          and(eq(pushSubscriptions.userEmail, userEmail), eq(pushSubscriptions.endpoint, endpoint))
        );
    } else {
      // Remove all subscriptions for this user
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userEmail, userEmail));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove subscription" });
  }
});

// Send a test push notification
router.post("/test", async (req: Request, res: Response) => {
  try {
    const userEmail = getUserEmail(req);
    await sendPushToUser(userEmail, {
      title: "AI Diary ✅",
      body: "Push notifications are working! You'll be notified at your reminder time each day.",
      url: "/",
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to send test push" });
  }
});

export default router;
