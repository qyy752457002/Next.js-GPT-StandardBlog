import clientPromise from "./mongodb";

function isDuplicateKeyError(error) {
  return (
    error?.code === 11000 ||
    error?.code === "11000" ||
    /E11000/.test(error?.message || "")
  );
}

/**
 * Credit tokens once per Stripe PaymentIntent (idempotent).
 * Uses PaymentIntent id as MongoDB _id so uniqueness is enforced immediately
 * (no separate index build race between webhook and /success).
 */
export async function fulfillTokensFromPaymentIntent(paymentIntent) {
  const paymentIntentId = paymentIntent?.id;
  const auth0Id = paymentIntent?.metadata?.sub;
  const tokens = Number.parseInt(
    String(paymentIntent?.metadata?.tokens ?? ""),
    10
  );

  if (
    !paymentIntentId ||
    !auth0Id ||
    !Number.isInteger(tokens) ||
    tokens <= 0
  ) {
    return { credited: false, reason: "invalid_metadata" };
  }

  const client = await clientPromise;
  const db = client.db("BlogStandard");
  const purchases = db.collection("tokenPurchases");

  let upserted = false;
  try {
    const result = await purchases.updateOne(
      { _id: paymentIntentId },
      {
        $setOnInsert: {
          auth0Id,
          tokens,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    upserted = Boolean(result.upsertedId);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { credited: false, reason: "already_fulfilled" };
    }
    throw error;
  }

  if (!upserted) {
    return { credited: false, reason: "already_fulfilled" };
  }

  await db.collection("users").updateOne(
    { auth0Id },
    {
      $inc: { availableTokens: tokens },
      $setOnInsert: { auth0Id },
    },
    { upsert: true }
  );

  return { credited: true, tokens };
}
