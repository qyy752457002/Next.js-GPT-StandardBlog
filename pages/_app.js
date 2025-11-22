// 导入全局样式
import "../styles/globals.css";
// 导入Auth0的UserProvider
import { UserProvider } from "@auth0/nextjs-auth0/client";
// 导入Google字体
import { DM_Sans, DM_Serif_Display } from "@next/font/google";
// 导入FontAwesome的样式
import "@fortawesome/fontawesome-svg-core/styles.css";
// 导入FontAwesome的配置
import { config } from "@fortawesome/fontawesome-svg-core";
// 导入PostsProvider
import { PostsProvider } from "../context/postsContext";
// 关闭FontAwesome自动添加CSS
config.autoAddCss = false;

// 导入DM Sans字体
const dmSans = DM_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

// 导入DM Serif Display字体
const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

/*

1. **`Component` 和 `pageProps`**：
   - `Component` 代表当前页面组件，无论是 `index.js` 还是其他页面，它们都会通过 `MyApp` 组件渲染出来。
   - `pageProps` 是传递给当前页面组件的属性，这些属性可以通过 `getStaticProps` 或 `getServerSideProps` 等方法获取。

2. **`getLayout`**：
   - `getLayout` 是一个自定义布局函数的机制。通过这个函数，你可以为特定页面定义独特的布局，而不影响其他页面。
   - 如果页面组件中定义了 `getLayout`，它就会被调用，否则就会使用默认的 `(page) => page` 函数，直接返回页面内容，不做额外处理。

3. **全局状态和布局**：
   - 你在 `MyApp` 中添加了 `UserProvider` 和 `PostsProvider` 作为上下文提供器，这意味着所有页面都可以访问这些上下文数据。
   - `main` 标签包裹了 `Component`，并应用了全局样式类，这确保了全局样式在所有页面生效。

通过这种方式，所有页面都继承了 `MyApp` 组件中的全局逻辑和配置，同时也允许页面根据需要使用自定义布局。

这种灵活性是 Next.js 强大的一部分。

总结一下，这种组件化的设计使得页面既能共享全局状态，又能灵活地自定义布局，非常适合大型应用程序的开发。😊
*/

// 定义MyApp组件
function MyApp({ Component, pageProps }) {
  // 获取布局
  // 如果 Component.getLayout 存在且为真值，那么它将被用作布局函数；
  // 否则，将使用一个简单的函数 (page) => page，这个函数直接返回传入的页面内容，不进行任何修改
  const getLayout = Component.getLayout || ((page) => page);
  // 返回组件
  return (
    <UserProvider>
      <PostsProvider>
        <main
          className={`${dmSans.variable} ${dmSerifDisplay.variable} font-body`}
        >
          {getLayout(<Component {...pageProps} />, pageProps)}
        </main>
      </PostsProvider>
    </UserProvider>
  );
}

// 导出MyApp组件
export default MyApp;
