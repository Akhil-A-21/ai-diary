import cron from "node-cron";
import { db, userPreferences } from "./db";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { sendDailyReminderEmail, sendInactivityEmail } from "./email";
import { sendPushToUser } from "./push";

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
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  }
}

export function startScheduler() {
  // ── Daily reminder ── every minute, fires at the user's chosen local time
  cron.schedule("* * * * *", async () => {
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
          await db
            .update(userPreferences)
            .set({ lastReminderDate: todayDate })
            .where(eq(userPreferences.userEmail, user.userEmail));

          // Send both email + push in parallel
          await Promise.allSettled([
            process.env.RESEND_API_KEY
              ? sendDailyReminderEmail(user.userEmail, reminderTime)
              : Promise.resolve(),
            sendPushToUser(user.userEmail, {
              title: "📔 Time to reflect",
              body: `Your ${reminderTime} diary reminder — take a moment to capture how you feel today.`,
              url: "/record",
            }),
          ]);
        }
      }
    } catch (err) {
      console.error("[scheduler] Daily reminder check failed:", err);
    }
  });

  // ── Inactivity alert ── daily at 10:00 UTC
  cron.schedule("0 10 * * *", async () => {
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
          await Promise.allSettled([
            process.env.RESEND_API_KEY
              ? sendInactivityEmail(user.userEmail, daysMissed)
              : Promise.resolve(),
            sendPushToUser(user.userEmail, {
              title: "💜 We miss you",
              body: `It's been ${daysMissed} days since your last diary entry. Come back anytime.`,
              url: "/",
            }),
          ]);
        }
      }
    } catch (err) {
      console.error("[scheduler] Inactivity check failed:", err);
    }
  });

  console.log("[scheduler] Started — daily reminders & inactivity alerts active");
}
