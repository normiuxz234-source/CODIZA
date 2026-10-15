import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Allow large payloads for high-resolution document images and scanned PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini AI setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: Scan and parse document / receipt / invoice image or PDF
app.post('/api/scan-document', async (req, res) => {
  try {
    const { fileData, mimeType, filename } = req.body;

    if (!fileData || !mimeType) {
      return res.status(200).json({ success: false, error: 'fileData and mimeType are required' });
    }

    // Clean base64 string if it contains prefix data:*/*;base64,
    const cleanBase64 = fileData.includes(',') ? fileData.split(',')[1] : fileData;

    const promptText = `
Eres un asistente experto en contabilidad y digitalización de comprobantes fiscales, facturas, notas de remisión y tickets de compra.
Analiza detenidamente esta imagen o archivo PDF y extrae con alta precisión la estructura contable:

1. Datos del documento:
   - docType: Determina si es "factura", "remision", "nota_venta", "ticket" u "otro".
   - folio: Folio o número de documento encontrado (ej. "A-10492", "REM-552").
   - date: Fecha de emisión (formato YYYY-MM-DD preferente o el texto tal cual aparece).
   - issuerName: Proveedor o emisor (empresa o persona que expidió el ticket/factura).
   - issuerTaxId: RFC, CIF, RUT o NIF del proveedor si es visible.
   - receiverName: Cliente o receptor si viene especificado.
   - receiverTaxId: RFC del cliente si viene especificado.

2. Partidas / Conceptos (items):
   - Extrae cada partida del cuerpo o tabla del comprobante.
   - quantity: Cantidad numérica (si no es explícita, asume 1).
   - unit: Unidad de medida (ej. "pza", "m", "kg", "servicio", "rollo", "cja", "l").
   - name: Nombre conciso y claro del producto o servicio.
   - description: Descripción ampliada, especificación o código de producto.
   - purchasePrice: Precio unitario de compra antes de descuento o impuestos.
   - discountPercent: Porcentaje de descuento aplicado a la partida (0 si no hay).
   - totalLine: Importe total de la partida.

3. Totales de referencia:
   - subtotal: Subtotal antes de impuestos.
   - taxAmount: Monto de IVA u otros impuestos.
   - total: Total general a pagar.
   - notes: Observaciones, método de pago, condiciones o notas al pie legibles.

Asegúrate de no inventar datos. Si un campo no está legible o no existe, déjalo vacío o en 0.
`;

    // List of candidate models. gemini-3-flash-preview and gemini-3.1-flash-lite are responsive without congestion
    const candidateModels = [
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];
    let lastError: any = null;
    let responseText: string | null = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: mimeType,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response && response.text) {
          responseText = response.text;
          break; // Succeeded!
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} encountered error, trying next fallback...`, err?.message || err);
        // Wait 400ms before next candidate
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    if (!responseText) {
      throw lastError || new Error('No se pudo procesar el comprobante con la IA.');
    }

    // Strip markdown formatting if present e.g. ```json ... ```
    let cleanText = responseText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    const parsedResult = JSON.parse(cleanText || '{}');
    return res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error('Error scanning document with Gemini:', error);

    let friendlyMessage = 'No se pudo procesar el documento con la IA.';
    const rawError = error?.message || String(error);

    if (rawError.includes('503') || rawError.includes('high demand') || rawError.includes('UNAVAILABLE')) {
      friendlyMessage = 'El servicio de visión con IA está experimentando alta demanda momentánea. Por favor haz clic en "Reintentar escaneo".';
    } else if (rawError.includes('429') || rawError.includes('quota') || rawError.includes('RESOURCE_EXHAUSTED')) {
      friendlyMessage = 'Límite de peticiones alcanzado temporalmente. Espera unos segundos y vuelve a intentar.';
    } else {
      friendlyMessage = rawError;
    }

    return res.status(200).json({
      success: false,
      error: friendlyMessage,
    });
  }
});

// Setup Vite middlewares for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port} (mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();
