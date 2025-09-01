import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ Correct key

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;
  try {
    // ✅ Verify webhook with webhook secret
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('⚠️ Webhook signature verification failed:', error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { transaction: transactionId, appId } = session.metadata;

        if (appId === 'chatbot') {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          if (transaction) {
            // ✅ Update user's credits
            await User.updateOne(
              { _id: transaction.userId },
              { $inc: { credits: transaction.credits } }
            );

            // ✅ Mark transaction as paid
            transaction.isPaid = true;
            await transaction.save();

            console.log('✅ Credits updated for user:', transaction.userId);
          }
        } else {
          console.log('Ignored event: Invalid app');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    response.status(500).send('Internal server error');
  }
};
