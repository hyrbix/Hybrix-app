// Servidor del Coach de HYBRIX (Cloudflare Worker).
// Guarda tu clave de IA en secreto y solo acepta preguntas desde tu app.
// Variables: ANTHROPIC_API_KEY (secreta). Opcional: MODEL.

const ALLOWED = ['https://hyrbix.github.io'];
const SYSTEM = `Eres el coach de HYBRIX, un gym de Hyrox en Mérida. Hablas en español de México, cercano y claro. Respuestas cortas y prácticas (máximo unas 120 palabras, con viñetas si ayudan), salvo que pidan más detalle.
Solo hablas de entrenamiento, Hyrox, la app HYBRIX, preparación para competencias, recuperación y hábitos generales de alimentación e hidratación para entrenar. Si preguntan otra cosa, di amablemente que solo ayudas con el entrenamiento.
No diagnosticas lesiones ni recomiendas medicamentos ni dosis. Si el atleta reporta dolor o molestia: si no está clara la zona, pregunta dónde; usa la herramienta marcar_molestia para ajustar sus entrenos (nivel "leve" si es molestia, "dolor" si duele al moverse) y dile en una línea qué cambió. Si menciona señales de alarma (dolor en el pecho, falta de aire anormal, mareo o desmayo, dolor fuerte o punzante, hinchazón, adormecimiento, no poder apoyar, dolor que dura más de una semana) dile que pare y vea a un médico o fisioterapeuta, y que en una emergencia llame al 911.
No inventes datos del atleta: usa solo los que vienen en el contexto.`;
const ZONAS = ['rodilla','espbaja','hombro','codo','muneca','cuello','cadera','isquios','pantorrilla','tobillo','abdomen','pecho'];
const TOOLS = [
  { name: 'marcar_molestia', description: 'Ajusta los entrenos del atleta para no cargar una zona que le molesta o duele. Devuelve qué ejercicios de su entreno de hoy se cambiaron.',
    input_schema: { type: 'object', properties: { zona: { type: 'string', enum: ZONAS }, nivel: { type: 'string', enum: ['leve','dolor'] }, dias: { type: 'number', description: 'Días: 1, 3, 7 o 0 hasta que el atleta lo quite' } }, required: ['zona'] } },
  { name: 'quitar_molestia', description: 'Quita el ajuste por molestia cuando el atleta dice que ya no le duele. Sin zona quita todas.',
    input_schema: { type: 'object', properties: { zona: { type: 'string', enum: ZONAS } } } }
];

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', 'Vary': 'Origin' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST' || !ALLOWED.includes(origin)) return new Response('No permitido', { status: 403, headers: cors });
    let body; try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400, headers: cors }); }
    const context = String(body.context || '').slice(0, 4000);
    const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
    if (!messages.length || JSON.stringify(messages).length > 60000) return new Response('Mensaje inválido', { status: 400, headers: cors });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.MODEL || 'claude-haiku-5-5', max_tokens: 700, system: SYSTEM + '\n\nDatos del atleta:\n' + context, messages, tools: TOOLS })
    });
    return new Response(await r.text(), { status: r.status, headers: { ...cors, 'content-type': 'application/json' } });
  }
};
