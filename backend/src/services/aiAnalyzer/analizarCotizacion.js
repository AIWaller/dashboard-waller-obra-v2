require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const Anthropic = require('@anthropic-ai/sdk');
const XLSX = require('xlsx');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const analizarCotizacion = async (rutaArchivo) => {
  const workbook = XLSX.readFile(rutaArchivo);
  let contenido = '';

  workbook.SheetNames.forEach(hoja => {
    const sheet = workbook.Sheets[hoja];
    const texto = XLSX.utils.sheet_to_csv(sheet);
    contenido += `\n--- HOJA: ${hoja} ---\n${texto}`;
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `Analiza esta cotización de construcción y extrae las partidas.
Responde ÚNICAMENTE con un JSON válido, sin texto antes ni después, sin markdown.
Formato exacto:
{"partidas":[{"codigo":"","descripcion":"","unidad":"","cantidad":0,"precio_unitario":0,"importe":0,"espesor":"","capitulo":""}]}

Datos:
${contenido.substring(0, 20000)}`
      }
    ],
  });

  const texto = response.content[0].text.trim();
  
  // Extraer JSON aunque venga con texto alrededor
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('La IA no devolvió JSON válido');
  
  const json = JSON.parse(match[0]);
  return json;
};

module.exports = analizarCotizacion;
