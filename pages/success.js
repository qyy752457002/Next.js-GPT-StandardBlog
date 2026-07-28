import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { faCheckCircle, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import stripeInit from "stripe";
import { AppLayout } from "../components/AppLayout";
import { fulfillTokensFromPaymentIntent } from "../lib/fulfillTokens";
import { getAppProps } from "../utils/getAppProps";

const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

export default function Success(props) {
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="min-h-full flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md text-center rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 px-8 py-10">
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="text-5xl text-green-500 mb-4"
          />
          <h1 className="my-0 text-3xl text-slate-800">Payment successful</h1>
          <p className="mt-3 text-slate-500">
            Thank you for your purchase. Your tokens have been added to your
            account.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
            <span className="font-semibold">
              {props.availableTokens ?? 0} tokens available
            </span>
          </div>

          <Link href="/post/new" className="btn mt-8 hover:no-underline">
            Create a new post
          </Link>
        </div>
      </div>
    </div>
  );
}

Success.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const sessionId = ctx.query.session_id;
    const userSession = await getSession(ctx.req, ctx.res);

    // Stripe redirects here before the webhook may have credited tokens.
    // Fulfill idempotently from the Checkout Session so balance is current.
    if (typeof sessionId === "string" && sessionId && userSession?.user?.sub) {
      try {
        const checkoutSession = await stripe.checkout.sessions.retrieve(
          sessionId,
          { expand: ["payment_intent"] }
        );

        const paid =
          checkoutSession.payment_status === "paid" ||
          checkoutSession.status === "complete";
        const belongsToUser =
          checkoutSession.metadata?.sub === userSession.user.sub;

        if (!paid) {
          console.log("SUCCESS SKIP: unpaid session", sessionId);
        } else if (!belongsToUser) {
          console.log("SUCCESS SKIP: metadata.sub mismatch", {
            sessionSub: checkoutSession.metadata?.sub,
            userSub: userSession.user.sub,
          });
        } else {
          let paymentIntent = checkoutSession.payment_intent;

          if (typeof paymentIntent === "string") {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntent);
          }

          if (paymentIntent?.id) {
            const result = await fulfillTokensFromPaymentIntent({
              id: paymentIntent.id,
              metadata: {
                ...checkoutSession.metadata,
                ...paymentIntent.metadata,
              },
            });
            console.log("SUCCESS TOKEN FULFILLMENT:", result, paymentIntent.id);
          } else {
            console.log("SUCCESS SKIP: missing payment_intent", sessionId);
          }
        }
      } catch (error) {
        console.error("Failed to sync tokens from Checkout Session:", error);
      }
    }

    const props = await getAppProps(ctx);
    return {
      props,
    };
  },
});
