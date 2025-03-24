import { invariantResponse } from '@epic-web/invariant'
import { z } from 'zod'
import { cache, cachified } from './cache.server.ts'

const SessionSchema = z.object({
	customer: z.string(),
})

export async function getCustomerIdFromSession(sessionId: string) {
	const response = await fetch(
		`https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
		{ headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } },
	)
	if (!response.ok) {
		console.error(await response.text())
		throw new Error('Failed to retrieve session details')
	}
	const json = await response.json()

	const result = SessionSchema.safeParse(json)
	invariantResponse(result.success, () => result.error?.issues.join('\n') ?? '')

	return result.data.customer
}

const SubscriptionSchema = z.object({
	data: z.array(
		z.object({
			cancel_at: z.number().nullable(),
			items: z.object({
				data: z.array(
					z.object({
						plan: z.object({ product: z.string() }),
					}),
				),
			}),
		}),
	),
})

const ProductsSchema = z.array(z.enum(['basic', 'premium']))
const ProductsDataSchema = z.object({
	products: ProductsSchema,
	cancelAt: z.number().nullable(),
})

const ProductMap = {
	[process.env.STRIPE_BASIC_PRODUCT]: 'basic',
	[process.env.STRIPE_PREMIUM_PRODUCT]: 'premium',
} as const

export async function getCustomerProducts(customerId: string) {
	const productsData = await cachified({
		key: `customer-products-${customerId}`,
		cache,
		checkValue: ProductsDataSchema,
		ttl: 1000 * 10,
		swr: 1000 * 60 * 60 * 24 * 7,
		getFreshValue: async () => {
			const params = new URLSearchParams({
				customer: customerId,
			})
			const response = await fetch(
				`https://api.stripe.com/v1/subscriptions?${params}`,
				{
					headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
				},
			)
			if (!response.ok) {
				console.error(await response.text())
				throw new Error('Failed to retrieve customer products')
			}
			const json = await response.json()
			const { data } = SubscriptionSchema.parse(json)
			const products = data
				.flatMap(d => d.items.data.map(i => ProductMap[i.plan.product]))
				.filter(Boolean)
			const cancelAt =
				data
					.map(d => d.cancel_at)
					.filter(Boolean)
					.sort()[0] ?? null
			return { products, cancelAt }
		},
	})

	return productsData
}

const BillingPortalSessionSchema = z.object({
	url: z.string(),
})

export async function createCustomerPortalSession(
	customerId: string,
	{ returnUrl }: { returnUrl: string },
) {
	const response = await fetch(
		'https://api.stripe.com/v1/billing_portal/sessions',
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({
				customer: customerId,
				return_url: returnUrl,
			}),
		},
	)

	if (!response.ok) {
		console.error(await response.text())
		throw new Error('Failed to create customer portal session')
	}

	const json = await response.json()

	const result = BillingPortalSessionSchema.safeParse(json)
	invariantResponse(result.success, () => result.error?.issues.join('\n') ?? '')

	return result.data
}
