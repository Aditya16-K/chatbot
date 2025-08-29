import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOKS_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;

        // Fetch sessions for this paymentIntent
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });
        const session = sessionList.data[0];
        if (!session) return res.status(404).send('Session not found');

        // Fix: metadata key match
        const { transaction: transactionId, appId } = session.metadata;

        if (!transactionId)
          return res.status(400).send('Transaction ID missing in metadata');

        if (appId === 'chatbot') {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          if (!transaction) {
            console.log(
              'Transaction not found or already paid:',
              transactionId
            );
            return res.status(404).send('Transaction not found');
          }

          // Update user credits
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          // Mark transaction as paid
          transaction.isPaid = true;
          await transaction.save();

          console.log('Transaction completed:', transactionId);
        } else {
          console.log('Ignored event: Invalid appId');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
};
