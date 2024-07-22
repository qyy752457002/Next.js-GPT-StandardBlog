import { useUser } from '@auth0/nextjs-auth0/client'; // 导入 Auth0 用户钩子
import { faCoins } from '@fortawesome/free-solid-svg-icons'; // 导入 FontAwesome 图标
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // 导入 FontAwesome 组件
import Image from 'next/image'; // 导入 Next.js 的 Image 组件
import Link from 'next/link'; // 导入 Next.js 的 Link 组件
import { useContext, useEffect } from 'react'; // 导入 React 的钩子
import PostsContext from '../../context/postsContext'; // 导入自定义的帖子上下文
import { Logo } from '../Logo'; // 导入 Logo 组件

export const AppLayout = ({
  children, // 子组件
  availableTokens, // 可用的令牌数量
  posts: postsFromSSR, // 服务端渲染获取的帖子
  postId, // 当前帖子的 ID
  postCreated, // 当前帖子的创建时间
}) => {
  const { user } = useUser(); // 获取当前用户信息

  const { setPostsFromSSR, posts, getPosts, noMorePosts } =
    useContext(PostsContext); // 从上下文中获取状态和函数

  useEffect(() => {
    setPostsFromSSR(postsFromSSR); // 设置服务端渲染的帖子
    if (postId) {
      const exists = postsFromSSR.find((post) => post._id === postId); // 查找当前帖子是否存在
      if (!exists) {
        getPosts({ getNewerPosts: true, lastPostDate: postCreated }); // 如果不存在，则获取最新的帖子
      }
    }
  }, [postsFromSSR, setPostsFromSSR, postId, postCreated, getPosts]); // 依赖项变化时重新执行

  return (
    <div className="grid grid-cols-[300px_1fr] h-screen max-h-screen">
      <div className="flex flex-col text-white overflow-hidden">
        <div className="bg-slate-800 px-2">
          <Logo /> {/* 显示 Logo */}
          <Link href="/post/new" className="btn">
            New post {/* 链接到创建新帖子的页面 */}
          </Link>
          <Link href="/token-topup" className="block mt-2 text-center">
            <FontAwesomeIcon icon={faCoins} className="text-yellow-500" />
            <span className="pl-1">{availableTokens} tokens available</span> {/* 显示可用的令牌数量 */}
          </Link>
        </div>
        <div className="px-4 flex-1 overflow-auto bg-gradient-to-b from-slate-800 to-cyan-800">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/post/${post._id}`}
              className={`py-1 border border-white/0 block text-ellipsis overflow-hidden whitespace-nowrap my-1 px-2 bg-white/10 cursor-pointer rounded-sm ${
                postId === post._id ? 'bg-white/20 border-white' : ''
              }`}
            >
              {post.topic} {/* 显示帖子的主题 */}
            </Link>
          ))}
          {!noMorePosts && (
            <div
              onClick={() => {
                if ( posts.length > 0 ) {
                  getPosts({ lastPostDate: posts[posts.length - 1].created }); // 获取更多帖子
                } else {
                  // Handle the case where there are no posts, e.g., fetch posts from the beginning or show a message.
                  console.warn('No posts available to load more.');
                }
              }}
              className="hover:underline text-sm text-slate-400 text-center cursor-pointer mt-4"
            >
              Load more posts {/* 显示加载更多帖子的按钮 */}
            </div>
          )}
        </div>
        <div className="bg-cyan-800 flex items-center gap-2 border-t border-t-black/50 h-20 px-2">
          {!!user ? (
            <>
              <div className="min-w-[50px]">
                <Image
                  src={user.picture} // 显示用户头像
                  alt={user.name} // 用户名作为图片的替代文本
                  height={50}
                  width={50}
                  className="rounded-full"
                />
              </div>
              <div className="flex-1">
                <div className="font-bold">{user.email}</div> {/* 显示用户邮箱 */}
                <Link className="text-sm" href="/api/auth/logout">
                  Logout {/* 链接到登出页面 */}
                </Link>
              </div>
            </>
          ) : (
            <Link href="/api/auth/login">Login</Link> // 链接到登录页面
          )}
        </div>
      </div>
      {children} {/* 渲染子组件 */}
    </div>
  );
};
