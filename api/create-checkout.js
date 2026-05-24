export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price]': process.env.STRIPE_PRICE_ID,
        'line_items[0][quantity]': '1',
        'mode': 'subscription',
        'success_url': 'https://lifebizjournal.vercel.app/dashboard.html?sub=success',
        'cancel_url': 'https://lifebizjournal.vercel.app/dashboard.html?sub=cancel',
        'customer_email': email,
        'metadata[userId]': userId,
        'subscription_data[metadata][userId]': userId,
      }).toString()
    });

    const session = await response.json();
    if (session.error) return res.status(400).json({ error: session.error.message });
    return res.status(200).json({ url: session.url });
  } catch (e) {
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
