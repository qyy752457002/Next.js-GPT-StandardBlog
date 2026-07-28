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
 * PaymentIntent id is the MongoDB _id — uniqueness is immediate, no secondary index.
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

  // Legacy unique index on paymentIntentId collides when that field is omitted
  // (MongoDB unique indexes only allow one missing/null value).
  try {
    await purchases.dropIndex("paymentIntentId_1");
  } catch (error) {
    if (error?.codeName !== "IndexNotFound" && error?.code !== 27) {
      // Non-fatal if index already gone; rethrow unexpected errors
      if (!/index not found/i.test(error?.message || "")) {
        console.warn("dropIndex paymentIntentId_1:", error?.message || error);
      }
    }
  }

  try {
    await purchases.insertOne({
      _id: paymentIntentId,
      auth0Id,
      tokens,
      createdAt: new Date(),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { credited: false, reason: "already_fulfilled" };
    }
    throw error;
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
