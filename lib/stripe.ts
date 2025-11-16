import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

// Price IDs from your Stripe dashboard
export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}
if (!STRIPE_PRO_PRICE_ID) {
  throw new Error('STRIPE_PRO_PRICE_ID is not set in environment variables')
}
if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables')
}

// Initialize Stripe client
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10', // Use a consistent API version
  typescript: true,
})

/**
 * Retrieves a user's Stripe Customer ID from the DB,
 * or creates a new one in Stripe if it doesn't exist.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<string> {
  // 1. Check if user has a subscription and customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId
  }

  // 2. Create a new customer in Stripe
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId,
    },
  })

  // 3. Save the new customer ID to the user's subscription record
  await prisma.subscription.update({
    where: { userId },
    data: {
      stripeCustomerId: customer.id,
    },
  })

  return customer.id
}