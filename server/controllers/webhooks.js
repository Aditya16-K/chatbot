import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';
import { response } from 'express';

export const stripeWebhooks = async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET);
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntend = event.data.object;
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntend.id,
        });
        const session = sessionList.data[0];
        const { transactionId, appId } = session.metadata;

        if (appId === 'chatbot') {
          const transaction = await Transaction.findOne({
            _id: transactionId,
            isPaid: false,
          });

          //update credit in user account
          await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
          );

          //Update credit payment status
          transaction.isPaid = true;
          await transaction.save();
        } else {
          return response.json({
            received: true,
            message: 'Ignored event: Invalid app',
          });
        }
        break;
      }

      default:
        console.log('unhandled event type:', event.type);
        break;
    }
    response.json({ received: true });
  } catch (error) {
    console.log('Webhook processing error:', error);
    response.status(500).send('Internal server error');
  }
};
