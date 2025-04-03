import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { Link, useLoaderData } from 'react-router'
import { GeneralErrorBoundary } from '#app/components/error-boundary.js'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { requireUserId } from '#app/utils/auth.server.js'
import { getHints } from '#app/utils/client-hints.js'
import { prisma } from '#app/utils/db.server.js'
import { getCustomerProducts } from '#app/utils/stripe.server.js'
import { type Route } from './+types/profile.subscription.ts'
import { type BreadcrumbHandle } from './profile.tsx'

export const handle: BreadcrumbHandle & SEOHandle = {
	breadcrumb: <Icon name="stripe">Subscription</Icon>,
	getSitemapEntries: () => null,
}

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { stripeId: true },
	})
	const productsData = user.stripeId
		? await getCustomerProducts(user.stripeId)
		: { products: [], cancelAt: null }
	const { timeZone } = getHints(request)
	return {
		products: productsData.products,
		cancelAtDisplay: productsData.cancelAt
			? new Date(productsData.cancelAt).toLocaleDateString('en-US', {
					timeZone: timeZone ?? 'Etc/UTC',
					dateStyle: 'full',
				})
			: null,
		basicPaymentUrl: process.env.STRIPE_BASIC_PAYMENT_LINK,
		premiumPaymentUrl: process.env.STRIPE_PREMIUM_PAYMENT_LINK,
	}
}

export default function Subscribe() {
	const data = useLoaderData<typeof loader>()
	const { products, cancelAtDisplay } = data
	const isBasic = products.includes('basic')
	const isPremium = products.includes('premium')
	const isSubscribed = products.length > 0
	return (
		<div className="container">
			{isSubscribed ? (
				<p>You are currently subscribed to {products.join(', ')}</p>
			) : (
				<p>You are not subscribed to any products.</p>
			)}
			{cancelAtDisplay ? (
				<p className="text-destructive">
					Your subscription will be cancelled at{' '}
					<strong>{cancelAtDisplay}</strong>
				</p>
			) : null}
			{isSubscribed ? null : (
				<table className="my-4 w-full table-auto">
					<thead>
						<tr>
							<th className="px-4 py-2">Plan</th>
							<th className="px-4 py-2">Description</th>
							<th className="px-4 py-2">Price</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td className="border px-4 py-2">Basic</td>
							<td className="border px-4 py-2">Description of basic plan</td>
							<td className="border px-4 py-2">$5/month</td>
						</tr>
						<tr>
							<td className="border px-4 py-2">Premium</td>
							<td className="border px-4 py-2">Description of premium plan</td>
							<td className="border px-4 py-2">$15/month</td>
						</tr>
					</tbody>
				</table>
			)}
			<div className="flex justify-between gap-2">
				{isBasic || isPremium ? null : (
					<Button asChild variant="secondary">
						<a href={data.basicPaymentUrl}>Subscribe to Basic</a>
					</Button>
				)}
				{isPremium ? null : (
					<Button asChild>
						<a href={data.premiumPaymentUrl}>Subscribe to Premium</a>
					</Button>
				)}
			</div>
			{isSubscribed ? (
				<Link className="underline" to="/manage-subscription">
					Manage your subscription
				</Link>
			) : null}
		</div>
	)
}

export function ErrorBoundary() {
	// POLISH: make the error message more helpful
	return <GeneralErrorBoundary />
}
