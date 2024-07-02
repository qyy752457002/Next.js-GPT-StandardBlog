// 导入Cors
import Cors from 'micro-cors';
// 导入stripe
import stripeInit from 'stripe';
// 导入verifyStripe
import verifyStripe from '@webdeveducation/next-verify-stripe';
// 导入lib/mongodb
import clientPromise from '../../../lib/mongodb';

// 创建Cors实例
const cors = Cors({
  // 允许的方法
  allowMethods: ['POST', 'HEAD'],
});

// 配置
export const config = {
  api: {
    bodyParser: false,
  },
};

// 初始化stripe
const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);
// webhook的endpointSecret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// 处理函数
const handler = async (req, res) => {
  // 如果是POST请求
  if (req.method === 'POST') {
    let event;
    try {
      // 验证stripe
      event = await verifyStripe({
        req,
        stripe,
        endpointSecret,
      });
    } catch (e) {
      console.log('ERROR: ', e);
    }

    // 根据事件类型处理
    switch (event.type) {
      case 'payment_intent.succeeded': {
        // 获取client
        const client = await clientPromise;
        // 获取数据库
        const db = client.db('BlogStandard');

        // 获取支付意图
        const paymentIntent = event.data.object;
        // 获取auth0Id
        const auth0Id = paymentIntent.metadata.sub;

        console.log('AUTH 0 ID: ', paymentIntent);

        // 更新用户资料
        const userProfile = await db.collection('users').updateOne(
          {
            auth0Id,
          },
          {
            $inc: {
              availableTokens: 10,
            },
            $setOnInsert: {
              auth0Id,
            },
          },
          {
            upsert: true,
          }
        );
      }
      default:
        console.log('UNHANDLED EVENT: ', event.type);
    }

    // 返回成功
    res.status(200).json({ received: true });
  }
}

// 使用Cors
export default cors(handler);