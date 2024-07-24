import { getSession, withPageAuthRequired } from '@auth0/nextjs-auth0'; // 导入 Auth0 相关函数
import { faHashtag } from '@fortawesome/free-solid-svg-icons'; // 导入 FontAwesome 图标
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // 导入 FontAwesome 组件
import { ObjectId } from 'mongodb'; // 导入 MongoDB 的 ObjectId
import { useRouter } from 'next/router'; // 导入 Next.js 路由钩子
import { useContext, useState } from 'react'; // 导入 React 的钩子
import { AppLayout } from '../../components/AppLayout'; // 导入自定义的布局组件
import PostsContext from '../../context/postsContext'; // 导入自定义的帖子上下文
import clientPromise from '../../lib/mongodb'; // 导入 MongoDB 客户端承诺
import { getAppProps } from '../../utils/getAppProps'; // 导入自定义的应用属性获取函数

export default function Post(props) {
  const router = useRouter(); // 使用 Next.js 路由钩子
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // 状态钩子用于显示删除确认
  const { deletePost } = useContext(PostsContext); // 从上下文中获取删除帖子函数

  const handleDeleteConfirm = async () => { // 处理删除确认
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH0_BASE_URL}/api/deletePost`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ postId: props.id }), // 发送要删除帖子的 ID
      });
      const json = await response.json();
      if (json.success) { // 如果删除成功
        deletePost(props.id); // 从上下文中删除帖子
        router.replace(`/post/new`); // 重定向到新帖子页面
      }
    } catch (e) {
      console.error(e); // 捕获并打印错误
    }
  };

  return (
    <div className="overflow-auto h-full">
      <div className="max-w-screen-sm mx-auto">
        <div className="text-sm font-bold mt-6 p-2 bg-stone-200 rounded-sm">
          SEO title and meta description {/* SEO 标题和元描述 */}
        </div>
        <div className="p-4 my-2 border border-stone-200 rounded-md">
          <div className="text-blue-600 text-2xl font-bold">{props.title}</div> {/* 显示帖子标题 */}
          <div className="mt-2">{props.metaDescription}</div> {/* 显示帖子元描述 */}
        </div>
        <div className="text-sm font-bold mt-6 p-2 bg-stone-200 rounded-sm">
          Keywords {/* 关键词 */}
        </div>
        <div className="flex flex-wrap pt-2 gap-1">
          {props.keywords.split(',').map((keyword, i) => (
            <div key={i} className="p-2 rounded-full bg-slate-800 text-white">
              <FontAwesomeIcon icon={faHashtag} /> {keyword} {/* 显示关键词 */}
            </div>
          ))}
        </div>
        <div className="text-sm font-bold mt-6 p-2 bg-stone-200 rounded-sm">
          Blog post {/* 博客文章 */}
        </div>
        <div dangerouslySetInnerHTML={{ __html: props.postContent || '' }} /> {/* 显示帖子内容 */}
        <div className="my-4">
          {!showDeleteConfirm && (
            <button
              className="btn bg-red-600 hover:bg-red-700"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete post {/* 显示删除按钮 */}
            </button>
          )}
          {!!showDeleteConfirm && (
            <div>
              <p className="p-2 bg-red-300 text-center">
                Are you sure you want to delete this post? This action is
                irreversible {/* 显示删除确认消息 */}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn bg-stone-600 hover:bg-stone-700"
                >
                  cancel {/* 取消删除按钮 */}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn bg-red-600 hover:bg-red-700"
                >
                  confirm delete {/* 确认删除按钮 */}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// page 表示页面组件的React元素，对应 Post() 组件
// pageProps 表示传递给页面组件的属性，对应 getServerSideProps返回的props
Post.getLayout = function getLayout(page, pageProps) {
  return <AppLayout {...pageProps}>{page}</AppLayout>; // 使用自定义布局组件
};

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const props = await getAppProps(ctx); // 获取应用属性
    const userSession = await getSession(ctx.req, ctx.res); // 获取用户会话
    const client = await clientPromise; // 获取 MongoDB 客户端
    const db = client.db('BlogStandard'); // 连接到指定数据库
    const user = await db.collection('users').findOne({
      auth0Id: userSession.user.sub, // 查找当前用户
    });
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(ctx.params.postId), // 查找指定 ID 的帖子
      userId: user._id, // 确保帖子属于当前用户
    });

    if (!post) { // 如果帖子不存在
      return {
        redirect: {
          destination: '/post/new', // 重定向到新帖子页面
          permanent: false,
        },
      };
    }

    return {
      props: {
        id: ctx.params.postId, // 帖子 ID
        postContent: post.postContent, // 帖子内容
        title: post.title, // 帖子标题
        metaDescription: post.metaDescription, // 帖子元描述
        keywords: post.keywords, // 帖子关键词
        postCreated: post.created.toString(), // 帖子创建时间
        ...props, // 其他属性
      },
    };
  },
});

/*
  Post.getLayout 与 getServerSideProps的作用: 

  - Post.getLayout用于为Post页面定义自定义布局。

  - getServerSideProps用于在服务器端获取页面数据，并在页面加载时传递这些数据。通过withPageAuthRequired包装，确保只有经过身份验证的用户才能访问该页面。
*/

/*
  底层逻辑: 

  第一步. getServerSideProps：在请求时运行，获取页面所需的数据，并返回一个包含props对象的对象。

  第二步. props传递给页面组件：getServerSideProps返回的props对象会作为页面组件 Post 的属性。

  第三步. getLayout函数：定义页面的布局。在这个函数中，pageProps包含了从getServerSideProps返回的props。

  -------------------------------------------------------------------------------------------------------

  综上所述，getServerSideProps返回的props会传递给页面组件 Post，然后通过getLayout函数，props会进一步传递给布局组件。
  这种机制确保了页面在加载时能够接收到所有必要的数据，并且可以将这些数据传递给布局组件以便于渲染。
*/

