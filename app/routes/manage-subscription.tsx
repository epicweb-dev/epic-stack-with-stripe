import { redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server.js'
import { getDomainUrl } from '#app/utils/misc.js'
import { createCustomerPortalSession } from '#app/utils/stripe.server.js'
import { type Route } from './+types/manage-subscription.ts'

export async function loader({ request }: Route.LoaderArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUniqueOrThrow({
		where: { id: userId },
		select: { stripeId: true },
	})
	if (!user.stripeId) {
		return redirect('/settings/profile/subscription')
	}
	const session = await createCustomerPortalSession(user.stripeId, {
		returnUrl: getDomainUrl(request) + '/settings/profile/subscription',
	})
	return redirect(session.url)
}
