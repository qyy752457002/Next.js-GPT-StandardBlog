import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import clientPromise from "../../lib/mongodb";

export default withApiAuthRequired(async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

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
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await db.collection("posts").deleteMany({
      userId: userProfile._id,
    });

    res.status(200).json({ success: true });
  } catch (e) {
    console.log("ERROR TRYING TO DELETE ALL POSTS: ", e);
    res.status(500).json({ success: false, message: e.message });
  }
});
