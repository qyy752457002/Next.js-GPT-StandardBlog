import { getSession } from "@auth0/nextjs-auth0";
import clientPromise from "../lib/mongodb";

const mapPost = ({ created, _id, userId, ...rest }) => ({
  _id: _id.toString(),
  created: created ? new Date(created).toISOString() : "",
  title: rest.title ?? "",
  metaDescription: rest.metaDescription ?? "",
  keywords: rest.keywords ?? "",
  postContent: rest.postContent ?? "",
  topic: rest.topic ?? "",
});

export const getAppProps = async (ctx) => {
  const userSession = await getSession(ctx.req, ctx.res);
  const client = await clientPromise;
  const db = client.db("BlogStandard");
  const user = await db.collection("users").findOne({
    auth0Id: userSession.user.sub,
  });

  if (!user) {
    return {
      availableTokens: 0,
      posts: [],
      hasMorePosts: false,
    };
  }

  // 按创建时间倒序；多取 1 条判断是否还有更多
  const posts = await db
    .collection("posts")
    .find({
      userId: user._id,
    })
    .limit(6)
    .sort({
      created: -1,
    })
    .toArray();

  const hasMorePosts = posts.length > 5;

  return {
    availableTokens: user.availableTokens ?? 0,
    posts: posts.slice(0, 5).map(mapPost),
    hasMorePosts,
    postId: ctx.params?.postId || null,
  };
};
