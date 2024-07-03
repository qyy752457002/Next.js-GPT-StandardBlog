import { withPageAuthRequired } from "@auth0/nextjs-auth0"; // 导入Auth0的身份验证组件
import { faBrain } from "@fortawesome/free-solid-svg-icons"; // 导入大脑图标
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; // 导入FontAwesome图标组件
import { useRouter } from "next/router"; // 导入Next.js的路由工具
import { useState } from "react"; // 导入React的useState Hook
import { AppLayout } from "../../components/AppLayout"; // 导入应用程序布局组件
import { getAppProps } from "../../utils/getAppProps"; // 导入获取应用程序属性的工具函数

export default function NewPost(props) {
  const router = useRouter(); // 初始化路由工具
  const [topic, setTopic] = useState(""); // 定义状态变量topic和更新函数setTopic
  const [keywords, setKeywords] = useState(""); // 定义状态变量keywords和更新函数setKeywords
  const [generating, setGenerating] = useState(false); // 定义状态变量generating和更新函数setGenerating

  const handleSubmit = async (e) => {
    e.preventDefault(); // 阻止表单默认提交行为
    setGenerating(true); // 设置生成状态为true
    try {
      const response = await fetch(`/api/generatePost`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ topic, keywords }), // 发送请求主体
      });
      const json = await response.json(); // 解析响应JSON
      console.log("RESULT: ", json); // 打印结果
      if (json?.postId) {
        router.push(`/post/${json.postId}`); // 跳转到新生成的帖子页面
      }
    } catch (e) {
      setGenerating(false); // 发生错误时重置生成状态
    }
  };

  return (
    <div className="h-full overflow-hidden">
      {!!generating && ( // 生成中显示的内容
        <div className="text-green-500 flex h-full animate-pulse w-full flex-col justify-center items-center">
          <FontAwesomeIcon icon={faBrain} className="text-8xl" /> {/* 显示大脑图标 */}
          <h6>Generating...</h6> {/* 显示生成中 */}
        </div>
      )}
      {!generating && ( // 未生成时显示的内容
        <div className="w-full h-full flex flex-col overflow-auto">
          <form
            onSubmit={handleSubmit}
            className="m-auto w-full max-w-screen-sm bg-slate-100 p-4 rounded-md shadow-xl border border-slate-200 shadow-slate-200"
          >
            <div>
              <label>
                <strong>Generate a blog post on the topic of:</strong>
                {/* 生成博客文章的主题 */}
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80} // 限制文本输入长度
              />
            </div>
            <div>
              <label>
                <strong>Targeting the following keywords:</strong>
                {/* 目标关键词 */}
              </label>
              <textarea
                className="resize-none border border-slate-500 w-full block my-2 px-4 py-2 rounded-sm"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                maxLength={80} // 限制文本输入长度
              />
              <small className="block mb-2">Separate keywords with comma</small>
              {/* 用逗号分隔关键词 */}
            </div>
            <button
              type="submit"
              className="btn"
              disabled={!topic.trim() || !keywords.trim()} // 主题和关键词不能为空
            >
              Generate
              {/* 生成按钮 */}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

NewPost.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>; // 使用应用程序布局组件
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx); // 获取应用程序属性

    if (!props.availableTokens) {
      return {
        redirect: {
          destination: "/token-topup",
          permanent: false, // 如果没有可用的Token，则重定向到Token充值页面
        },
      };
    }

    return {
      props, // 返回获取到的属性
    };
  },
});
