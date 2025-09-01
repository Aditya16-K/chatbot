import Stripe from 'stripe';
import Transaction from '../models/transaction.js';
import User from '../models/User.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log('✅ Webhook signature verified');
  } catch (error) {
    console.error('⚠️ Webhook signature verification failed:', error.message);
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    console.log('🔔 Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('📦 Checkout session object:', session);

        // Ensure metadata exists
        if (!session.metadata || !session.metadata.transaction) {
          console.log('❌ No transaction metadata found');
          break;
        }

        const transactionId = session.metadata.transaction;
        const appId = session.metadata.appId;

        if (appId !== 'chatbot') {
          console.log('❌ Ignored event: Invalid appId');
          break;
        }

        const transaction = await Transaction.findOne({
          _id: transactionId,
          isPaid: false,
        });

        if (!transaction) {
          console.log('❌ Transaction not found or already paid');
          break;
        }

        // Update user's credits
        const updatedUser = await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { credits: transaction.credits } },
          { new: true }
        );

        console.log(
          `✅ Credits updated for user ${updatedUser._id}: ${updatedUser.credits} total`
        );

        // Mark transaction as paid
        transaction.isPaid = true;
        await transaction.save();
        console.log('💰 Transaction marked as paid:', transaction._id);

        break;
      }

      default:
        console.log('⚠️ Unhandled event type:', event.type);
    }

    response.json({ received: true });
  } catch (error) {
    console.error('🚨 Webhook processing error:', error);
    response.status(500).send('Internal server error');
  }
};
