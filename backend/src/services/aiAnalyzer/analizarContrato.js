require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const analizarContrato = async (rutaPDF) => {
  const pdfBuffer = fs.readFileSync(rutaPDF);
  const pdfBase64 = pdfBuffer.toString('base64');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: `Analiza este contrato de construcción y extrae la siguiente información en formato JSON exacto, sin texto adicional:
{
  "nombre_obra": "",
  "cliente": "",
  "centro_costo": "",
  "monto_contratado": 0,
  "fecha_inicio": "YYYY-MM-DD",
  "fecha_vigencia": "YYYY-MM-DD",
  "condiciones_pago": "",
  "retenciones": "",
  "notas_importantes": ""
}
IMPORTANTE: El campo centro_costo SIEMPRE debe quedar vacío "". No intentes extraerlo del contrato. Lo llena el usuario manualmente.
Si algún dato no está en el contrato, deja el campo vacío o en 0.`
          }
        ],
      }
    ],
  });

  const texto = response.content[0].text;
  const json = JSON.parse(texto.replace(/```json|```/g, '').trim());
  return json;
};

module.exports = analizarContrato;
