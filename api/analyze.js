export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();

    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader ? authHeader.replace('Bearer ', '') : process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key missing' }), { status: 401 });
    }

    const systemPrompt = `You are a real-time semantic engine for an enterprise document collaboration tool. 
Analyze the following document text and return ONLY a JSON object (without markdown code blocks) containing:
{
  "complianceScore": <number 0-100>,
  "riskFlags": [<array of short strings identifying specific compliance or security risks, max 3>],
  "readability": "<string e.g. 'Advanced', 'Intermediate', 'Simple'>",
  "sentiment": "<string e.g. 'Neutral', 'Positive', 'Urgent', 'Negative'>"
}
If the text is empty or too short, return safe defaults.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text || "(Empty document)" }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), { status: response.status });
    }

    const resultText = data.choices[0].message.content;
    const analysis = JSON.parse(resultText);

    return new Response(JSON.stringify(analysis), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
