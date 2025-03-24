import { faker } from '@faker-js/faker'
import { HttpResponse, http, type HttpHandler } from 'msw'
import { requireHeader } from './utils.ts'

const { json } = HttpResponse

export const handlers: Array<HttpHandler> = [
	http.get(
		`https://api.stripe.com/v1/checkout/sessions/:sessionId`,
		async ({ request }) => {
			requireHeader(request.headers, 'Authorization')

			return json({ customer: faker.string.uuid() })
		},
	),
	http.get(`https://api.stripe.com/v1/subscriptions`, async ({ request }) => {
		requireHeader(request.headers, 'Authorization')

		return json({
			data: [
				{
					cancel_at: null,
					items: {
						data: [{ plan: { product: process.env.STRIPE_PREMIUM_PRODUCT } }],
					},
				},
			],
		})
	}),
	http.post(
		`https://api.stripe.com/v1/billing_portal/sessions`,
		async ({ request }) => {
			requireHeader(request.headers, 'Authorization')

			return json({
				url: `/fake-stripe-session/${faker.string.uuid()}`,
			})
		},
	),
]
