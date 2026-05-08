import cron from "node-cron";
import { db, userPreferences } from "./db";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { sendDailyReminderEmail, sendInactivityEmail } from "./email";

function getLocalHHMM(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
    return `${hour}:${minute}`;
  } catch {
    // Fallback to UTC
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  }
}

export function startScheduler() {
  // ── Daily reminder ── runs every minute, sends at the user's chosen local time
  cron.schedule("* * * * *", async () => {
    if (!process.env.RESEND_API_KEY) return;
    try {
      const users = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.reminderEnabled, true));

      for (const user of users) {
        const tz = user.timezone || "UTC";
        const localNow = getLocalHHMM(tz);
        const reminderTime = user.reminderTime || "20:00";
        const todayDate = new Date().toISOString().split("T")[0];

        if (localNow === reminderTime && user.lastReminderDate !== todayDate) {
          // Mark as sent for today before sending to avoid duplicate sends
          await db
            .update(userPreferences)
            .set({ lastReminderDate: todayDate })
            .where(eq(userPreferences.userEmail, user.userEmail));

          await sendDailyReminderEmail(user.userEmail, reminderTime);
        }
      }
    } catch (err) {
      console.error("[scheduler] Daily reminder check failed:", err);
    }
  });

  // ── Inactivity alert ── runs once per day at 10:00 UTC
  cron.schedule("0 10 * * *", async () => {
    if (!process.env.RESEND_API_KEY) return;
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const users = await db
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.inactivityAlertEnabled, true),
            isNotNull(userPreferences.lastLoginAt),
            lt(userPreferences.lastLoginAt, threeDaysAgo)
          )
        );

      for (const user of users) {
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
        if (!lastLogin) continue;
        const daysMissed = Math.floor(
          (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysMissed >= 3) {
          await sendInactivityEmail(user.userEmail, daysMissed);
        }
      }
    } catch (err) {
      console.error("[scheduler] Inactivity check failed:", err);
    }
  });

  console.log("[scheduler] Started — daily reminders & inactivity alerts active");
}
