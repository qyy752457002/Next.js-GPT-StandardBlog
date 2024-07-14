// 导入withPageAuthRequired函数，用于验证用户身份
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
// 导入AppLayout组件，用于布局
import { AppLayout } from "../components/AppLayout";
// 导入getAppProps函数，用于获取页面属性
import { getAppProps } from "../utils/getAppProps";

// 定义Success组件
export default function Success() {
  // 返回一个包含感谢信息的div
  return (
    <div>
      <h1>Thank you for your purchase!</h1>
    </div>
  );
}

// 定义Success组件的布局

// page 表示页面组件的React元素，对应 Success() 组件
// pageProps 表示传递给页面组件的属性，对应 getServerSideProps返回的props
Success.getLayout = function getLayout(page, pageProps) {
  // 返回一个包含页面和页面属性的AppLayout组件
  return <AppLayout {...pageProps}>{page}</AppLayout>;
};

// 定义getServerSideProps函数，用于获取服务器端页面属性
export const getServerSideProps = withPageAuthRequired({
  // 定义异步函数，用于获取页面属性
  async getServerSideProps(ctx) {
    // 调用getAppProps函数，获取页面属性
    const props = await getAppProps(ctx);
    // 返回包含页面属性的props对象
    return {
      props,
    };
  },
});

/*
  Success.getLayout 与 getServerSideProps的作用: 

  - Success.getLayout用于为Success页面定义自定义布局。

  - getServerSideProps用于在服务器端获取页面数据，并在页面加载时传递这些数据。通过withPageAuthRequired包装，确保只有经过身份验证的用户才能访问该页面。
*/

/*
  底层逻辑: 

  第一步. getServerSideProps：在请求时运行，获取页面所需的数据，并返回一个包含props对象的对象。

  第二步. props传递给页面组件：getServerSideProps返回的props对象会作为页面组件 Success 的属性。

  第三步. getLayout函数：定义页面的布局。在这个函数中，pageProps包含了从getServerSideProps返回的props。

  -------------------------------------------------------------------------------------------------------

  综上所述，getServerSideProps返回的props会传递给页面组件 Success，然后通过getLayout函数，props会进一步传递给布局组件。
  这种机制确保了页面在加载时能够接收到所有必要的数据，并且可以将这些数据传递给布局组件以便于渲染。
*/