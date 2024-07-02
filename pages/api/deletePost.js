import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';
import { ObjectId } from 'mongodb';
import clientPromise from '../../lib/mongodb';

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
    const db = client.db('BlogStandard');
    // 查找当前用户的资料
    const userProfile = await db.collection('users').findOne({
      auth0Id: sub,
    });

    // 从请求体中获取要删除的postId
    const { postId } = req.body;

    // 删除当前用户的指定帖子
    await db.collection('posts').deleteOne({
      userId: userProfile._id,
      _id: new ObjectId(postId),
    });

    // 返回成功响应
    res.status(200).json({ success: true });
  } catch (e) {
    // 捕获错误并打印日志
    console.log('ERROR TRYING TO DELETE A POST: ', e);
  }
  return;
});
