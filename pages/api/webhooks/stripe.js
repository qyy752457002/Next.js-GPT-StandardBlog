import Cors from "micro-cors";
import stripeInit from "stripe";
import verifyStripe from "@webdeveducation/next-verify-stripe";
import { fulfillTokensFromPaymentIntent } from "../../../lib/fulfillTokens";

const cors = Cors({
  allowMethods: ["POST", "HEAD"],
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const handler = async (req, res) => {
  if (req.method === "POST") {
    let event;
    try {
      event = await verifyStripe({
        req,
        stripe,
        endpointSecret,
      });
    } catch (e) {
      console.log("ERROR: ", e);
      return res.status(400).json({ message: "Webhook verification failed" });
    }

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const result = await fulfillTokensFromPaymentIntent(paymentIntent);
        console.log("TOKEN FULFILLMENT: ", result, paymentIntent.id);
        break;
      }
      default:
        console.log("UNHANDLED EVENT: ", event.type);
    }

    res.status(200).json({ received: true });
  }
};

export default cors(handler);
