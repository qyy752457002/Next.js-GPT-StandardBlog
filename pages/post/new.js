import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { faBrain, faCoins } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { AppLayout } from "../../components/AppLayout";
import { getAppProps } from "../../utils/getAppProps";

const TOKENS_PER_POST = 10;

export default function NewPost(props) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  const hasEnoughTokens = (props.availableTokens ?? 0) >= TOKENS_PER_POST;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasEnoughTokens) return;
    setGenerating(true);
    try {
      const response = await fetch(`/api/generatePost`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ topic, keywords }),
      });
      const json = await response.json();
      console.log("RESULT: ", json);
      if (json?.postId) {
        router.push(`/post/${json.postId}`);
      } else {
        setGenerating(false);
      }
    } catch (e) {
      setGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {!!generating && (
        <div className="text-green-500 flex h-full animate-pulse w-full flex-col justify-center items-center">
          <FontAwesomeIcon icon={faBrain} className="text-8xl" />
          <h6>Generating...</h6>
        </div>
      )}
      {!generating && (
        <div className="w-full h-full flex flex-col overflow-auto">
          <form
            onSubmit={handleSubmit}
            className="m-auto w-full max-w-screen-sm bg-slate-100 p-4 rounded-md shadow-xl border border-slate-200 shadow-slate-200"
          >
            <div>
              <label>
                <strong>Generate a blog post on the topic of:</strong>
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
              />
            </div>
            <div>
              <label>
                <strong>Targeting the following keywords:</strong>
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                maxLength={80}
              />
              <small className="block mb-2">
                Separate keywords with a comma
              </small>
            </div>

            {!hasEnoughTokens && (
              <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon
                    icon={faCoins}
                    className="mt-0.5 text-amber-600"
                  />
                  <div>
                    <p className="font-semibold">
                      Not enough tokens to generate a post.
                    </p>
                    <p className="mt-1 text-amber-800/90">
                      Each post costs{" "}
                      <strong>{TOKENS_PER_POST}</strong> tokens. You currently
                      have <strong>{props.availableTokens ?? 0}</strong>.{" "}
                      <Link
                        href="/token-topup"
                        className="font-semibold text-green-700 underline hover:text-green-800"
                      >
                        Top up tokens
                      </Link>{" "}
                      to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn"
              disabled={
                !topic.trim() || !keywords.trim() || !hasEnoughTokens
              }
            >
              Generate
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// 设置页面布局
NewPost.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

// 服务器端数据获取，确保用户已登录并且有可用的令牌
export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx);
    return {
      props,
    };
  },
});

/*
  NewPost.getLayout 与 getServerSideProps的作用: 

  - NewPost.getLayout用于为Post页面定义自定义布局。

  - getServerSideProps用于在服务器端获取页面数据，并在页面加载时传递这些数据。通过withPageAuthRequired包装，确保只有经过身份验证的用户才能访问该页面。
*/

/*
  底层逻辑: 

  第一步. getServerSideProps：在请求时运行，获取页面所需的数据，并返回一个包含props对象的对象。

  第二步. props传递给页面组件：getServerSideProps返回的props对象会作为页面组件 NewPost 的属性。

  第三步. getLayout函数：定义页面的布局。在这个函数中，pageProps包含了从getServerSideProps返回的props。

  -------------------------------------------------------------------------------------------------------

  综上所述，getServerSideProps返回的props会传递给页面组件 NewPost，然后通过getLayout函数，props会进一步传递给布局组件。
  这种机制确保了页面在加载时能够接收到所有必要的数据，并且可以将这些数据传递给布局组件以便于渲染。
*/
