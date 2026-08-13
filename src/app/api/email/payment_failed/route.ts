import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Verten <hei@verten.no>',
        to: email,
        subject: 'Betaling feila — oppdater betalingsmetode',
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FAF8F4; margin: 0; padding: 0;">
            <div style="max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #E2DED6;">
              <div style="background: #2D5A27; padding: 32px 40px;">
                <h1 style="color: #fff; font-size: 28px; margin: 0; font-weight: 600;">Verten</h1>
              </div>
              <div style="padding: 40px;">
                <h2 style="font-size: 22px; margin: 0 0 12px; color: #1A1A18;">Betalinga feila</h2>
                <p style="color: #6B6B65; line-height: 1.6; margin: 0 0 24px;">
                  Vi klarte ikkje å trekkje abonnementsbetalinga di. Dette kan skje viss kortet er utgått eller det er for lite pengar.
                </p>
                <div style="background: #FEF3C7; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #F59E0B;">
                  <p style="margin: 0; color: #92400E; font-size: 14px;">
                    ⚠ Tilgangen din kan verte avgrensa viss betalinga ikkje ordnar seg innan 3 dagar.
                  </p>
                </div>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/abonnement"
                  style="display: inline-block; background: #2D5A27; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Oppdater betalingsmetode
                </a>
                <p style="color: #6B6B65; font-size: 13px; margin: 24px 0 0;">
                  Treng du hjelp? <a href="mailto:hei@verten.no" style="color: #2D5A27;">hei@verten.no</a>
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
