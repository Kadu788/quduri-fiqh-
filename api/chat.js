export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, chapter } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const chapterContext = chapter && chapter !== 'All'
    ? `Focus your answer on the chapter of ${chapter}.`
    : '';

  const systemPrompt = `You are a specialist in Hanafi fiqh, answering questions based solely on the Mukhtasar al-Quduri by Imam al-Quduri (362-428 AH).

Rules:
- Answer only from the Mukhtasar al-Quduri. Do not use outside knowledge.
- Be concise and precise. Use Islamic terminology with brief English explanations in brackets where helpful.
- Structure your answer clearly — list obligations, conditions, or rulings as numbered points when there are multiple items.
- End with: "Source: Mukhtasar al-Quduri" followed by the relevant chapter name.
- If the question is not covered in the book, say so clearly.
- ${chapterContext}`;

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
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: query }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'API error' });
    }

    const answer = data.content?.[0]?.text || 'No answer returned.';
    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
