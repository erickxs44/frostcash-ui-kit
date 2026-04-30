export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { subject, html } = req.body;
  // Usando a chave explícita como fallback de segurança caso não esteja configurada no painel da Vercel
  const RESEND_API_KEY = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY || "re_Dv7sMhWJ_KpYuzQy3BYgeySvKsJWJBywz";
  const TARGET_EMAIL = process.env.VITE_TARGET_EMAIL || process.env.TARGET_EMAIL || "cantinhodoacai982@gmail.com";

  console.log("Tentando enviar e-mail para:", TARGET_EMAIL);
  console.log("Assunto:", subject);

  if (!RESEND_API_KEY) {
    console.error("ERRO: Resend API Key não encontrada!");
    return res.status(500).json({ success: false, error: 'API Key do Resend não configurada na Vercel.' });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "FrostCash <onboarding@resend.dev>",
        to: [TARGET_EMAIL],
        subject,
        html
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(400).json({ success: false, error: data.message || "Erro da API do Resend" });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Falha de rede interna" });
  }
}
