import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "../lib/mongodb";

// 获取应用程序的属性
export const getAppProps = async (ctx) => {
  // 获取用户会话信息
  const userSession = await getSession(ctx.req, ctx.res);
  // 获取MongoDB客户端
  const client = await clientPromise;
  // 选择数据库
  const db = client.db("BlogStandard");
  // 查找与用户会话关联的用户信息
  const user = await db.collection("users").findOne({
    auth0Id: userSession.user.sub,
  });

  // 如果未找到用户，则返回默认值
  if (!user) {
    return {
      availableTokens: 0, // 可用令牌数量为0
      posts: [], // 没有帖子
    };
  }

  // 查找用户的最新5篇帖子
  const posts = await db
    .collection("posts")
    .find({
      userId: user._id, // 用户ID匹配
    })
    .limit(5) // 限制返回结果为5篇帖子
    .sort({
      created: -1, // 按创建日期降序排序
    })
    .toArray();

  // 返回应用程序需要的属性
  return {
    availableTokens: user.availableTokens, // 返回用户的可用令牌数量
    posts: posts.map(({ created, _id, userId, ...rest }) => ({
      _id: _id.toString(), // 将帖子ID转换为字符串格式
      created: created.toString(), // 将创建日期转换为字符串格式
      ...rest, // 其余帖子属性
    })),
    postId: ctx.params?.postId || null, // 返回上下文中的postId参数，如果不存在则为null
  };
};
