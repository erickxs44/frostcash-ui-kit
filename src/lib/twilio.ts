const TWILIO_SID = import.meta.env.VITE_TWILIO_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_FROM = import.meta.env.VITE_TWILIO_FROM;
const TWILIO_TO = import.meta.env.VITE_TWILIO_TO;

export async function sendWhatsAppMessage(body: string): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `/api/twilio/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
    
    const params = new URLSearchParams();
    params.append('To', TWILIO_TO);
    params.append('From', TWILIO_FROM);
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
      console.error("Erro no Twilio:", data);
      return { success: false, error: data.message || "Erro desconhecido da API do Twilio." };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error("Falha ao enviar WhatsApp:", error);
    return { success: false, error: error.message || "Falha de rede ao conectar com Twilio." };
  }
}
