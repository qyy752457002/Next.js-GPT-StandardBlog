import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import clientPromise from "../../lib/mongodb";

export default withApiAuthRequired(async function handler(req, res) {
  try {
    const {
      user: { sub },
    } = await getSession(req, res);
    const client = await clientPromise;
    const db = client.db("BlogStandard");
    const userProfile = await db.collection("users").findOne({
      auth0Id: sub,
    });

    if (!userProfile) {
      return res.status(200).json({ posts: [] });
    }

    const { lastPostDate } = req.body || {};

    const query = {
      userId: userProfile._id,
    };

    // 加载当前列表之后更旧的全部帖子
    if (lastPostDate) {
      query.created = { $lt: new Date(lastPostDate) };
    }

    const posts = await db
      .collection("posts")
      .find(query)
      .sort({ created: -1 })
      .toArray();

    res.status(200).json({
      posts: posts.map(({ _id, created, userId, ...rest }) => ({
        _id: _id.toString(),
        created: created ? new Date(created).toISOString() : "",
        title: rest.title ?? "",
        metaDescription: rest.metaDescription ?? "",
        keywords: rest.keywords ?? "",
        postContent: rest.postContent ?? "",
        topic: rest.topic ?? "",
      })),
    });
  } catch (e) {
    console.error("ERROR FETCHING POSTS: ", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
