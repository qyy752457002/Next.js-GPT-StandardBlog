// 导入获取会话的函数
import { getSession } from '@auth0/nextjs-auth0';
// 导入MongoDB客户端
import clientPromise from '../../lib/mongodb';
// 导入Stripe初始化
import stripeInit from 'stripe'

// 初始化Stripe
const stripe = stripeInit(process.env.STRIPE_SECRET_KEY);

// 导出函数
export default async function handler(req, res) {
  // 获取会话
  const { user } = await getSession(req, res);

  // 创建lineItems
  const lineItems = [{
    price: process.env.STRIPE_PRODUCT_PRICE_ID,
    quantity: 1,
  }];

  // 判断环境
  const protocol = process.env.NODE_ENV === 'development' ? 'http://' : 'https://';
  // 获取请求头中的host
  const host = req.headers.host; 

  // 创建支付会话
  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${protocol}${host}/success`,
    payment_intent_data: {
      metadata: {
        sub: user.sub,
      },
    },
    metadata: {
      sub: user.sub,
    },
  });

  // 打印用户
  console.log('user: ', user);

  // 返回会话
  res.status(200).json({ session: checkoutSession });
}

