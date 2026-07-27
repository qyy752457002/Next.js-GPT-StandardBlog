import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { faCheck, faCoins, faPenFancy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { getAppProps } from "../utils/getAppProps";

export default function TokenTopup(props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const result = await fetch(`/api/addTokens`, {
        method: "POST",
      });
      const json = await result.json();
      if (json?.session?.url) {
        window.location.href = json.session.url;
      } else {
        alert("Unable to start checkout. Please try again.");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Unable to start checkout. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="min-h-full flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
              <FontAwesomeIcon icon={faCoins} className="text-2xl" />
            </div>
            <h1 className="my-0 text-3xl md:text-4xl text-slate-800">
              Top up tokens
            </h1>
            <p className="mt-3 text-slate-500">
              Tokens power AI blog generation. Each post costs 10 tokens.
            </p>
          </div>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-5 py-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-sm text-slate-500">Current balance</div>
              <div className="text-2xl font-bold text-slate-800 mt-0.5">
                {props.availableTokens ?? 0}{" "}
                <span className="text-base font-medium text-slate-500">
                  tokens
                </span>
              </div>
            </div>
            <FontAwesomeIcon
              icon={faCoins}
              className="text-3xl text-yellow-500"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-cyan-800 px-6 py-5 text-white">
              <div className="text-sm uppercase tracking-wider text-cyan-200">
                Token pack
              </div>
              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-bold">10</span>
                <span className="pb-1 text-cyan-100">tokens</span>
              </div>
              <div className="mt-2 text-sm text-cyan-100/90 flex items-center gap-2">
                <FontAwesomeIcon icon={faPenFancy} />
                Enough for 1 full blog post
              </div>
            </div>

            <div className="px-6 py-5 space-y-3">
              {[
                "Secure checkout with Stripe",
                "Tokens added instantly after payment",
                "Use anytime to generate SEO-ready posts",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 text-slate-600 text-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6">
              <button
                type="button"
                className="btn"
                onClick={handleClick}
                disabled={loading}
              >
                {loading ? "Redirecting to checkout..." : "Add tokens"}
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                You will be redirected to Stripe to complete payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

TokenTopup.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx);
    return {
      props,
    };
  },
});
