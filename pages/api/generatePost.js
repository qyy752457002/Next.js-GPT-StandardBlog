import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { Configuration, OpenAIApi } from "openai";
import clientPromise from "../../lib/mongodb";

// 使用Auth0保护API路由
export default withApiAuthRequired(async function handler(req, res) {
  // 获取当前用户的会话
  const { user } = await getSession(req, res);
  // 获取MongoDB客户端
  const client = await clientPromise;
  // 选择数据库
  const db = client.db("BlogStandard");
  // 查找当前用户的资料
  const userProfile = await db.collection("users").findOne({
    auth0Id: user.sub,
  });

  // 如果用户没有可用的令牌，返回403状态码
  if (!userProfile?.availableTokens) {
    res.status(403).json({ error: "No available tokens" });
    return;
  }

  // 配置OpenAI API
  const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 100000, // 设置超时时间为100秒
  });
  const openai = new OpenAIApi(config);

  // 从请求体中获取主题和关键词
  const { topic, keywords } = req.body;

  // 如果主题或关键词为空，返回422状态码
  if (!topic || !keywords) {
    res.status(422).json({ error: "Topic or keywords missing" });
    return;
  }

  // 如果主题或关键词的长度超过80字符，返回422状态码
  if (topic.length > 80 || keywords.length > 80) {
    res.status(422).json({ error: "Topic or keywords too long" });
    return;
  }

  const generateContent = async () => {
    return await openai.createChatCompletion({
      model: "gpt-4o-2024-05-13",
      messages: [
        {
          role: "system",
          content: "You are a blog post generator.",
        },
        {
          role: "user",
          content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
            The response should be formatted in SEO-friendly HTML, 
            limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`,
        },
      ],
      temperature: 0,
    });
  };

  const generateTitle = async (postContent) => {
    return await openai.createChatCompletion({
      model: "gpt-4o-2024-05-13",
      messages: [
        {
          role: "system",
          content: "You are a blog post generator.",
        },
        {
          role: "user",
          content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
            The response should be formatted in SEO-friendly HTML, 
            limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`,
        },
        {
          role: "assistant",
          content: postContent,
        },
        {
          role: "user",
          content:
            "Generate appropriate title tag text for the above blog post without HTML tags",
        },
      ],
      temperature: 0,
    });
  };

  const generateMetaDescription = async (postContent) => {
    return await openai.createChatCompletion({
      model: "gpt-4o-2024-05-13",
      messages: [
        {
          role: "system",
          content: "You are a blog post generator.",
        },
        {
          role: "user",
          content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
            The response should be formatted in SEO-friendly HTML, 
            limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`,
        },
        {
          role: "assistant",
          content: postContent,
        },
        {
          role: "user",
          content:
            "Generate SEO-friendly meta description content for the above blog post without HTML tags",
        },
      ],
      temperature: 0,
    });
  };

  // 重试机制，尝试99次
  const retry = async (fn, retries = 99) => {
    try {
      return await fn();
    } catch (error) {
      if (retries === 1) throw error;
      return await retry(fn, retries - 1);
    }
  };

  // 使用重试机制生成博客内容、标题和meta描述
  const postContentResult = await retry(() => generateContent());
  const postContent = postContentResult.data.choices[0]?.message.content;

  const titleResult = await retry(() => generateTitle(postContent));
  const title = titleResult.data.choices[0]?.message.content;

  const metaDescriptionResult = await retry(() =>
    generateMetaDescription(postContent)
  );
  const metaDescription =
    metaDescriptionResult.data.choices[0]?.message.content;

  // 打印生成的内容、标题和meta描述
  console.log("POST CONTENT: ", postContent);
  console.log("TITLE: ", title);
  console.log("META DESCRIPTION: ", metaDescription);

  // 更新用户的可用令牌数量
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

  // 将生成的博客内容插入到数据库中
  const post = await db.collection("posts").insertOne({
    postContent: postContent || "",
    title: title || "",
    metaDescription: metaDescription || "",
    topic,
    keywords,
    userId: userProfile._id,
    created: new Date(),
  });

  // 打印插入的博客内容
  console.log("POST:", post);

  // 返回生成的博客内容的ID
  res.status(200).json({
    postId: post.insertedId,
  });

  // console.error("Error generating blog post:", error);
  // res.status(500).json({ error: "Internal Server Error" });
});
