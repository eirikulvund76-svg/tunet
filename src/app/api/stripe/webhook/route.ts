import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

async function sendEmail(type: 'welcome' | 'payment_failed', email: string, extra?: Record<string, string>) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...extra }),
    })
  } catch {
    // E-post feila — logg men ikkje krasj webhook
    console.error(`Klarte ikkje sende ${type} e-post til ${email}`)
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: 'Ugyldig webhook-signatur' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    const email = session.customer_email ?? ''

    if (userId) {
      await supabase.from('user_profiles').upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: 'trialing',
        trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })

      // Hent husnamn for velkomst-e-post
      const { data: prof } = await supabase
        .from('user_profiles')
        .select('house_name')
        .eq('id', userId)
        .single()

      await sendEmail('welcome', email, { houseName: prof?.house_name ?? '' })
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription
    const userId = subscription.metadata?.userId

    if (userId) {
      await supabase.from('user_profiles').update({
        subscription_status: subscription.status,
      }).eq('stripe_subscription_id', subscription.id)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription

    await supabase.from('user_profiles').update({
      subscription_status: 'inactive',
    }).eq('stripe_subscription_id', subscription.id)
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice
    const email = invoice.customer_email ?? ''

    if (email) {
      await sendEmail('payment_failed', email)

      // Oppdater status
      const customerId = invoice.customer as string
      await supabase.from('user_profiles').update({
        subscription_status: 'past_due',
      }).eq('stripe_customer_id', customerId)
    }
  }

  return NextResponse.json({ received: true })
}
