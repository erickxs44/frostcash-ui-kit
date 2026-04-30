import { createServerFn } from "@tanstack/react-start";

const TWILIO_SID = typeof process !== 'undefined' && process.env.VITE_TWILIO_SID ? process.env.VITE_TWILIO_SID : import.meta.env.VITE_TWILIO_SID;
const TWILIO_AUTH_TOKEN = typeof process !== 'undefined' && process.env.VITE_TWILIO_AUTH_TOKEN ? process.env.VITE_TWILIO_AUTH_TOKEN : import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_FROM = typeof process !== 'undefined' && process.env.VITE_TWILIO_FROM ? process.env.VITE_TWILIO_FROM : import.meta.env.VITE_TWILIO_FROM;
const TWILIO_TO = typeof process !== 'undefined' && process.env.VITE_TWILIO_TO ? process.env.VITE_TWILIO_TO : import.meta.env.VITE_TWILIO_TO;

export const sendWhatsAppFn = createServerFn({ method: "POST" })
  .validator((data: { body: string }) => data)
  .handler(async ({ data }) => {
    try {
      console.log("Enviando WhatsApp (Server Side) para:", TWILIO_TO);
      // Removido o proxy local (/api/twilio) pois isso roda no backend agora
      const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
      
      const params = new URLSearchParams();
      params.append('To', TWILIO_TO || "");
      params.append('From', TWILIO_FROM || "");
      params.append('Body', data.body);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`),
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro no Twilio (Server Side):", errorData);
        return { success: false, error: errorData.message || "Erro desconhecido da API do Twilio." };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Falha ao enviar WhatsApp (Server Side):", error);
      return { success: false, error: error.message || "Falha de rede no servidor." };
    }
  });

export async function sendWhatsAppMessage(body: string): Promise<{ success: boolean; error?: string }> {
  return await sendWhatsAppFn({ data: { body } });
}
