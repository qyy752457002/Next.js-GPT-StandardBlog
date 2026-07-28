import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import {
  faCheck,
  faCoins,
  faMinus,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import {
  MAX_PACK_QUANTITY,
  MIN_PACK_QUANTITY,
  TOKEN_PACKS,
  TOKENS_PER_POST,
} from "../lib/tokenPacks";
import { getAppProps } from "../utils/getAppProps";

const initialQuantities = Object.fromEntries(
  TOKEN_PACKS.map((pack) => [pack.id, 1])
);

export default function TokenTopup(props) {
  const [loadingPack, setLoadingPack] = useState(null);
  const [quantities, setQuantities] = useState(initialQuantities);

  const adjustQuantity = (packId, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [packId]: Math.min(
        MAX_PACK_QUANTITY,
        Math.max(MIN_PACK_QUANTITY, (prev[packId] || 1) + delta)
      ),
    }));
  };

  const handleBuy = async (packId) => {
    if (loadingPack) return;
    const quantity = quantities[packId] || 1;
    try {
      setLoadingPack(packId);
      const result = await fetch(`/api/addTokens`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ pack: packId, quantity }),
      });
      const json = await result.json();
      if (json?.session?.url) {
        window.location.href = json.session.url;
      } else {
        alert(json?.message || "Unable to start checkout. Please try again.");
        setLoadingPack(null);
      }
    } catch (e) {
      console.error(e);
      alert("Unable to start checkout. Please try again.");
      setLoadingPack(null);
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 via-white to-cyan-50">
      <div className="min-h-full flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 text-green-600 mb-4">
              <FontAwesomeIcon icon={faCoins} className="text-2xl" />
            </div>
            <h1 className="my-0 text-3xl md:text-4xl text-slate-800">
              Top up tokens
            </h1>
            <p className="mt-3 text-slate-500">
              Tokens power AI blog generation. Each post costs{" "}
              <strong>{TOKENS_PER_POST}</strong> tokens. Larger packs cost less
              per token.
            </p>
          </div>

          <div className="mb-8 rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-5 py-4 flex items-center justify-between shadow-sm max-w-lg mx-auto">
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

          <div className="grid gap-5 md:grid-cols-3">
            {TOKEN_PACKS.map((pack) => {
              const quantity = quantities[pack.id] || 1;
              const totalTokens = pack.tokens * quantity;
              const totalPrice = pack.unitPrice * quantity;
              const isLoading = loadingPack === pack.id;
              const isFeatured = pack.id === "pro";
              const postsWorth = totalTokens / TOKENS_PER_POST;

              return (
                <div
                  key={pack.id}
                  className={`relative rounded-xl border bg-white shadow-xl shadow-slate-200/60 overflow-hidden flex flex-col ${
                    isFeatured
                      ? "border-green-400 ring-2 ring-green-200"
                      : "border-slate-200"
                  }`}
                >
                  {pack.badge && (
                    <div
                      className={`absolute top-3 right-3 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        isFeatured
                          ? "bg-green-500 text-white"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {pack.badge}
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-slate-800 to-cyan-800 px-5 py-5 text-white">
                    <div className="text-sm uppercase tracking-wider text-cyan-200">
                      {pack.name}
                    </div>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-4xl font-bold">{pack.tokens}</span>
                      <span className="pb-1 text-cyan-100">tokens each</span>
                    </div>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-2xl font-bold">{pack.priceLabel}</span>
                      {pack.compareAtLabel && (
                        <span className="text-sm text-cyan-200/80 line-through">
                          {pack.compareAtLabel}
                        </span>
                      )}
                      <span className="text-sm text-cyan-100/80">/ pack</span>
                    </div>
                    <p className="mt-2 text-sm text-cyan-100/90">
                      {pack.description}
                    </p>
                  </div>

                  <div className="px-5 py-4 space-y-4 flex-1">
                    <div>
                      <div className="text-sm font-semibold text-slate-700 mb-2">
                        Quantity
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(pack.id, -1)}
                          disabled={
                            quantity <= MIN_PACK_QUANTITY || !!loadingPack
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Decrease ${pack.name} quantity`}
                        >
                          <FontAwesomeIcon icon={faMinus} />
                        </button>
                        <div className="min-w-[2.5rem] text-center text-2xl font-bold text-slate-800">
                          {quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(pack.id, 1)}
                          disabled={
                            quantity >= MAX_PACK_QUANTITY || !!loadingPack
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Increase ${pack.name} quantity`}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">
                        Total: <strong>{totalTokens}</strong> tokens ·{" "}
                        <strong>${totalPrice}</strong>
                      </div>
                    </div>

                    {[
                      "Secure checkout with Stripe",
                      "Tokens added instantly after payment",
                      `${postsWorth} post${
                        postsWorth > 1 ? "s" : ""
                      } worth of generation`,
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

                  <div className="px-5 pb-5">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => handleBuy(pack.id)}
                      disabled={!!loadingPack}
                    >
                      {isLoading
                        ? "Redirecting to checkout..."
                        : `Buy ${quantity} × ${pack.name}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            You will be redirected to Stripe to complete payment.
          </p>
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
