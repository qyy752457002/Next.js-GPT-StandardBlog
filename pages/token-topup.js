// 导入 withPageAuthRequired 函数，用于处理页面身份验证
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
// 导入 AppLayout 组件，用于渲染应用程序布局
import { AppLayout } from "../components/AppLayout";
// 导入 getAppProps 函数，用于获取应用程序属性
import { getAppProps } from "../utils/getAppProps";

// 导出 TokenTopup 函数，用于处理 TOKEN 充值
export default function TokenTopup(props) {
  // 定义处理点击事件的函数
  const handleClick = async () => {
    // 发起 POST 请求到 /api/addTokens
    const result = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/addTokens`, {
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

// page 表示页面组件的React元素，对应 TokenTopup() 组件
// pageProps 表示传递给页面组件的属性，对应 getServerSideProps返回的props
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

/*
  TokenTopup.getLayout 与 getServerSideProps的作用: 

  - TokenTopup.getLayout用于为TokenTopup页面定义自定义布局。

  - getServerSideProps用于在服务器端获取页面数据，并在页面加载时传递这些数据。通过withPageAuthRequired包装，确保只有经过身份验证的用户才能访问该页面。
*/

/*
  底层逻辑: 

  第一步. getServerSideProps：在请求时运行，获取页面所需的数据，并返回一个包含props对象的对象。

  第二步. props传递给页面组件：getServerSideProps返回的props对象会作为页面组件 TokenTopup 的属性。

  第三步. getLayout函数：定义页面的布局。在这个函数中，pageProps包含了从getServerSideProps返回的props。

  -------------------------------------------------------------------------------------------------------

  综上所述，getServerSideProps返回的props会传递给页面组件 TokenTopup，然后通过getLayout函数，props会进一步传递给布局组件。
  这种机制确保了页面在加载时能够接收到所有必要的数据，并且可以将这些数据传递给布局组件以便于渲染。
*/