import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

// Stripe client: use Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // verify webhook signature using webhook secret
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOKS_SECRET
    );
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { transaction, appId } = session.metadata;

        if (!transaction) {
          return res.status(400).send('Transaction ID missing in metadata');
        }

        if (appId === 'chatbot') {
          const txn = await Transaction.findOne({
            _id: transaction,
            isPaid: false,
          });

          if (!txn) break; // already paid or not found

          // ✅ Update user credits
          await User.updateOne(
            { _id: txn.userId },
            { $inc: { credits: txn.credits } }
          );

          // ✅ Mark transaction as paid
          txn.isPaid = true;
          await txn.save();

          console.log(`✅ Transaction completed for user: ${txn.userId}`);
        } else {
          console.log('⚠️ Ignored webhook: invalid appId');
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
};
