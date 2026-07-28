import { getSession } from "@auth0/nextjs-auth0";
import stripeInit from "stripe";
import { getPackPriceId, getTokenPack } from "../../lib/tokenPacks";

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { user } = session;
  const packId = req.body?.pack;
  const pack = getTokenPack(packId);
  const priceId = getPackPriceId(packId);

  if (!pack || !priceId || !priceId.startsWith("price_")) {
    return res.status(400).json({
      message:
        "Invalid pack. Use basic, plus, or pro, and ensure STRIPE_PRICE_*_ID are Stripe Price ids (price_...).",
    });
  }

  const protocol =
    process.env.NODE_ENV === "development" ? "http://" : "https://";
  const host = req.headers.host;

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${protocol}${host}/success`,
    payment_intent_data: {
      metadata: {
        sub: user.sub,
        tokens: String(pack.tokens),
        pack: pack.id,
      },
    },
    metadata: {
      sub: user.sub,
      tokens: String(pack.tokens),
      pack: pack.id,
    },
  });

  res.status(200).json({ session: checkoutSession });
}
