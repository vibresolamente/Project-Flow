export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const formData = await req.formData();
    
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader ? authHeader.replace('Bearer ', '') : process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'OpenAI API key missing' }), { status: 401 });
    }

    const response = await fetch('https://api.openai.com/v1/audio/translations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify(data), { status: response.status });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
