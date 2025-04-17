import { google } from 'googleapis';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método no permitido', { status: 405 });
  }

  try {
    const data = await req.json();

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const values = [[data.nombre, data.empresa, data.email, data.telefono, data.cargo]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    return new Response('Inscripción guardada correctamente.', { status: 200 });
  } catch (error) {
    console.error('Error al guardar en Google Sheets:', error);
    return new Response('Error interno del servidor.', { status: 500 });
  }
};
