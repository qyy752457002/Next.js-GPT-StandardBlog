import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0"; // 从Auth0获取会话信息
import { Configuration, OpenAIApi } from "openai"; // 从OpenAI库中导入配置和API
import clientPromise from "../../lib/mongodb"; // 导入MongoDB客户端

export default withApiAuthRequired(async function handler(req, res) {
  const { user } = await getSession(req, res); // 获取用户会话信息
  const client = await clientPromise; // 获取MongoDB客户端连接
  const db = client.db("BlogStandard"); // 连接到名为 "BlogStandard" 的数据库
  const userProfile = await db.collection("users").findOne({
    auth0Id: user.sub, // 查找与当前用户关联的用户档案
  });

  if (!userProfile?.availableTokens) { // 如果用户没有可用的token
    res.status(403); // 返回403状态码
    return; // 终止函数
  }

  const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY, // 使用环境变量中的OpenAI API密钥进行配置
  });
  const openai = new OpenAIApi(config); // 创建OpenAI API实例

  const { topic, keywords } = req.body; // 从请求体中提取主题和关键词

  if (!topic || !keywords) { // 如果主题或关键词不存在
    res.status(422); // 返回422状态码
    return; // 终止函数
  }

  if (topic.length > 80 || keywords.length > 80) { // 如果主题或关键词长度超过80字符
    res.status(422); // 返回422状态码
    return; // 终止函数
  }

  // 调用OpenAI API生成博客内容
  const postContentResult = await openai.createChatCompletion({
    model: "gpt-4o-mini-2024-07-18", // 使用 GPT-4o-mini-2024-07-18 模型
    messages: [
      {
        role: "system",
        content: "You are a blog post generator.", // 指定系统角色和任务
      },
      {
        role: "user",
        content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
      The response should be formatted in SEO-friendly HTML, 
      limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`, // 用户请求生成博客内容
      },
    ],
    temperature: 0, // 设置温度参数为0
  });

  const postContent = postContentResult.data.choices[0]?.message.content; // 获取生成的博客内容

  // 调用OpenAI API生成博客标题
  const titleResult = await openai.createChatCompletion({
    model: "gpt-4o-mini-2024-07-18", // 使用 GPT-4o-mini-2024-07-18 模型
    messages: [
      {
        role: "system",
        content: "You are a blog post generator.", // 指定系统角色和任务
      },
      {
        role: "user",
        content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
      The response should be formatted in SEO-friendly HTML, 
      limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`, // 用户请求生成博客内容
      },
      {
        role: "assistant",
        content: postContent, // 将生成的博客内容传递给助手
      },
      {
        role: "user",
        content:
          "Generate appropriate title tag text for the above blog post without HTML tags", // 用户请求生成标题
      },
    ],
    temperature: 0, // 设置温度参数为0
  });

  // 调用OpenAI API生成Meta描述
  const metaDescriptionResult = await openai.createChatCompletion({
    model: "gpt-4o-mini-2024-07-18", // 使用 GPT-4o-mini-2024-07-18 模型
    messages: [
      {
        role: "system",
        content: "You are a blog post generator.", // 指定系统角色和任务
      },
      {
        role: "user",
        content: `Write a long and detailed SEO-friendly blog post about ${topic}, that targets the following comma-separated keywords: ${keywords}. 
      The response should be formatted in SEO-friendly HTML, 
      limited to the following HTML tags: p, h1, h2, h3, h4, h5, h6, strong, i, ul, li, ol.`, // 用户请求生成博客内容
      },
      {
        role: "assistant",
        content: postContent, // 将生成的博客内容传递给助手
      },
      {
        role: "user",
        content:
          "Generate SEO-friendly meta description content for the above blog post without HTML tags", // 用户请求生成Meta描述
      },
    ],
    temperature: 0, // 设置温度参数为0
  });

  const title = titleResult.data.choices[0]?.message.content; // 获取生成的标题
  const metaDescription =
    metaDescriptionResult.data.choices[0]?.message.content; // 获取生成的Meta描述

  console.log("POST CONTENT: ", postContent); // 打印生成的博客内容
  console.log("TITLE: ", title); // 打印生成的标题
  console.log("META DESCRIPTION: ", metaDescription); // 打印生成的Meta描述

  await db.collection("users").updateOne(
    {
      auth0Id: user.sub, // 根据用户ID更新用户信息
    },
    {
      $inc: {
        availableTokens: -10, // 减少用户的可用token数量
      },
    }
  );

  const post = await db.collection("posts").insertOne({
    postContent: postContent || "", // 插入生成的博客内容
    title: title || "", // 插入生成的标题
    metaDescription: metaDescription || "", // 插入生成的Meta描述
    topic, // 插入主题
    keywords, // 插入关键词
    userId: userProfile._id, // 插入用户ID
    created: new Date(), // 插入创建日期
  });

  res.status(200).json({
    postId: post.insertedId, // 返回插入的博客ID
  });
});
