import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { faCheckCircle, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { AppLayout } from "../components/AppLayout";
import { getAppProps } from "../utils/getAppProps";

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
    const props = await getAppProps(ctx);
    return {
      props,
    };
  },
});
