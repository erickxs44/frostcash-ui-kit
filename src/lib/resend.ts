import { createServerFn } from "@tanstack/react-start";

const RESEND_API_KEY = typeof process !== 'undefined' && process.env.VITE_RESEND_API_KEY ? process.env.VITE_RESEND_API_KEY : import.meta.env.VITE_RESEND_API_KEY;
const TARGET_EMAIL = typeof process !== 'undefined' && process.env.VITE_TARGET_EMAIL ? process.env.VITE_TARGET_EMAIL : import.meta.env.VITE_TARGET_EMAIL;
const FROM_EMAIL = "FrostCash <onboarding@resend.dev>";

export const sendEmailFn = createServerFn({ method: "POST" })
  .validator((data: { subject: string; html: string }) => data)
  .handler(async ({ data }) => {
    try {
      console.log("Enviando email (Server Side) para:", TARGET_EMAIL);
      // Removido o corsproxy.io pois agora isso roda no lado do servidor (seguro)
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TARGET_EMAIL || "cantinhodoacai982@gmail.com"],
          subject: data.subject,
          html: data.html
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro no Resend (Server Side):", errorData);
        return { success: false, error: errorData.message || "Erro desconhecido da API do Resend." };
      }
      return { success: true };
    } catch (error: any) {
      console.error("Falha ao enviar e-mail (Server Side):", error);
      return { success: false, error: error.message || "Falha de rede no servidor." };
    }
  });

export async function sendEmail(subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  return await sendEmailFn({ data: { subject, html } });
}

export async function sendCloseRegisterReport(stats: {
  pix: number;
  cartao: number;
  dinheiro: number;
  totalVendas: number;
  totalDespesas: number;
  lucroEstimado: number;
  dateStr: string;
}) {
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Relatório de Fechamento de Caixa</h2>
      <p style="color: #555;"><strong>Data:</strong> ${stats.dateStr}</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      
      <h3 style="color: #333;">Resumo de Vendas:</h3>
      <ul style="list-style-type: none; padding: 0;">
        <li style="margin-bottom: 8px;">🟩 <strong>PIX:</strong> ${fmt(stats.pix)}</li>
        <li style="margin-bottom: 8px;">💳 <strong>Cartão:</strong> ${fmt(stats.cartao)}</li>
        <li style="margin-bottom: 8px;">💵 <strong>Dinheiro:</strong> ${fmt(stats.dinheiro)}</li>
      </ul>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin-top: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;"><strong>Total em Vendas:</strong> ${fmt(stats.totalVendas)}</h3>
        <h3 style="margin: 0 0 10px 0; color: #ef4444;"><strong>Total de Despesas:</strong> ${fmt(stats.totalDespesas)}</h3>
        <h3 style="margin: 0; color: #16a34a;"><strong>Lucro (Vendas - Despesas):</strong> ${fmt(stats.lucroEstimado)}</h3>
      </div>
      
      <br/>
      <p style="font-size: 12px; color: #999; text-align: center;">Enviado automaticamente pelo FrostCash PDV.</p>
    </div>
  `;
  
  return sendEmail(`Fechamento de Caixa - ${stats.dateStr}`, html);
}

export async function sendLowStockAlert(items: { name: string; qty: number; unit: string; maxQty: number }[]) {
  if (items.length === 0) return;
  
  const itemsHtml = items.map(i => `
    <li style="margin-bottom: 10px; padding: 10px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
      <strong>${i.name}</strong><br/>
      Restam apenas: <strong>${i.qty} ${i.unit}</strong> (Ideal: ${i.maxQty} ${i.unit})
    </li>
  `).join("");
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #dc2626;">Alerta de Reposição Necessária ⚠️</h2>
      <p style="color: #555;">Os seguintes itens do seu estoque atingiram o nível crítico (Abaixo de 20%):</p>
      
      <ul style="list-style-type: none; padding: 0; margin-top: 20px;">
        ${itemsHtml}
      </ul>
      
      <br/>
      <p style="color: #555;">Por favor, providencie a reposição para evitar a falta de produtos no PDV.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
      <p style="font-size: 12px; color: #999; text-align: center;">Enviado automaticamente pelo FrostCash PDV.</p>
    </div>
  `;
  
  return sendEmail(`⚠️ Alerta de Estoque Crítico`, html);
}
