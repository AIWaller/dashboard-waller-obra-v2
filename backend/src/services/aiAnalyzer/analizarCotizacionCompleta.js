require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const Anthropic = require('@anthropic-ai/sdk');
const XLSX = require('xlsx');
const prompts = require('./promptsCotizacion');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const analizarCotizacionCompleta = async (rutaArchivo) => {
  const workbook = XLSX.readFile(rutaArchivo);
  const resultados = {};

  for (const hoja of workbook.SheetNames) {
    if (!prompts[hoja]) continue;

    const sheet = workbook.Sheets[hoja];
    const contenido = XLSX.utils.sheet_to_csv(sheet);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompts[hoja] + contenido.substring(0, 20000)
        }
      ],
    });

    const texto = response.content[0].text.trim();
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) {
      resultados[hoja] = JSON.parse(match[0]);
    }
  }

  return resultados;
};

module.exports = analizarCotizacionCompleta;
