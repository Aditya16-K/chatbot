import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

export const stripeWebhooks = async (req, res) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Stripe secret key
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // verify webhook signature
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
      case 'payment_intent.succeeded':
        {
          const paymentIntent = event.data.object;

          // fetch sessions related to this paymentIntent
          const sessionList = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id, // use .id, not _id
          });

          const session = sessionList.data[0];
          const { transaction: transactionId, appId } = session.metadata;

          if (!transactionId) {
            console.log('Transaction ID missing in metadata');
            return res.status(400).send('Transaction ID missing');
          }

          if (appId === 'chatbot') {
            // find the transaction which is not yet paid
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

            // update credits in user account
            await User.updateOne(
              { _id: transaction.userId },
              { $inc: { credits: transaction.credits } }
            );

            // update payment status
            transaction.isPaid = true;
            await transaction.save();

            console.log('Transaction marked as paid:', transactionId);
          } else {
            console.log('Ignored event: Invalid appId');
          }
        }
        break;

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
