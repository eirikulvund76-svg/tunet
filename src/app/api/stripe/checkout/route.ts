import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()
    if (!userId || !email) {
      return NextResponse.json({ error: 'Mangler userId eller email' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 30,
        metadata: { userId },
      },
      metadata: { userId },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/velkommen?betalt=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
