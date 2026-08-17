import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { Configuration, OpenAIApi } from "openai";
import clientPromise from "../../lib/mongodb";

// Next.js 13.1.6 不会读取这个字段（需要 >= 13.5），真正生效的是 vercel.json 里的 maxDuration
export const config = {
  maxDuration: 60,
};

function parseGeneratedPost(raw) {
  const text = (raw || "").trim();
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) {
      throw new Error("OpenAI did not return valid JSON");
    }
    return JSON.parse(text.slice(start, end + 1));
  }
}

async function retryRequest(requestFunction, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFunction();
    } catch (error) {
      if (i === retries - 1) throw error;
      if (error.response && error.response.status === 429) {
        console.log(`Rate limit hit, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
}

export default withApiAuthRequired(async function handler(req, res) {
  const { user } = await getSession(req, res);
  const client = await clientPromise;
  const db = client.db("BlogStandard");
  const userProfile = await db.collection("users").findOne({
    auth0Id: user.sub,
  });

  if (userProfile?.availableTokens - 10 < 0) {
    res.status(403).json({ error: "Insufficient tokens" });
    return;
  }

  const openaiConfig = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 50000,
  });

  const openai = new OpenAIApi(openaiConfig);
  const { topic, keywords } = req.body;

  if (!topic || !keywords) {
    res.status(422).json({ error: "Topic and keywords are required" });
    return;
  }

  if (topic.length > 80 || keywords.length > 80) {
    res.status(422).json({
      error: "Topic and keywords must be under 80 characters",
    });
    return;
  }

  try {
    // 一次请求同时生成正文、标题和 meta，避免 3 次串行调用把 Hobby 超时打满
    const completion = await retryRequest(() =>
      openai.createChatCompletion({
        model: "gpt-5.4-nano",
        messages: [
          {
            role: "system",
            content:
              "You are a blog post generator. Reply with a single JSON object only. No markdown fences.",
          },
          {
            role: "user",
            content: `Write an SEO-friendly blog post about ${topic}, targeting these comma-separated keywords: ${keywords}.

Return JSON with:
- "title": SEO title, no HTML
- "metaDescription": 150-160 character meta description, no HTML
- "postContent": HTML body using only h1, h2, p, ul, li (no html/head/body wrappers). About 600-800 words.`,
          },
        ],
        temperature: 0,
      })
    );

    const parsed = parseGeneratedPost(
      completion.data.choices[0]?.message?.content
    );
    const postContent = parsed.postContent || "";
    const title = parsed.title || "";
    const metaDescription = parsed.metaDescription || "";

    console.log("POST CONTENT: ", postContent);
    console.log("TITLE: ", title);
    console.log("META DESCRIPTION: ", metaDescription);

    await db.collection("users").updateOne(
      {
        auth0Id: user.sub,
      },
      {
        $inc: {
          availableTokens: -10,
        },
      }
    );

    const post = await db.collection("posts").insertOne({
      postContent,
      title,
      metaDescription,
      topic,
      keywords,
      userId: userProfile._id,
      created: new Date(),
    });

    res.status(200).json({
      postId: post.insertedId,
    });
  } catch (error) {
    console.error("Error generating post content:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
