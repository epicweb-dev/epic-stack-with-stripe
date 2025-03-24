# Epic Stack with Stripe

This is an example of the Epic Stack working with Stripe. It's intentionally
minimal.

## About the Integration

This example demonstrates a simple Stripe integration that uses Stripe's Payment
Links and Customer Portal for subscription management. The implementation is
intentionally minimal and doesn't use the Stripe SDK, instead making direct API
calls to Stripe's REST API. This approach keeps the integration lightweight and
easy to understand.

Key aspects of this integration:

- **No SDK Required**: Uses direct API calls to Stripe's REST API instead of
  their SDK
- **Payment Links**: Uses Stripe's hosted Payment Links for checkout,
  eliminating the need for complex checkout implementation
- **Customer Portal**: Leverages Stripe's Customer Portal for subscription
  management
- **Two-Tier Pricing**: Includes Basic and Premium subscription tiers
- **Local Testing**: Includes mock handlers for local development and testing
- **Server-Side Only**: All Stripe API calls are made server-side for security

The integration is designed to be simple yet production-ready, with proper error
handling, type safety, and testing support.

## Stripe Setup

### 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the
   [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
3. Create two products in your Stripe Dashboard:
   - Basic Plan (e.g., $5/month)
   - Premium Plan (e.g., $15/month)
4. Create Payment Links for both products in the Stripe Dashboard:
   - Go to Products > Select Product > Payment Links
   - Create a payment link for each product
   - Save the payment link URLs

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_BASIC_PRODUCT="prod_..." # Your Basic Plan product ID from Stripe
STRIPE_PREMIUM_PRODUCT="prod_..." # Your Premium Plan product ID from Stripe
STRIPE_SECRET_KEY="sk_test_..." # Your Stripe secret key
STRIPE_BASIC_PAYMENT_LINK="https://..." # Your Basic Plan payment link
STRIPE_PREMIUM_PAYMENT_LINK="https://..." # Your Premium Plan payment link
```

You'll need to set those on your production environment as well.

### 3. Database Changes

The application adds a `stripeId` column to the User table. Run the following
command to apply the database changes:

```bash
npx prisma migrate dev
```

### 4. Features

The integration provides the following features:

- Subscription management page at `/settings/profile/subscription`
- Basic and Premium plan subscription options
- Customer portal access for managing subscriptions
- Subscription status display
- Cancellation date display (if applicable)

### 5. Testing

The application includes mock handlers for Stripe API calls in
`tests/mocks/stripe.ts`. These mocks simulate:

- Checkout session retrieval
- Subscription data retrieval
- Customer portal session creation

### 6. Security Considerations

- Never commit your Stripe secret key to version control
- Use environment variables for all sensitive Stripe data
- The application uses Stripe's Customer Portal for secure subscription
  management
- All Stripe API calls are made server-side to protect sensitive data

### 7. Development Workflow

1. Set up your Stripe account and products
2. Add the required environment variables
3. Run database migrations
4. Test the subscription flow using Stripe's test mode
5. Use Stripe's webhook testing tool to verify subscription events

For more information about Stripe integration, visit the
[Stripe Documentation](https://stripe.com/docs).
