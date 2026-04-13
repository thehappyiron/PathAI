import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, dayName, dayNumber, focus } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const userName = displayName || "Learner";
    const motivations = [
      "Small steps lead to giant leaps. You're building unstoppable momentum! 🔥",
      "Discipline beats motivation. And today, you proved you have both! 💎",
      "The compound effect of daily study is incredibly powerful. Keep stacking wins! 📈",
      "Champions don't take days off. You're on the path to mastery! 🏆",
      "Your future self is already thanking you for today's effort. 🙏",
      "Knowledge is the one investment that always pays the best returns! 💡",
      "Every expert was once a beginner who refused to quit. You're that person! 🌟",
    ];
    const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

    const { data, error } = await resend.emails.send({
      from: "PathAI <onboarding@resend.dev>",
      to: [email],
      subject: `✅ Day ${dayNumber} Complete — You crushed it, ${userName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background:#F5F2ED;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F2ED;padding:40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#2D6A4F,#1B4F3A);padding:32px 40px;text-align:center;">
                      <div style="font-size:48px;margin-bottom:8px;">🎉</div>
                      <h1 style="margin:0;font-size:26px;color:#fff;font-weight:700;">
                        Day ${dayNumber} — Done!
                      </h1>
                      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">
                        Path<span style="color:#C9A84C;">AI</span> Study Plan Progress
                      </p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:36px 40px;">
                      <h2 style="margin:0 0 8px;font-size:22px;color:#0D0D0D;font-weight:700;">
                        Well done, ${userName}! 🌟
                      </h2>
                      <p style="margin:0 0 24px;font-size:16px;color:#52514E;line-height:1.65;">
                        You've completed <strong>${dayName}</strong>'s study plan${focus ? ` focused on <span style="color:#C9A84C;font-weight:600;">${focus}</span>` : ""}. That's real commitment!
                      </p>

                      <!-- Progress Card -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(45,106,79,0.06);border:1px solid rgba(45,106,79,0.15);border-radius:12px;margin-bottom:24px;">
                        <tr>
                          <td style="padding:20px 24px;text-align:center;">
                            <div style="font-size:14px;color:#2D6A4F;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Progress</div>
                            <div style="font-size:36px;font-weight:700;color:#2D6A4F;margin:8px 0;">
                              ${dayNumber}<span style="font-size:18px;color:#9E9B95;"> / 7</span> days
                            </div>
                            <!-- Progress bar -->
                            <div style="background:rgba(45,106,79,0.12);border-radius:999px;height:8px;overflow:hidden;margin-top:8px;">
                              <div style="width:${Math.round((dayNumber / 7) * 100)}%;height:100%;background:#2D6A4F;border-radius:999px;"></div>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <!-- Motivation -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(201,168,76,0.06);border-left:3px solid #C9A84C;border-radius:0 10px 10px 0;margin-bottom:28px;">
                        <tr>
                          <td style="padding:16px 20px;">
                            <div style="font-size:12px;color:#C9A84C;font-weight:600;text-transform:uppercase;margin-bottom:4px;">💬 Daily Motivation</div>
                            <p style="margin:0;font-size:15px;color:#0D0D0D;line-height:1.55;font-style:italic;">
                              "${randomMotivation}"
                            </p>
                          </td>
                        </tr>
                      </table>

                      ${dayNumber < 7 ? `
                      <p style="margin:0 0 20px;font-size:15px;color:#52514E;line-height:1.6;">
                        Tomorrow's Day ${dayNumber + 1} is waiting. Keep the streak alive — you're ${7 - dayNumber} day${7 - dayNumber > 1 ? 's' : ''} away from completing your entire weekly plan! 🚀
                      </p>
                      ` : `
                      <p style="margin:0 0 20px;font-size:15px;color:#52514E;line-height:1.6;">
                        You've completed the <strong>entire 7-day study plan!</strong> That's incredible dedication. Time to take a progress test and see how much you've improved! 🚀
                      </p>
                      `}

                      <!-- CTA -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <a href="https://pathai.vercel.app/results"
                               style="display:inline-block;background:#C9A84C;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:999px;">
                              ${dayNumber >= 7 ? "Take Progress Test →" : "Continue to Day " + (dayNumber + 1) + " →"}
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 40px;background:#FAFAF8;border-top:1px solid #E8E5DF;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#9E9B95;">
                        Keep going — consistency makes champions. 🎯<br/>PathAI Study Tracker
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Resend congrats error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("Congrats email error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
