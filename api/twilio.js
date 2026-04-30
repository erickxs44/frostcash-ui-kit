export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { body } = req.body;
  const TWILIO_SID = process.env.VITE_TWILIO_SID || process.env.TWILIO_SID;
  const TWILIO_AUTH_TOKEN = process.env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.VITE_TWILIO_FROM || process.env.TWILIO_FROM;
  const TWILIO_TO = process.env.VITE_TWILIO_TO || process.env.TWILIO_TO;

  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN) {
    return res.status(500).json({ success: false, error: 'Chaves do Twilio não configuradas na Vercel.' });
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('To', TWILIO_TO || "");
    params.append('From', TWILIO_FROM || "");
    params.append('Body', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({ success: false, error: data.message || "Erro da API do Twilio" });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Falha de rede interna no servidor" });
  }
}
