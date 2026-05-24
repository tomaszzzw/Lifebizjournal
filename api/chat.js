export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: system || `You are a supportive and motivating trading psychology coach. Your style:
- Use emojis to make messages friendly and readable 😊
- Structure responses with short paragraphs, not walls of text
- Be encouraging and positive, while still honest
- Celebrate wins and progress 🎯
- When warning about risks, do it gently and constructively
- Max 3-4 short points per response
- End with a question or encouragement
- Never be harsh or overly critical`,
        messages: messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'AI request failed' });
  }
}
