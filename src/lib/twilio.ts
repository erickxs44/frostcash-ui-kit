export async function sendWhatsAppMessage(body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (isLocalhost) {
      const TWILIO_SID = import.meta.env.VITE_TWILIO_SID;
      const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
      const TWILIO_FROM = import.meta.env.VITE_TWILIO_FROM;
      const TWILIO_TO = import.meta.env.VITE_TWILIO_TO;

      const url = `/api/twilio/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      
      const params = new URLSearchParams();
      params.append('To', TWILIO_TO || "");
      params.append('From', TWILIO_FROM || "");
      params.append('Body', body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.message };
      }
      return { success: true };
    }

    // Produção na Vercel (chama a Serverless Function nativa)
    const response = await fetch("/api/twilio", {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Erro no Vercel API:", data);
      return { success: false, error: data.error || "Erro na API do servidor." };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Falha ao enviar WhatsApp:", error);
    return { success: false, error: error.message || "Falha de rede." };
  }
}
