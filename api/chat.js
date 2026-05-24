export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages, system } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages' });
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('pl-PL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const defaultSystem = `You are a supportive and motivating trading psychology coach.

TODAY'S DATE: ${dateStr}

Rules:
- Never use markdown: no **bold**, no *italic*, no bullet points with -, no headers with #
- Use emojis naturally in sentences 😊
- Write in short friendly paragraphs
- Be encouraging and positive while honest
- Max 3 short paragraphs per response
- End with a short question or motivating sentence
- Match the language the user writes in (Polish or English)
- Always use TODAY'S DATE above as reference when talking about dates — never guess or hallucinate dates`;

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
        system: system ? `${system}\n\nTODAY'S DATE: ${dateStr}\nAlways use this date as reference — never guess or hallucinate dates.` : defaultSystem,
        messages: messages
      })
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: 'AI request failed' });
  }
}
