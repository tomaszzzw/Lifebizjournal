export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'No refresh token' });
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: '244314',
        client_secret: '744a93d6e1bd90746690210f86ef35b7c11eb41a',
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const data = await tokenRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'Refresh failed' });
  }
}
