import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('⚠️ Webhook verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { transaction: transactionId, appId } = session.metadata;

      if (appId === 'chatbot') {
        const transaction = await Transaction.findOne({
          _id: transactionId,
          isPaid: false,
        });

        if (transaction) {
          // Update user credits
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          // Mark transaction as paid
          transaction.isPaid = true;
          await transaction.save();

          console.log('✅ Credits updated for user:', transaction.userId);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal server error');
  }
};
