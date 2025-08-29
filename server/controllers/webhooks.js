import Strip from 'stripe';
import Transaction from '../models/transaction';
import User from '../models/User';

export const stripeWebhooks = async (req, res) => {
  const stripe = new Strip(process.env.STRIPE_WEBHOOKS_SECRET);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOKS_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        {
          const paymentIntent = event.data.object;
          const sessionList = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent._id,
          });
          const session = sessionList.data[0];
          const { transactionId, appId } = session.metadata;

          if (appId === 'chatbot') {
            const transaction = await Transaction.findOne({
              _id: transactionId,
              isPaid: false,
            });

            // update credits in user account
            await User.updateOne(
              { _id: transaction.userId },
              { $inc: { credits: transaction.credits } }
            );

            //Update credit payment status
            transaction.isPaid = true;
            await transaction.save();
          } else {
            return res.json({
              received: true,
              message: 'Ignored event Invalid app',
            });
          }
          break;
        }

        break;
        console.log('unhandled event type:', event.type);
      default:
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('webhook processing error:', error);
    res.status(500).send('Internal Server Error');
  }
};
