import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import clientPromise from "../../lib/mongodb";

// 使用Auth0保护API路由
export default withApiAuthRequired(async function handler(req, res) {
  try {
    // 获取当前用户的会话信息
    const {
      user: { sub },
    } = await getSession(req, res);
    // 获取MongoDB客户端
    const client = await clientPromise;
    // 选择数据库
    const db = client.db("BlogStandard");
    // 查找当前用户的资料
    const userProfile = await db.collection("users").findOne({
      auth0Id: sub,
    });

    // 从请求体中获取lastPostDate和getNewerPosts
    const { lastPostDate, getNewerPosts } = req.body;

    // 根据lastPostDate和getNewerPosts查找用户的帖子
    const posts = await db
      .collection("posts")
      .find({
        userId: userProfile._id,
        // 根据getNewerPosts确定比较方式，如果为true，则查找创建日期大于lastPostDate的帖子，否则查找创建日期小于lastPostDate的帖子
        created: { [getNewerPosts ? "$gt" : "$lt"]: new Date(lastPostDate) },
      })
      // 如果getNewerPosts为false，则限制返回的帖子数量为5
      .limit(getNewerPosts ? 0 : 5)
      // 按创建日期降序排序
      .sort({ created: -1 })
      .toArray();

    console.log("Posts got: ", posts);

    // 返回查找到的帖子
    res.status(200).json({ posts });
    return;
  } catch (e) {
    // 捕获错误
    console.error("ERROR FETCHING POSTS: ", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
