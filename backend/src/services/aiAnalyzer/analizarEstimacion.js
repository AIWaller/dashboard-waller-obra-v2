require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const Anthropic = require('@anthropic-ai/sdk');
const XLSX = require('xlsx');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROMPT = `Eres un analizador de estimaciones de obra para la empresa Waller.
Las estimaciones vienen en formatos diferentes segun el cliente, pero 
todas contienen los mismos conceptos clave. Analiza la pestana de 
caratula/resumen de esta estimacion y extrae los datos.

Devuelve UNICAMENTE un JSON valido sin texto adicional, sin markdown, 
sin explicaciones.

{
  "obra": "",
  "cliente": "",
  "contratista": "",
  "fecha_estimacion": "YYYY-MM-DD",
  "monto_contrato": 0,
  "porcentaje_anticipo": 0,
  "porcentaje_fondo_garantia": 0,
  "estimaciones": [
    {
      "numero": "",
      "periodo_inicio": "YYYY-MM-DD",
      "periodo_fin": "YYYY-MM-DD",
      "importe_estimado": 0,
      "amortizacion_anticipo": 0,
      "fondo_garantia": 0,
      "total_estimacion": 0,
      "acumulado_estimacion": 0,
      "saldo_por_estimar": 0,
      "valor_factura": 0
    }
  ],
  "total_estimado_acumulado": 0,
  "saldo_por_estimar_total": 0
}

Instrucciones:
- La estimacion mas reciente es la ultima fila con datos en la tabla.
- Si un campo no existe en este formato, dejalo en 0 o vacio.
- Las fechas conviertelas siempre a formato YYYY-MM-DD.
- "estimaciones" es un arreglo: incluye TODAS las estimaciones que 
  aparezcan en la caratula (estimacion 1, 2, 3...), no solo la ultima.
Datos:
`;

const analizarEstimacion = async (rutaArchivo) => {
  const workbook = XLSX.readFile(rutaArchivo);

  // Buscar la pestaña de caratula (puede tener distintos nombres)
  const nombreCaratula = workbook.SheetNames.find(s =>
    s.toLowerCase().includes('caratula') || s.toLowerCase().includes('carátula')
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[nombreCaratula];
  const contenido = XLSX.utils.sheet_to_csv(sheet);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: PROMPT + contenido.substring(0, 15000)
      }
    ],
  });

  const texto = response.content[0].text.trim();
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No se pudo extraer JSON de la respuesta');

  return JSON.parse(match[0]);
};

module.exports = analizarEstimacion;
