import React, { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Sparkles,
  CheckCircle,
  Plus,
  Percent,
  DollarSign,
  ArrowRight,
  X,
  AlertCircle,
  RefreshCw,
  Building,
  Calendar,
  Hash,
} from 'lucide-react';
import { ScannedItem, ScanResult, DocumentItem } from '../types';

interface SmartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadItemsToEditor: (items: DocumentItem[], metadata?: { clientName?: string; notes?: string; folioSource?: string }) => void;
}

export const SmartScannerModal: React.FC<SmartScannerModalProps> = ({
  isOpen,
  onClose,
  onLoadItemsToEditor,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Global Margin state
  const [globalMargin, setGlobalMargin] = useState<number>(25);
  const [items, setItems] = useState<ScannedItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = (selectedFile: File) => {
    setError(null);
    setScanResult(null);
    setFile(selectedFile);

    const isFilePdf = selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf');
    setIsPdf(isFilePdf);

    if (!isFilePdf) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const processScan = async () => {
    if (!file) {
      setError('Por favor selecciona o toma una foto o PDF de un documento.');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // Prepare base64 data, compressing images to standard Full HD if needed to prevent 413 / timeout
      let base64Data = '';
      let targetMime = file.type || (isPdf ? 'application/pdf' : 'image/jpeg');

      if (!isPdf && (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name))) {
        // Compress image using canvas
        base64Data = await new Promise<string>((resolve) => {
          const img = new Image();
          const reader = new FileReader();
          reader.onload = (e) => {
            img.src = e.target?.result as string;
          };
          img.onload = () => {
            const maxDimension = 1920;
            let width = img.width;
            let height = img.height;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            targetMime = 'image/jpeg';
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => {
            // Fallback to direct file reader
            const rawReader = new FileReader();
            rawReader.onload = () => resolve(rawReader.result as string);
            rawReader.readAsDataURL(file);
          };
          reader.readAsDataURL(file);
        });
      } else {
        base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }

      const response = await fetch('/api/scan-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: targetMime,
          filename: file.name,
        }),
      });

      const responseText = await response.text();
      let json: any = null;
      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        if (responseText.includes('<!doctype') || responseText.includes('<html')) {
          if (response.status === 413 || responseText.includes('413')) {
            throw new Error('El archivo excede el tamaño máximo permitido. Intenta con un archivo más ligero o una foto.');
          }
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            throw new Error('El servicio de escaneo está inicializando. Por favor haz clic en "Reintentar Escaneo".');
          }
          throw new Error('El servidor devolvió una página HTML en lugar de datos JSON. Por favor haz clic en "Reintentar Escaneo".');
        }
        throw new Error(`Error en el formato de respuesta del servidor (${response.status})`);
      }

      if (!response.ok || !json.success) {
        let msg = json?.error || 'No se pudo procesar el documento con IA.';
        try {
          if (typeof msg === 'string' && (msg.startsWith('{') || msg.includes('{"error"'))) {
            const parsed = JSON.parse(msg);
            if (parsed.error?.message) {
              msg = parsed.error.message;
            }
          }
        } catch {
          // keep msg as string
        }

        if (typeof msg === 'string' && (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE'))) {
          msg = 'El servicio de visión IA está experimentando alta demanda momentánea en los servidores. Por favor haz clic en "Reintentar escaneo".';
        }

        throw new Error(msg);
      }

      const resData: ScanResult = json.data;
      setScanResult(resData);

      // Initialize items with selections and default margin
      const formattedItems: ScannedItem[] = (resData.items || []).map((it) => {
        const pPrice = Number(it.purchasePrice) || 0;
        const margin = globalMargin;
        const sPrice = Math.round(pPrice * (1 + margin / 100) * 100) / 100;
        return {
          ...it,
          quantity: Number(it.quantity) || 1,
          unit: it.unit || 'pza',
          name: it.name || 'Concepto sin nombre',
          description: it.description || '',
          purchasePrice: pPrice,
          discountPercent: Number(it.discountPercent) || 0,
          selected: true,
          marginPercent: margin,
          sellingPrice: sPrice,
        };
      });

      setItems(formattedItems);
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err?.message || 'Error al comunicarse con el servicio de digitalización IA.');
    } finally {
      setIsScanning(false);
    }
  };

  const applyGlobalMargin = (newMargin: number) => {
    setGlobalMargin(newMargin);
    setItems((prev) =>
      prev.map((it) => {
        const pPrice = it.purchasePrice || 0;
        const sPrice = Math.round(pPrice * (1 + newMargin / 100) * 100) / 100;
        return {
          ...it,
          marginPercent: newMargin,
          sellingPrice: sPrice,
        };
      })
    );
  };

  const updateItemMargin = (index: number, newMargin: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const pPrice = it.purchasePrice || 0;
      copy[index] = {
        ...it,
        marginPercent: newMargin,
        sellingPrice: Math.round(pPrice * (1 + newMargin / 100) * 100) / 100,
      };
      return copy;
    });
  };

  const updateItemSellingPrice = (index: number, newSellingPrice: number) => {
    setItems((prev) => {
      const copy = [...prev];
      const it = copy[index];
      const pPrice = it.purchasePrice || 0;
      const margin = pPrice > 0 ? Math.round(((newSellingPrice - pPrice) / pPrice) * 100) : 0;
      copy[index] = {
        ...it,
        marginPercent: margin,
        sellingPrice: newSellingPrice,
      };
      return copy;
    });
  };

  const toggleItemSelection = (index: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index].selected = !copy[index].selected;
      return copy;
    });
  };

  const toggleSelectAll = (select: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: select })));
  };

  const handleTransferToEditor = () => {
    const selectedItems = items.filter((it) => it.selected);
    if (selectedItems.length === 0) {
      setError('Selecciona al menos una partida para transferir al editor.');
      return;
    }

    const convertedItems: DocumentItem[] = selectedItems.map((it, idx) => {
      const costPrice = it.purchasePrice || 0;
      const markup = it.marginPercent ?? globalMargin;
      const unitPrice = it.sellingPrice && it.sellingPrice > 0 ? it.sellingPrice : Math.round(costPrice * (1 + markup / 100) * 100) / 100;
      const qty = it.quantity || 1;
      const subtotal = Math.round(qty * unitPrice * 100) / 100;
      const profit = Math.round(qty * (unitPrice - costPrice) * 100) / 100;
      const taxRate = 0.16; // default 16% IVA
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

      return {
        id: `item-scanned-${Date.now()}-${idx}`,
        quantity: qty,
        unit: it.unit || 'pza',
        name: it.name,
        description: it.description || '',
        costPrice: costPrice,
        markupPercent: markup,
        unitPrice: unitPrice,
        subtotal: subtotal,
        profit: profit,
        taxRate: taxRate,
        taxAmount: taxAmount,
        total: subtotal + taxAmount,
      };
    });

    const metadataNotes = [
      scanResult?.issuerName ? `Origen: Compra a ${scanResult.issuerName}` : '',
      scanResult?.folio ? `Folio proveedor: ${scanResult.folio}` : '',
      scanResult?.date ? `Fecha original: ${scanResult.date}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    onLoadItemsToEditor(convertedItems, {
      notes: metadataNotes,
      folioSource: scanResult?.folio,
      clientName: scanResult?.receiverName,
    });

    onClose();
  };

  const handleLoadDemoDocument = () => {
    setError(null);
    const demoData: ScanResult = {
      docType: 'factura',
      folio: 'PROV-84920',
      date: new Date().toISOString().split('T')[0],
      issuerName: 'DISTRIBUIDORA INDUSTRIAL DEL NORTE S.A.',
      issuerTaxId: 'DIN990315K72',
      receiverName: 'MI EMPRESA',
      items: [
        {
          quantity: 20,
          unit: 'pza',
          name: 'Disco de Corte Abrasivo 4-1/2" Metal',
          description: 'Disco de alto rendimiento para esmeriladora angular',
          purchasePrice: 28.5,
          discountPercent: 5,
        },
        {
          quantity: 5,
          unit: 'jgo',
          name: 'Juego de Brocas para Concreto 5 Piezas',
          description: 'Puntas de carburo de tungsteno para taladro percutor',
          purchasePrice: 145.0,
          discountPercent: 0,
        },
        {
          quantity: 2,
          unit: 'rollo',
          name: 'Cinta Aislante Industrial Super 33+ (20 m)',
          description: 'Cinta de vinilo para aislamiento de hasta 600V',
          purchasePrice: 82.0,
          discountPercent: 10,
        },
        {
          quantity: 12,
          unit: 'par',
          name: 'Guantes de Nitrilo para Trabajo Pesado',
          description: 'Resistentes a solventes y abrasión mecánica',
          purchasePrice: 45.0,
          discountPercent: 0,
        },
      ],
      subtotal: 1877.0,
      taxAmount: 300.32,
      total: 2177.32,
      notes: 'Factura pagada a proveedor con transferencia bancaria.',
    };

    setScanResult(demoData);
    const formatted = demoData.items.map((it) => {
      const pPrice = Number(it.purchasePrice) || 0;
      const margin = globalMargin;
      const sPrice = Math.round(pPrice * (1 + margin / 100) * 100) / 100;
      return {
        ...it,
        selected: true,
        marginPercent: margin,
        sellingPrice: sPrice,
      };
    });
    setItems(formatted);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setScanResult(null);
    setError(null);
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
              <Sparkles className="h-5 w-5 text-indigo-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Escáner Inteligente con IA</h2>
              <p className="text-xs text-indigo-200">
                Digitaliza facturas de compra, tickets o remisiones y conviértelas en partidas con margen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 border border-red-200">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Atención al procesar documento</p>
                  <p className="text-red-700 text-xs sm:text-sm">{error}</p>
                </div>
              </div>
              {file && (
                <button
                  type="button"
                  onClick={processScan}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs flex-shrink-0 cursor-pointer disabled:opacity-50 self-end sm:self-center"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Reintentando...' : 'Reintentar Escaneo'}</span>
                </button>
              )}
            </div>
          )}

          {!scanResult ? (
            /* Upload / Capture Section */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Take Photo button for mobile / tablet */}
                <div
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 cursor-pointer transition-all text-center group"
                >
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                    }}
                  />
                  <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <Camera className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-slate-800">Tomar Foto con Cámara</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Fotografía directa de un ticket de mostrador, remisión impresa o factura física
                  </p>
                </div>

                {/* Upload File / PDF */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 cursor-pointer transition-all text-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelected(e.target.files[0]);
                    }}
                  />
                  <div className="h-14 w-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
                    <Upload className="h-7 w-7" />
                  </div>
                  <h3 className="font-bold text-slate-800">Subir Archivo o PDF</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    PDFs vectoriales, comprobantes fiscales, escaneos JPG, PNG o WEBP
                  </p>
                </div>
              </div>

              {/* Demo button */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleLoadDemoDocument}
                  className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>¿Sin archivo a la mano? Cargar ejemplo de comprobante digitalizado</span>
                </button>
              </div>

              {/* Selected File Preview Box */}
              {file && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-16 w-16 object-cover rounded-lg border border-slate-300 shadow-sm"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs border border-red-200">
                        <FileText className="h-8 w-8" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB • {file.type || 'Documento'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button
                      onClick={resetAll}
                      disabled={isScanning}
                      className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Cambiar archivo
                    </button>
                    <button
                      onClick={processScan}
                      disabled={isScanning}
                      className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Extrayendo con IA...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Extraer Partidas con IA</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions banner */}
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-indigo-950">
                  <CheckCircle className="h-4 w-4 text-indigo-600" />
                  ¿Cómo funciona el escáner inteligente?
                </p>
                <p className="text-indigo-800">
                  La visión multimodal de Gemini analiza automáticamente fotos de notas de remisión, tickets de mostrador o PDFs de proveedores, detectando unidades, cantidades, descripciones y precios unitarios de compra. Luego podrás aplicar tu margen deseado y transferir los conceptos a tu factura o nota en 1 clic.
                </p>
              </div>
            </div>
          ) : (
            /* Results & Margin Calculator Section */
            <div className="space-y-6">
              {/* Document Overview Metadata */}
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block">Tipo detectado:</span>
                  <span className="font-bold text-slate-800 capitalize">
                    {scanResult.docType || 'Documento'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Folio origen:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {scanResult.folio || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Proveedor emisor:</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {scanResult.issuerName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha origen:</span>
                  <span className="font-bold text-slate-800">
                    {scanResult.date || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Profit Margin Assistant Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Percent className="h-4 w-4 text-indigo-600" />
                      Asistente de Margen de Ganancia (Precio de Venta)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Calcula automáticamente tu precio de venta final sumando tu % de ganancia sobre los precios de compra extraídos.
                    </p>
                  </div>

                  {/* Preset Margins */}
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Margen rápido:</span>
                    {[15, 20, 25, 30, 35, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => applyGlobalMargin(pct)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                          globalMargin === pct
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-600 font-medium">Margen personalizado:</label>
                    <div className="flex items-center rounded-lg border border-slate-300 px-2 py-1 bg-white">
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={globalMargin}
                        onChange={(e) => applyGlobalMargin(parseFloat(e.target.value) || 0)}
                        className="w-14 text-center font-bold text-indigo-700 focus:outline-none"
                      />
                      <span className="text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(true)}
                      className="text-xs text-indigo-600 hover:underline font-semibold"
                    >
                      Seleccionar todas
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(false)}
                      className="text-xs text-slate-500 hover:underline font-semibold"
                    >
                      Deseleccionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">Sel.</th>
                        <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                        <th className="py-2.5 px-3 w-16">Unidad</th>
                        <th className="py-2.5 px-3">Concepto / Producto</th>
                        <th className="py-2.5 px-3 text-right">P. Compra</th>
                        <th className="py-2.5 px-3 text-center w-24">Margen %</th>
                        <th className="py-2.5 px-3 text-right font-bold text-indigo-900">
                          P. Venta Sugerido
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {items.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            !item.selected ? 'opacity-40 bg-slate-50/50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={!!item.selected}
                              onChange={() => toggleItemSelection(idx)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{item.unit}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block">{item.name}</span>
                            {item.description && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                                {item.description}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            ${Number(item.purchasePrice || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center rounded border border-slate-200 px-1.5 py-0.5 bg-slate-50">
                              <input
                                type="number"
                                min="0"
                                max="500"
                                value={item.marginPercent ?? globalMargin}
                                onChange={(e) => updateItemMargin(idx, parseFloat(e.target.value) || 0)}
                                className="w-10 text-center font-bold text-slate-800 focus:outline-none text-[11px]"
                              />
                              <span className="text-slate-400 font-bold text-[10px]">%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                            <div className="inline-flex items-center justify-end">
                              <span className="text-slate-400 mr-0.5">$</span>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={item.sellingPrice ?? 0}
                                onChange={(e) => updateItemSellingPrice(idx, parseFloat(e.target.value) || 0)}
                                className="w-20 text-right font-bold text-indigo-700 focus:outline-none border-b border-dashed border-indigo-300 bg-transparent"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Total partidas extraídas: <strong className="text-slate-800">{items.length}</strong> | 
                    Seleccionadas:{' '}
                    <strong className="text-indigo-600 font-bold">
                      {items.filter((i) => i.selected).length}
                    </strong>
                  </span>
                  <span>
                    Total Venta Proyectada:{' '}
                    <strong className="text-slate-900 font-mono text-sm ml-1 font-bold">
                      $
                      {items
                        .filter((i) => i.selected)
                        .reduce((acc, i) => acc + (i.quantity || 1) * (i.sellingPrice || 0), 0)
                        .toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
          {scanResult ? (
            <button
              onClick={resetAll}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Escanear otro documento
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            {scanResult && (
              <button
                onClick={handleTransferToEditor}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Cargar partidas al editor</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
