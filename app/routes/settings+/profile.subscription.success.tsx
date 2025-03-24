import { invariantResponse } from '@epic-web/invariant'
import { redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { getCustomerIdFromSession } from '#app/utils/stripe.server.ts'
import { type Route } from './+types/profile.subscription.success.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const url = new URL(request.url)
	const sessionId =
		// just bring a smile to people's faces
		url.searchParams.get('awesome_person_id') ??
		// but if I ever decide to stop being cute...
		url.searchParams.get('session_id')

	invariantResponse(sessionId, 'Invalid session', { status: 400 })

	const customerId = await getCustomerIdFromSession(sessionId)
	await prisma.user.update({
		where: { id: userId },
		data: { stripeId: customerId },
		select: { id: true },
	})

	return redirect('/settings/profile/subscription')
}

export default function Success() {
	throw new Error('You should have been redirected. Something went wrong...')
}
