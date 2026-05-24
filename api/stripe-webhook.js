const SUPA_URL = 'https://hnhvewxfwdpcdcxkxbdw.supabase.co';
const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function upsertSubscription(userId, status, data = {}) {
  await fetch(SUPA_URL + '/rest/v1/subscriptions', {
    method: 'POST',
    headers: {
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': 'Bearer ' + SUPA_SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      user_id: userId,
      status: status,
      stripe_customer_id: data.customerId || null,
      stripe_subscription_id: data.subscriptionId || null,
      current_period_end: data.periodEnd || null,
      updated_at: new Date().toISOString()
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await getRawBody(req);

  let event;
  try {
    event = verifyStripeSignature(rawBody, sig, webhookSecret);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const data = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = data.metadata?.userId;
      if (userId) {
        await upsertSubscription(userId, 'active', {
          customerId: data.customer,
          subscriptionId: data.subscription,
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const userId = data.metadata?.userId;
      if (userId) {
        const status = data.status === 'active' ? 'active' : 'inactive';
        await upsertSubscription(userId, status, {
          customerId: data.customer,
          subscriptionId: data.id,
          periodEnd: new Date(data.current_period_end * 1000).toISOString()
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const userId = data.metadata?.userId;
      if (userId) {
        await upsertSubscription(userId, 'cancelled', {
          customerId: data.customer,
          subscriptionId: data.id,
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const userId = data.subscription_details?.metadata?.userId;
      if (userId) {
        await upsertSubscription(userId, 'past_due', {
          customerId: data.customer,
        });
      }
      break;
    }
  }

  return res.status(200).json({ received: true });
}

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function verifyStripeSignature(payload, sig, secret) {
  const crypto = require('crypto');
  const parts = sig.split(',');
  const timestamp = parts.find(p => p.startsWith('t=')).split('=')[1];
  const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.split('=')[1]);
  const signed = timestamp + '.' + payload;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  if (!signatures.includes(expected)) throw new Error('Invalid signature');
  const tolerance = 300;
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > tolerance) throw new Error('Timestamp expired');
  return JSON.parse(payload);
}

export const config = { api: { bodyParser: false } };
