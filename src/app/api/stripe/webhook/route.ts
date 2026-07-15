import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const subscriptionId = session.subscription as string

    if (userId) {
      await supabase.from('user_profiles').upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        subscription_status: 'trialing',
        trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    await supabase.from('user_profiles').update({
      subscription_status: subscription.status,
    }).eq('stripe_subscription_id', subscription.id)
  }

  return NextResponse.json({ received: true })
}
