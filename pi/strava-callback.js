export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect('https://lifebizjournal.vercel.app/dashboard.html?strava_error=1');
  }

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: '244314',
        client_secret: '744a93d6e1bd90746690210f86ef35b7c11eb41a',
        code: code,
        grant_type: 'authorization_code'
      })
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      return res.redirect('https://lifebizjournal.vercel.app/dashboard.html?strava_error=1');
    }

    const athlete = encodeURIComponent(JSON.stringify({
      firstname: data.athlete?.firstname || '',
      lastname: data.athlete?.lastname || '',
      id: data.athlete?.id || ''
    }));

    return res.redirect(
      `https://lifebizjournal.vercel.app/dashboard.html?strava_connected=1&access_token=${data.access_token}&refresh_token=${data.refresh_token}&athlete=${athlete}`
    );

  } catch (e) {
    return res.redirect('https://lifebizjournal.vercel.app/dashboard.html?strava_error=1');
  }
}
