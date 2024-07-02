// 导入 withPageAuthRequired 函数，用于处理页面身份验证
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
// 导入 AppLayout 组件，用于渲染应用程序布局
import { AppLayout } from "../components/AppLayout";
// 导入 getAppProps 函数，用于获取应用程序属性
import { getAppProps } from "../utils/getAppProps";

// 导出 TokenTopup 函数，用于处理 TOKEN 充值
export default function TokenTopup() {
  // 定义处理点击事件的函数
  const handleClick = async () => {
    // 发起 POST 请求到 /api/addTokens
    const result = await fetch(`/api/addTokens`, {
      method: "POST",
    });
    
    // 解析响应数据
    const json = await result.json(); 
    console.log('RESULT: ', json);
    // 跳转到响应数据中的 session.url
    window.location.href = json.session.url;
  };

  // 返回应用程序布局
  return (
    <div>
      <h1>this is the token topup</h1>
      <button className="btn" onClick={handleClick}>
        Add tokens
      </button>
    </div>
  );
}

// 设置 TokenTopup 的布局
TokenTopup.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

// 导出 getServerSideProps 函数，用于处理服务端渲染
export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    // 获取应用程序属性
    const props = await getAppProps(ctx);
    // 返回应用程序属性
    return {
      props,
    };
  },
});