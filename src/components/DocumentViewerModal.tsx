import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  Share2,
  Copy,
  CheckCircle,
  X,
  Building,
  Calendar,
  Truck,
  CreditCard,
  FileText,
  Clock,
  Ban,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { DocumentRecord, CompanySettings, DocumentStatus, PdfCustomizationOptions } from '../types';
import { downloadPdfDocument, resolvePdfOptions } from '../utils/pdfGenerator';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentRecord | null;
  companySettings: CompanySettings;
  onUpdateStatus?: (id: string, status: DocumentStatus) => void;
  onDuplicate?: (doc: DocumentRecord) => void;
}

const DEFAULT_OPTIONS: PdfCustomizationOptions = {
  mode: 'cliente',
  // Empresa / Emisor
  showLogo: true,
  showIssuerBusinessName: true,
  showIssuerTradeName: true,
  showIssuerTaxId: true,
  showIssuerAddress: true,
  showIssuerPhone: true,
  showIssuerEmail: true,
  showBankDetails: true,
  // Folio y Fechas
  showFolio: true,
  showDates: true,
  showStatus: true,
  // Cliente
  showClientName: true,
  showClientTaxId: true,
  showClientAddress: true,
  showClientPhone: true,
  showClientEmail: true,
  // Partidas y Cálculos
  showDeliveryDetails: true,
  showItemDescriptions: true,
  showUnitPrices: true,
  showTaxes: true,
  showRetentions: true,
  // Cierre y Legal
  showTotalInWords: true,
  showNotes: true,
  showTerms: true,
  showSignatures: true,
};

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
  companySettings,
  onUpdateStatus,
  onDuplicate,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Field customization options initialized from companySettings and document
  const [options, setOptions] = useState<PdfCustomizationOptions>(() => {
    return resolvePdfOptions(companySettings, document || undefined, 'cliente');
  });

  // Sync options when document or settings change
  useEffect(() => {
    if (document) {
      setOptions((prev) => resolvePdfOptions(companySettings, document, prev.mode || 'cliente'));
    }
  }, [document, companySettings]);

  if (!isOpen || !document) return null;

  const docTypeLabels: Record<string, { title: string; color: string; badgeBg: string; badgeText: string }> = {
    factura: {
      title: 'FACTURA COMERCIAL / FISCAL',
      color: 'text-indigo-900',
      badgeBg: 'bg-indigo-900 text-white',
      badgeText: 'Factura',
    },
    remision: {
      title: 'NOTA DE REMISIÓN / ENTREGA',
      color: 'text-emerald-900',
      badgeBg: 'bg-emerald-800 text-white',
      badgeText: 'Remisión',
    },
    nota_venta: {
      title: 'NOTA DE VENTA / MOSTRADOR',
      color: 'text-slate-900',
      badgeBg: 'bg-slate-800 text-white',
      badgeText: 'Nota de Venta',
    },
  };

  const currentType = docTypeLabels[document.docType] || docTypeLabels.factura;

  const statusBadges: Record<DocumentStatus, { text: string; bg: string; border: string }> = {
    borrador: { text: 'BORRADOR', bg: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
    emitida: { text: 'EMITIDA', bg: 'bg-blue-50 text-blue-700', border: 'border-blue-300' },
    pendiente: { text: 'PENDIENTE DE PAGO', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-300' },
    pagada: { text: 'PAGADA / LIQUIDADA', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-300' },
    cancelada: { text: 'CANCELADA', bg: 'bg-red-50 text-red-700', border: 'border-red-300' },
  };

  // Internal total calculations
  const totalCost = document.totalCost ?? document.items.reduce((acc, it) => acc + (it.quantity * (it.costPrice || it.unitPrice)), 0);
  const totalProfit = document.totalProfit ?? document.items.reduce((acc, it) => acc + (it.profit || (it.quantity * (it.unitPrice - (it.costPrice || it.unitPrice)))), 0);
  const avgMarkup = totalCost > 0 ? Math.round((totalProfit / totalCost) * 10000) / 100 : 0;

  const handlePrint = () => {
    window.print();
  };

  const generatePdf = (mode: 'cliente' | 'interno') => {
    try {
      downloadPdfDocument(document, companySettings, mode, options);
    } catch (e) {
      console.error('Error generating PDF:', e);
      window.print();
    }
  };

  const handleShareWhatsApp = () => {
    const phone = (document.clientPhone || companySettings.whatsapp || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hola ${document.clientName}, le compartimos los detalles de su ${currentType.badgeText} con folio *${document.folio}* expedida por *${companySettings.tradeName || companySettings.businessName}*:\n\n` +
        `• Total a pagar: *$${document.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${document.currency}*\n` +
        `• Fecha de emisión: ${document.issueDate}\n` +
        (options.showBankDetails && companySettings.bankClabe ? `• CLABE para transferencia (${companySettings.bankName}): *${companySettings.bankClabe}*\n\n` : '\n') +
        `Quedamos atentos a cualquier consulta. ¡Gracias por su preferencia!`
    );
    window.open(`https://wa.me/${phone ? phone : ''}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[96vh]">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="print:hidden border-b border-slate-200 px-4 sm:px-6 py-3.5 bg-slate-900 text-white rounded-t-2xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${currentType.badgeBg}`}>
                {currentType.badgeText}
              </span>
              <span className="font-mono text-base font-bold text-slate-100">{document.folio}</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${statusBadges[document.status].bg} ${statusBadges[document.status].border}`}
              >
                {statusBadges[document.status].text}
              </span>
            </div>

            {/* Mode Switcher: Cliente vs Interno */}
            <div className="flex items-center p-1 rounded-xl bg-slate-800 border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOptions({ ...options, mode: 'cliente' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  options.mode === 'cliente'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista para el cliente (sin márgenes ni costos originales visibles)"
              >
                <UserCheck className="h-3.5 w-3.5" />
                <span>Vista Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setOptions({ ...options, mode: 'interno' })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  options.mode === 'interno'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Vista interna confidencial con costo original, % de aumento y ganancia neta"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Vista Interna (Ganancias)</span>
              </button>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Download Client PDF */}
              <button
                onClick={() => generatePdf('cliente')}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Descargar PDF para el cliente (limpio, sin % de aumento ni ganancia)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>PDF Cliente</span>
              </button>

              {/* Download Internal PDF */}
              <button
                onClick={() => generatePdf('interno')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Descargar PDF interno con desglose de costo, % aumento y ganancia"
              >
                <Download className="h-3.5 w-3.5 text-amber-400" />
                <span>PDF Interno</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                title="Imprimir comprobante"
              >
                <Printer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                title="Compartir por WhatsApp"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate(document);
                    onClose();
                  }}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
                  title="Duplicar documento"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg ml-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Printable Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 print:bg-white print:p-0">
          <div
            ref={printAreaRef}
            className="mx-auto max-w-3xl bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-slate-200/80 print:shadow-none print:border-none print:p-0 print:m-0 space-y-6 text-slate-800 text-xs font-sans"
          >
            {/* Top decorative bar */}
            <div
              className={`h-2 w-full rounded-full ${
                options.mode === 'interno'
                  ? 'bg-slate-900'
                  : document.docType === 'remision'
                  ? 'bg-emerald-600'
                  : document.docType === 'nota_venta'
                  ? 'bg-slate-800'
                  : 'bg-indigo-700'
              }`}
            />

            {/* Mode Banner inside Document */}
            {options.mode === 'interno' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-700 flex-shrink-0" />
                  <span className="font-bold">
                    DOCUMENTO DE CONTROL INTERNO: Incluye costo original, % de aumento y ganancia neta.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-200 font-bold text-[10px] text-amber-900">
                  USO INTERNO
                </span>
              </div>
            )}

            {/* Header: Company & Folio */}
            <div className="flex flex-col sm:flex-row print:flex-row justify-between print:justify-between items-start gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                {options.showLogo && (
                  companySettings.logoUrl ? (
                    <img
                      src={companySettings.logoUrl}
                      alt="Logo"
                      className="h-16 w-auto max-w-[140px] object-contain rounded"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {companySettings.tradeName
                        ? companySettings.tradeName.charAt(0)
                        : companySettings.businessName.charAt(0)}
                    </div>
                  )
                )}

                <div>
                  {options.showIssuerBusinessName && companySettings.businessName && (
                    <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                      {companySettings.businessName}
                    </h1>
                  )}

                  {options.showIssuerTradeName && companySettings.tradeName && (
                    <p className="text-xs font-bold text-indigo-700">{companySettings.tradeName}</p>
                  )}

                  {options.showIssuerTaxId && companySettings.taxId && (
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      RFC: <strong>{companySettings.taxId}</strong>
                      {companySettings.taxRegime && ` • ${companySettings.taxRegime}`}
                    </p>
                  )}

                  {options.showIssuerAddress && (companySettings.street || companySettings.city) && (
                    <p className="text-[11px] text-slate-500">
                      {companySettings.street} {companySettings.exteriorNumber}
                      {companySettings.interiorNumber && ` Int ${companySettings.interiorNumber}`},{' '}
                      {companySettings.neighborhood}, {companySettings.city}, {companySettings.state} C.P.{' '}
                      {companySettings.postalCode}
                    </p>
                  )}

                  {(options.showIssuerPhone || options.showIssuerEmail) && (
                    <p className="text-[11px] text-slate-500">
                      {[
                        options.showIssuerPhone && companySettings.phone ? `Tel: ${companySettings.phone}` : '',
                        options.showIssuerEmail && companySettings.email ? `Email: ${companySettings.email}` : '',
                      ]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Folio & Doc Type Badge */}
              {(options.showFolio || options.showStatus) && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-right w-full sm:w-auto shadow-sm">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                    {options.mode === 'interno' ? `${currentType.title} (INTERNO)` : currentType.title}
                  </span>
                  {options.showFolio && (
                    <span className="font-mono text-xl font-black text-slate-900 block my-0.5">
                      {document.folio}
                    </span>
                  )}
                  {options.showStatus && (
                    <div className="flex sm:justify-end gap-1.5 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadges[document.status].bg} ${statusBadges[document.status].border}`}
                      >
                        {statusBadges[document.status].text}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Client & Dates Grid */}
            {(options.showClientName || options.showClientTaxId || options.showClientAddress || options.showClientPhone || options.showClientEmail || options.showDates) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Datos del Cliente / Receptor
                  </span>
                  {options.showClientName && (
                    <p className="text-sm font-bold text-slate-900">{document.clientName}</p>
                  )}

                  {options.showClientTaxId && document.clientTaxId && (
                    <p className="font-mono text-slate-600 mt-0.5">
                      RFC: <strong>{document.clientTaxId}</strong>
                    </p>
                  )}

                  {options.showClientAddress && document.clientAddress && (
                    <p className="text-slate-600 mt-0.5">{document.clientAddress}</p>
                  )}

                  {((options.showClientPhone && document.clientPhone) || (options.showClientEmail && document.clientEmail)) && (
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {[
                        options.showClientPhone && document.clientPhone ? document.clientPhone : '',
                        options.showClientEmail && document.clientEmail ? document.clientEmail : '',
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </p>
                  )}
                </div>

                {options.showDates && (
                  <div className="sm:border-l sm:border-slate-200 sm:pl-4 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Datos de Emisión y Moneda
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fecha de expedición:</span>
                      <span className="font-semibold text-slate-800">{document.issueDate}</span>
                    </div>
                    {document.dueDate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Fecha de vencimiento:</span>
                        <span className="font-semibold text-slate-800">{document.dueDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Moneda comercial:</span>
                      <span className="font-bold text-slate-800">{document.currency || 'MXN'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Remisión / Entrega Transport block */}
            {options.showDeliveryDetails && document.docType === 'remision' && (document.driverName || document.vehiclePlates || document.deliveryAddress) && (
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                  <Truck className="h-4 w-4 text-emerald-700" />
                  <span>Datos de Traslado y Entrega en Destino / Obra</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-emerald-900">
                  <div>
                    <span className="text-emerald-700/80 block">Chofer / Repartidor:</span>
                    <strong className="text-emerald-950">{document.driverName || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700/80 block">Vehículo / Placas:</span>
                    <strong className="text-emerald-950">{document.vehiclePlates || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-emerald-700/80 block">Dirección de Entrega:</span>
                    <strong className="text-emerald-950">{document.deliveryAddress || 'En obra / domicilio cliente'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  {options.mode === 'cliente' ? (
                    /* CLIENT VIEW: NO % AUMENTO, NO COSTO, NO GANANCIA */
                    <tr>
                      <th className="py-2.5 px-3 text-center w-12">Cant.</th>
                      <th className="py-2.5 px-3 w-16">Unidad</th>
                      <th className="py-2.5 px-3">Concepto / Descripción</th>
                      {options.showUnitPrices && (
                        <th className="py-2.5 px-3 text-right w-28">P. Unitario</th>
                      )}
                      <th className="py-2.5 px-3 text-right w-28">Importe</th>
                    </tr>
                  ) : (
                    /* INTERNAL VIEW: WITH COST, % AUMENTO, AND PROFIT */
                    <tr>
                      <th className="py-2.5 px-2 text-center w-10">Cant.</th>
                      <th className="py-2.5 px-2 w-14">Unidad</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-2 text-right w-20 text-slate-500">Costo U.</th>
                      <th className="py-2.5 px-2 text-center w-16 text-indigo-700">+% Aum.</th>
                      <th className="py-2.5 px-2 text-right w-22 text-slate-900 font-bold">P. Venta</th>
                      <th className="py-2.5 px-2 text-right w-20 text-emerald-700 font-bold">Ganancia</th>
                      <th className="py-2.5 px-3 text-right w-24">Importe</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {document.items.map((item, index) => {
                    const cost = item.costPrice !== undefined ? item.costPrice : item.unitPrice;
                    const markup = item.markupPercent !== undefined ? item.markupPercent : 0;
                    const profit = item.profit !== undefined ? item.profit : Math.round(item.quantity * (item.unitPrice - cost) * 100) / 100;

                    return (
                      <tr key={item.id || index} className={index % 2 === 1 ? 'bg-slate-50/40' : ''}>
                        {options.mode === 'cliente' ? (
                          <>
                            <td className="py-2 px-3 text-center font-bold font-mono text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-3 text-slate-500">{item.unit || 'pza'}</td>
                            <td className="py-2 px-3">
                              <strong className="text-slate-900 block">{item.name}</strong>
                              {options.showItemDescriptions && item.description && (
                                <span className="text-[11px] text-slate-500 block">
                                  {item.description}
                                </span>
                              )}
                            </td>
                            {options.showUnitPrices && (
                              <td className="py-2 px-3 text-right font-mono text-slate-700 font-semibold">
                                ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            )}
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-2 text-center font-bold font-mono text-slate-900">
                              {item.quantity}
                            </td>
                            <td className="py-2 px-2 text-slate-500">{item.unit || 'pza'}</td>
                            <td className="py-2 px-3">
                              <strong className="text-slate-900 block">{item.name}</strong>
                              {options.showItemDescriptions && item.description && (
                                <span className="text-[10px] text-slate-500 block truncate max-w-xs">
                                  {item.description}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-500">
                              ${cost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-center font-mono font-bold text-indigo-700 bg-indigo-50/30">
                              +{markup}%
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                              ${item.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                              +${profit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                              ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals & Optional Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-12 print:grid-cols-12 gap-6 pt-2">
              {/* Left Column */}
              <div className="sm:col-span-7 print:col-span-7 space-y-4">
                {options.showTotalInWords && document.totalInWords && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Importe total con letra
                    </span>
                    <p className="font-bold text-xs text-slate-800 leading-snug">
                      {document.totalInWords}
                    </p>
                  </div>
                )}

                {/* Internal Profit Card in Internal View */}
                {options.mode === 'interno' && (
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs space-y-1">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-700" />
                      Balance Interno de Costos vs Ganancia
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-500">Costo total invertido:</span>
                        <strong className="block font-mono text-slate-900">
                          ${totalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Ganancia neta del pedido:</span>
                        <strong className="block font-mono text-emerald-800 font-bold">
                          +${totalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (+{avgMarkup}%)
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bank Card (optional) */}
                {options.showBankDetails && companySettings.bankName && companySettings.bankClabe && (
                  <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 text-xs space-y-1">
                    <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-indigo-700" />
                      Datos para Pago / Transferencia SPEI
                    </p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px] text-slate-700">
                      <div>
                        <span className="text-slate-500">Banco:</span>{' '}
                        <strong>{companySettings.bankName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Cuenta:</span>{' '}
                        <strong className="font-mono">{companySettings.bankAccountNumber || 'N/A'}</strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">CLABE:</span>{' '}
                        <strong className="font-mono text-indigo-900 font-bold tracking-wide">
                          {companySettings.bankClabe}
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Beneficiario:</span>{' '}
                        <span className="font-medium">{companySettings.bankAccountHolder}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document specific Notes */}
                {options.showNotes && document.notes && (
                  <div className="text-[11px] text-slate-500">
                    <strong className="text-slate-700 block mb-0.5">Observaciones:</strong>
                    <p>{document.notes}</p>
                  </div>
                )}

                {/* Terms and conditions */}
                {options.showTerms && document.terms && (
                  <div className="text-[10px] text-slate-400">
                    <strong className="text-slate-600 block mb-0.5">Términos y condiciones:</strong>
                    <p>{document.terms}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Summary Table */}
              <div className="sm:col-span-5 print:col-span-5 space-y-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium">
                      ${document.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {options.showTaxes && (
                    <div className="flex justify-between text-slate-600">
                      <span>IVA ({Math.round((document.taxRate || 0.16) * 100)}%):</span>
                      <span className="font-mono font-medium">
                        ${document.taxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {options.showRetentions && document.retentionAmount > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>Retenciones:</span>
                      <span className="font-mono">
                        -${document.retentionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline">
                    <span className="text-sm font-black text-slate-900 uppercase">Total General:</span>
                    <span className="font-mono text-lg font-black text-indigo-900">
                      ${document.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-xs font-normal text-slate-600">{document.currency}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Reception Signatures (Optional) */}
            {options.showSignatures && (
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center">
                <div>
                  <div className="h-14 border-b border-dashed border-slate-300" />
                  <p className="mt-2 font-bold text-xs text-slate-800">RECIBIDO DE CONFORMIDAD</p>
                  <p className="text-[10px] text-slate-400">Nombre, Fecha y Firma de quien recibe</p>
                </div>

                <div>
                  <div className="h-14 border-b border-dashed border-slate-300" />
                  <p className="mt-2 font-bold text-xs text-slate-800">FIRMA AUTORIZADA / EMISIÓN</p>
                  <p className="text-[10px] text-slate-400">
                    {companySettings.tradeName || companySettings.businessName}
                  </p>
                </div>
              </div>
            )}

            {/* Footer stamp */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Comprobante emitido con FacturaYa • Sistema de Emisión y Control</span>
              <span>
                Folio: {document.folio} {options.mode === 'interno' ? '(Control Interno)' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
