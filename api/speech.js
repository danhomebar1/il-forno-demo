// api/speech.js
// Converts AI text to speech using OpenAI TTS Nova

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text || text.length > 500) {
      return res.status(400).json({ error: 'Invalid text' });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        voice: 'nova',
        input: text,
        speed: 1.0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenAI TTS error:', errText);
      return res.status(500).json({ error: 'TTS service error' });
    }

    const audioBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export const config = {
  api: {
    responseLimit: false
  }
};
