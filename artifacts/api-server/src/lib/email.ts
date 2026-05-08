import { Resend } from "resend";

const FROM = "AI Diary <onboarding@resend.dev>";

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(process.env.RESEND_API_KEY);
}

function appUrl() {
  return process.env.REPLIT_DEV_DOMAIN
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : "https://your-app.replit.app";
}

async function sendEmail(payload: { to: string; subject: string; html: string }) {
  const { data, error } = await getClient().emails.send({
    from: FROM,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  if (error) {
    const msg = typeof error === "object" && "message" in error
      ? (error as { message: string }).message
      : JSON.stringify(error);
    throw new Error(`Resend error: ${msg}`);
  }

  return data;
}

export async function sendDailyReminderEmail(toEmail: string, reminderTime: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const data = await sendEmail({
      to: toEmail,
      subject: "📔 Time to reflect — your AI Diary is waiting",
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f0e17;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px 28px 24px;">
            <div style="font-size:32px;margin-bottom:8px;">✨</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">Daily Reflection Time</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Your ${reminderTime} reminder</p>
          </div>
          <div style="padding:28px;">
            <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
              Hey there! 👋 This is your daily nudge to take a few minutes and record how you're feeling today. Even a short entry makes a big difference.
            </p>
            <div style="background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;color:rgba(255,255,255,0.65);font-size:13px;font-style:italic;">
                "The habit of journaling is one of the most powerful tools for self-growth and clarity."
              </p>
            </div>
            <a href="${appUrl()}/record" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
              Open AI Diary →
            </a>
          </div>
          <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
              You're receiving this because you enabled daily reminders in AI Diary settings.
            </p>
          </div>
        </div>`,
    });
    console.log(`[email] Daily reminder sent → ${toEmail} (id: ${data?.id})`);
  } catch (err) {
    console.error("[email] Daily reminder failed:", err);
  }
}

export async function sendInactivityEmail(toEmail: string, daysMissed: number) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const data = await sendEmail({
      to: toEmail,
      subject: `💜 We miss you — ${daysMissed} days away from your diary`,
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f0e17;color:#fff;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 28px 24px;">
            <div style="font-size:32px;margin-bottom:8px;">💜</div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">We've missed you</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">${daysMissed} days since your last visit</p>
          </div>
          <div style="padding:28px;">
            <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;margin:0 0 20px;">
              Hey! It's been ${daysMissed} days since you last checked in with your AI Diary. Your diary is here whenever you're ready to reflect.
            </p>
            <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:24px;">
              <tr>
                ${[["📝","Record how you feel"],["🎯","Check your goals"],["💭","Chat with AI"]].map(([icon,text])=>`
                <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;text-align:center;width:33%;">
                  <div style="font-size:20px;margin-bottom:6px;">${icon}</div>
                  <p style="margin:0;color:rgba(255,255,255,0.65);font-size:12px;">${text}</p>
                </td>`).join("")}
              </tr>
            </table>
            <a href="${appUrl()}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600;">
              Come back →
            </a>
          </div>
          <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">
              You're receiving this because you enabled inactivity alerts in AI Diary settings.
            </p>
          </div>
        </div>`,
    });
    console.log(`[email] Inactivity alert sent → ${toEmail} (id: ${data?.id})`);
  } catch (err) {
    console.error("[email] Inactivity alert failed:", err);
  }
}

export async function sendTestEmail(toEmail: string) {
  const data = await sendEmail({
    to: toEmail,
    subject: "✅ AI Diary — email notifications are working!",
    html: `
      <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f0e17;color:#fff;border-radius:16px;padding:32px;">
        <div style="font-size:36px;margin-bottom:12px;">✅</div>
        <h2 style="margin:0 0 12px;color:#fff;">Email notifications are set up!</h2>
        <p style="color:rgba(255,255,255,0.75);font-size:14px;line-height:1.6;">
          Your AI Diary is connected and will send reminders to <strong>${toEmail}</strong>.<br/><br/>
          • Daily diary reminder at your chosen time<br/>
          • Gentle nudge if you haven't logged in for 3+ days
        </p>
        <a href="${appUrl()}" style="display:inline-block;margin-top:20px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;">
          Open AI Diary →
        </a>
      </div>`,
  });
  console.log(`[email] Test email sent → ${toEmail} (id: ${data?.id})`);
  return data;
}
