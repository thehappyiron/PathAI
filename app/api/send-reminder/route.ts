import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, displayName, totalMinutes } = body;

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const userName = displayName || "Learner";
    const mins = typeof totalMinutes === "number" ? totalMinutes : 0;

    const { data, error } = await resend.emails.send({
      from: "PathAI <onboarding@resend.dev>",
      to: [email],
      subject: "📚 PathAI misses you — Your streak is fading!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0; padding:0; background:#F5F2ED; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F2ED; padding:40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:#0D0D0D; padding:32px 40px; text-align:center;">
                      <h1 style="margin:0; font-size:28px; color:#F5F2ED; font-weight:700; letter-spacing:-0.02em;">
                        Path<span style="color:#C9A84C;">AI</span>
                      </h1>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="margin:0 0 8px; font-size:24px; color:#0D0D0D; font-weight:700;">
                        Hey ${userName} 👋
                      </h2>
                      <p style="margin:0 0 24px; font-size:16px; color:#52514E; line-height:1.65;">
                        We noticed you've only spent <strong style="color:#9B2335;">${mins} minute${mins !== 1 ? "s" : ""}</strong> studying today. 
                        That's below your 5-minute daily goal!
                      </p>
                      
                      <!-- Stat Card -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:rgba(155,35,53,0.06); border:1px solid rgba(155,35,53,0.15); border-radius:12px; margin-bottom:28px;">
                        <tr>
                          <td style="padding:20px 24px; text-align:center;">
                            <div style="font-size:42px; font-weight:700; color:#9B2335;">${mins}<span style="font-size:18px; color:#9E9B95;"> / 5 min</span></div>
                            <div style="font-size:12px; color:#9E9B95; text-transform:uppercase; letter-spacing:0.06em; margin-top:4px;">Today's Activity</div>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 28px; font-size:16px; color:#52514E; line-height:1.65;">
                        Even a quick 5-minute review can strengthen neural pathways and keep your learning momentum alive. 
                        Your future self will thank you! 🚀
                      </p>

                      <!-- CTA Button -->
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <a href="https://pathai.vercel.app/analyze" 
                               style="display:inline-block; background:#C9A84C; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; padding:14px 36px; border-radius:999px;">
                              Start a Quick Analysis →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:24px 40px; background:#FAFAF8; border-top:1px solid #E8E5DF; text-align:center;">
                      <p style="margin:0; font-size:12px; color:#9E9B95;">
                        You're receiving this because you're a PathAI user. <br/>
                        Consistency is the key to mastery. 🎯
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
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Reminder email sent:", data);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error("Send reminder error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
