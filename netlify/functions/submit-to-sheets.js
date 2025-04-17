    import { google } from "googleapis";

    const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON),
      scopes: SCOPES,
    });
    const sheets = google.sheets({ version: "v4", auth });

    export default async (req, context) => {
      if (req.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método no permitido" };
      }

      try {
        const data = JSON.parse(req.body).payload.data;
        const fila = [
          data.nombre,
          data.empresa,
          data.email,
          data.telefono,
          data.cargo,
          new Date().toISOString(),
        ];

        // Guarda en Google Sheets
        await sheets.spreadsheets.values.append({
          spreadsheetId: process.env.SHEET_ID,
          range: "A:F",
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [fila] },
        });

        // Envía correo via Mailgun HTTP API
        const texto = `
Nuevo inscrito en el formulario:

Nombre:   ${data.nombre}
Empresa:  ${data.empresa}
Email:    ${data.email}
Teléfono: ${data.telefono}
Cargo:    ${data.cargo}
Fecha:    ${new Date().toLocaleString("es-CL", { timeZone: "America/Santiago" })}
        `;

        const domain = process.env.MAILGUN_DOMAIN;
        const apiKey = process.env.MAILGUN_API_KEY;
        const authHeader = "Basic " + Buffer.from(`api:${apiKey}`).toString("base64");

        await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            from: process.env.FROM_EMAIL || `no-reply@${domain}`,
            to: "asimov@trantorfintech.com",
            subject: "Nuevo inscrito en el formulario",
            text: texto
          })
        });

        return { statusCode: 200, body: "OK" };
      } catch (err) {
        console.error(err);
        return { statusCode: 500, body: "Error interno" };
      }
    };
