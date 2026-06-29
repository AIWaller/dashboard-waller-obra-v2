const { google } = require('googleapis');

const getSheetData = async (sheetUrl) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Extraer el ID del Sheets del URL
  const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) throw new Error('URL de Google Sheets inválido');
  const spreadsheetId = match[1];

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A1:Z100',
  });

  return response.data.values || [];
};

module.exports = { getSheetData };
