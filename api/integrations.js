// GET /api/integrations — estado (CONFIGURADO / NÃO CONFIGURADO) de cada
// integração. NUNCA retorna o valor de nenhuma chave — só se a variável de
// ambiente existe no servidor. O frontend usa isto para os cards de status.
import { send, methodGuard } from './_lib/http.js';

const has = (...names) => names.some((n) => String(process.env[n] || '').trim().length > 0);

export default async function handler(req, res) {
  if (!methodGuard(req, res, ['GET'])) return;
  const mock = process.env.PAGEFORGE_MOCK === '1';

  const items = [
    {
      id: 'nvidia', nome: 'NVIDIA', papel: 'Geração de páginas (IA)',
      configured: has('NVIDIA_API_KEY'),
      hint: 'Vercel → Settings → Environment Variables → NVIDIA_API_KEY',
    },
    {
      id: 'aisa', nome: 'AIsa', papel: 'Prospecção (Maps + Instagram + IA)',
      configured: has('AISA_KEY', 'AISA_API_KEY'),
      hint: 'aisa.one — uma chave para Maps, Instagram e IA. Variável AISA_KEY.',
    },
    {
      id: 'gemini', nome: 'Google Gemini', papel: 'Provider de IA alternativo (futuro)',
      configured: has('GEMINI_API_KEY'),
      hint: 'Provider preparado em api/_lib/providers.js. Ainda não ativado.',
    },
    {
      id: 'openai', nome: 'OpenAI', papel: 'Provider de IA alternativo (futuro)',
      configured: has('OPENAI_API_KEY'),
      hint: 'Provider preparado. Ainda não ativado.',
    },
    {
      id: 'groq', nome: 'Groq', papel: 'Provider de IA alternativo (futuro)',
      configured: has('GROQ_API_KEY'),
      hint: 'Provider preparado. Ainda não ativado.',
    },
    {
      id: 'gmail', nome: 'Gmail API', papel: 'Envio de e-mail (hoje: rascunho manual)',
      configured: has('GMAIL_CLIENT_ID'),
      hint: 'Hoje o e-mail é rascunho via Gmail Compose / mailto. Envio automático não implementado.',
    },
    {
      id: 'blob', nome: 'Vercel Blob', papel: 'Publicação de demos (URL pública)',
      configured: has('BLOB_READ_WRITE_TOKEN'),
      hint: 'Vercel → Storage → Blob → Connect. Sem token: use Exportar HTML/ZIP.',
    },
  ];

  send(res, 200, {
    ok: true,
    mock,
    updatedAt: new Date().toISOString(),
    integrations: items.map((i) => ({
      ...i,
      status: i.configured ? 'CONFIGURADO' : (mock && ['nvidia', 'aisa', 'blob'].includes(i.id) ? 'MODO EXEMPLO' : 'NÃO CONFIGURADO'),
    })),
  });
}
