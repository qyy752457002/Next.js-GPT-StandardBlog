import { withPageAuthRequired } from "@auth0/nextjs-auth0"; // 引入 Auth0 的认证保护函数
import { faBrain } from "@fortawesome/free-solid-svg-icons"; // 引入 FontAwesome 图标库中的大脑图标
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // 引入 FontAwesome 图标组件
import { useRouter } from "next/router"; // 引入 Next.js 的路由钩子
import { useState } from "react"; // 引入 React 的 useState 钩子
import { AppLayout } from "../../components/AppLayout"; // 引入应用布局组件
import { getAppProps } from "../../utils/getAppProps"; // 引入获取应用属性的实用函数

export default function NewPost(props) {
  const router = useRouter(); // 初始化路由器
  const [topic, setTopic] = useState(""); // 设置话题的状态
  const [keywords, setKeywords] = useState(""); // 设置关键词的状态
  const [generating, setGenerating] = useState(false); // 设置生成状态

  // 表单提交处理函数
  const handleSubmit = async (e) => {
    e.preventDefault(); // 防止默认表单提交行为
    setGenerating(true); // 设置生成状态为 true
    try {
      const response = await fetch(`/api/generatePost`, {
        method: "POST", // 使用 POST 方法
        headers: {
          "content-type": "application/json", // 设置请求头为 JSON
        },
        body: JSON.stringify({ topic, keywords }), // 将话题和关键词作为请求体
      });
      const json = await response.json(); // 解析响应为 JSON
      console.log("RESULT: ", json); // 输出结果
      if (json?.postId) {
        router.push(`/post/${json.postId}`); // 如果有 postId，跳转到相应帖子页面
      }
    } catch (e) {
      setGenerating(false); // 捕获异常，设置生成状态为 false
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {!!generating && ( // 如果正在生成
        <div className="text-green-500 flex h-full animate-pulse w-full flex-col justify-center items-center">
          <FontAwesomeIcon icon={faBrain} className="text-8xl" />{" "}
          {/* 显示大脑图标 */}
          <h6>Generating...</h6> {/* 显示生成中提示 */}
        </div>
      )}
      {!generating && ( // 如果没有在生成
        <div className="w-full h-full flex flex-col overflow-auto">
          <form
            onSubmit={handleSubmit} // 绑定表单提交处理函数
            className="m-auto w-full max-w-screen-sm bg-slate-100 p-4 rounded-md shadow-xl border border-slate-200 shadow-slate-200"
          >
            <div>
              <label>
                <strong>Generate a blog post on the topic of:</strong>{" "}
                {/* 输入话题的标签 */}
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={topic} // 绑定话题状态
                onChange={(e) => setTopic(e.target.value)} // 更新话题状态
                maxLength={80} // 最大输入长度
              />
            </div>
            <div>
              <label>
                <strong>Targeting the following keywords:</strong>{" "}
                {/* 输入关键词的标签 */}
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={keywords} // 绑定关键词状态
                onChange={(e) => setKeywords(e.target.value)} // 更新关键词状态
                maxLength={80} // 最大输入长度
              />
              <small className="block mb-2">
                Separate keywords with a comma {/* 关键词用逗号分隔的小提示 */}
              </small>
            </div>
            <button
              type="submit"
              className="btn"
              disabled={!topic.trim() || !keywords.trim() || props.availableTokens < 10} // 当话题或关键词为空，或者availableTokens的数量小于10，禁用按钮
            >
              Generate {/* 提交按钮 */}
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
    const props = await getAppProps(ctx); // 获取应用属性

    if (!props.availableTokens) {
      // 如果没有可用的令牌
      return {
        redirect: {
          destination: "/token-topup", // 重定向到令牌充值页面
          permanent: false,
        },
      };
    }

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
