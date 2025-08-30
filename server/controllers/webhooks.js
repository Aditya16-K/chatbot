import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ✅ yaha SECRET KEY use hoga

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOKS_SECRET // ✅ yaha WEBHOOKS_SECRET use hoga
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // ✅ ye sahi event hai
        const session = event.data.object;

        const { transaction, appId } = session.metadata;
        if (!transaction) {
          return response
            .status(400)
            .send('Transaction ID missing in metadata');
        }

        if (appId === 'chatbot') {
          const txn = await Transaction.findOne({
            _id: transaction,
            isPaid: false,
          });
          if (!txn) break;

          // Update user credits
          await User.updateOne(
            { _id: txn.userId },
            { $inc: { credits: txn.credits } }
          );

          txn.isPaid = true;
          await txn.save();
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
        break;
    }

    response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    response.status(500).send('Internal Server Error');
  }
};
