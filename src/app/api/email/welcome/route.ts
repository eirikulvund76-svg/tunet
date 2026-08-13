import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, houseName } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Verten <hei@verten.no>',
        to: email,
        subject: 'Velkommen til Verten!',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF8F4; margin: 0; padding: 0;">
            <div style="max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E2DED6;">
              <div style="background: #2D5A27; padding: 32px 40px;">
                <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 600;">Verten</h1>
                <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Driftsystem for Airbnb-vertar</p>
              </div>
              <div style="padding: 40px;">
                <h2 style="font-size: 22px; margin: 0 0 12px; color: #1A1A18;">Velkommen${houseName ? ` til ${houseName}` : ''}! 🎉</h2>
                <p style="color: #6B6B65; line-height: 1.6; margin: 0 0 24px;">
                  Du har starta ein 30 dagars gratis prøveperiode. Betalinga startar fyrst etter prøveperioden — ingen overraskingar.
                </p>

                <div style="background: #EEF3ED; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                  <p style="margin: 0 0 8px; font-weight: 600; color: #2D5A27;">Kome i gang:</p>
                  <ul style="margin: 0; padding-left: 20px; color: #2D5A27; line-height: 1.8;">
                    <li>Gå til Innstillingar og legg inn Airbnb iCal-lenka di</li>
                    <li>Synkroniser kalenderen for å hente bookingane dine</li>
                    <li>Tilpass turnover-oppgåvene til ditt hus</li>
                  </ul>
                </div>

                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                  style="display: inline-block; background: #2D5A27; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Gå til appen
                </a>

                <p style="color: #6B6B65; font-size: 13px; margin: 24px 0 0; line-height: 1.6;">
                  Spørsmål? Send oss ein e-post på <a href="mailto:hei@verten.no" style="color: #2D5A27;">hei@verten.no</a> — vi svarar innan éin arbeidsdag.
                </p>
              </div>
              <div style="padding: 20px 40px; border-top: 1px solid #E2DED6; background: #FAF8F4;">
                <p style="color: #6B6B65; font-size: 12px; margin: 0;">
                  © 2026 Verten · <a href="${process.env.NEXT_PUBLIC_APP_URL}/personvern" style="color: #6B6B65;">Personvern</a> · <a href="${process.env.NEXT_PUBLIC_APP_URL}/vilkaar" style="color: #6B6B65;">Vilkår</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    })

    if (!res.ok) throw new Error('Kunne ikkje sende e-post')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
