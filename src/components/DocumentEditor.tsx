import React, { useState, useEffect } from 'react';
import {
  FileText,
  Truck,
  ShoppingBag,
  Plus,
  Trash2,
  Sparkles,
  Users,
  Save,
  Eye,
  RotateCcw,
  Percent,
  CheckCircle,
  Hash,
  AlertCircle,
  Clock,
  DollarSign,
  Edit2,
  Lock,
  Unlock,
  TrendingUp,
  Sliders,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import {
  DocumentRecord,
  DocumentType,
  DocumentStatus,
  DocumentItem,
  CompanySettings,
  ClientRecord,
  PdfCustomizationOptions,
} from '../types';
import { numberToWords } from '../utils/numberToWords';
import { downloadPdfDocument, resolvePdfOptions } from '../utils/pdfGenerator';

interface DocumentEditorProps {
  companySettings: CompanySettings;
  clients: ClientRecord[];
  activeDocument: DocumentRecord | null;
  onSaveDocument: (doc: DocumentRecord) => Promise<void>;
  onOpenScanner: () => void;
  onOpenClients: () => void;
  onPreviewDocument: (doc: DocumentRecord) => void;
  onResetToNew: () => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  companySettings,
  clients,
  activeDocument,
  onSaveDocument,
  onOpenScanner,
  onOpenClients,
  onPreviewDocument,
  onResetToNew,
}) => {
  // Document state
  const [docType, setDocType] = useState<DocumentType>('factura');
  const [folio, setFolio] = useState<string>('');
  const [isManualFolio, setIsManualFolio] = useState<boolean>(false);
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>('');
  const [status, setStatus] = useState<DocumentStatus>('emitida');
  const [currency, setCurrency] = useState<string>('MXN');

  // Client State
  const [clientName, setClientName] = useState<string>('');
  const [clientTaxId, setClientTaxId] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');

  // Remision specific
  const [driverName, setDriverName] = useState<string>('');
  const [vehiclePlates, setVehiclePlates] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');

  // Items State
  const [items, setItems] = useState<DocumentItem[]>([
    {
      id: 'item-1',
      quantity: 1,
      unit: 'pza',
      name: '',
      description: '',
      costPrice: 0,
      markupPercent: 25,
      unitPrice: 0,
      subtotal: 0,
      profit: 0,
      taxRate: 0.16,
      taxAmount: 0,
      total: 0,
    },
  ]);

  // Tax and retentions
  const [taxRate, setTaxRate] = useState<number>(0.16); // 16% IVA standard
  const [retentionRate, setRetentionRate] = useState<number>(0); // 0%, 1.25% (RESICO), 10.66% etc.

  // Notes and conditions
  const [notes, setNotes] = useState<string>('');
  const [terms, setTerms] = useState<string>(companySettings.defaultTerms || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Resolves PDF options strictly from companySettings.defaultPdfOptions (configured via Configuración)
  const pdfOptions = resolvePdfOptions(companySettings, activeDocument || undefined, 'cliente');

  const handleDownloadPdf = (mode: 'cliente' | 'interno') => {
    const doc = buildCurrentDocument();
    downloadPdfDocument(doc, companySettings, mode);
  };

  // Auto calculate consecutive folio when docType changes
  const getNextFolioForType = (type: DocumentType): string => {
    if (type === 'factura') {
      return `${companySettings.invoicePrefix || 'FACT-'}${companySettings.invoiceNextNumber || 101}`;
    } else if (type === 'remision') {
      return `${companySettings.remisionPrefix || 'REM-'}${companySettings.remisionNextNumber || 301}`;
    } else {
      return `${companySettings.saleNotePrefix || 'NOT-'}${companySettings.saleNoteNextNumber || 501}`;
    }
  };

  // Load active document or initialize with settings
  useEffect(() => {
    if (activeDocument) {
      setDocType(activeDocument.docType);
      setFolio(activeDocument.folio);
      setIsManualFolio(true);
      setIssueDate(activeDocument.issueDate);
      setDueDate(activeDocument.dueDate || '');
      setStatus(activeDocument.status);
      setCurrency(activeDocument.currency || 'MXN');

      setClientName(activeDocument.clientName || '');
      setClientTaxId(activeDocument.clientTaxId || '');
      setClientPhone(activeDocument.clientPhone || '');
      setClientEmail(activeDocument.clientEmail || '');
      setClientAddress(activeDocument.clientAddress || '');

      setDriverName(activeDocument.driverName || '');
      setVehiclePlates(activeDocument.vehiclePlates || '');
      setDeliveryAddress(activeDocument.deliveryAddress || '');

      if (activeDocument.items.length > 0) {
        setItems(
          activeDocument.items.map((it) => {
            const cost = it.costPrice !== undefined ? it.costPrice : it.unitPrice || 0;
            const markup = it.markupPercent !== undefined ? it.markupPercent : 0;
            const uPrice = it.unitPrice || Math.round(cost * (1 + markup / 100) * 100) / 100;
            const sub = Math.round(it.quantity * uPrice * 100) / 100;
            const prof = Math.round(it.quantity * (uPrice - cost) * 100) / 100;
            return {
              ...it,
              costPrice: cost,
              markupPercent: markup,
              unitPrice: uPrice,
              subtotal: sub,
              profit: prof,
            };
          })
        );
      } else {
        setItems([
          {
            id: 'item-1',
            quantity: 1,
            unit: 'pza',
            name: '',
            description: '',
            costPrice: 0,
            markupPercent: 25,
            unitPrice: 0,
            subtotal: 0,
            profit: 0,
            taxRate: 0.16,
            taxAmount: 0,
            total: 0,
          },
        ]);
      }
      setTaxRate(activeDocument.taxRate);
      setRetentionRate(activeDocument.retentionRate || 0);
      setNotes(activeDocument.notes || '');
      setTerms(activeDocument.terms || companySettings.defaultTerms || '');
    } else {
      setFolio(getNextFolioForType(docType));
      setIsManualFolio(false);
      setTerms(companySettings.defaultTerms || '');
    }
  }, [activeDocument, companySettings]);

  // When changing docType, update consecutive folio if not manually locked
  const handleTypeChange = (newType: DocumentType) => {
    setDocType(newType);
    if (!isManualFolio) {
      setFolio(getNextFolioForType(newType));
    }
  };

  // Line item manipulation
  const updateItem = (index: number, field: keyof DocumentItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };

      let qty = item.quantity;
      let cost = item.costPrice;
      let markup = item.markupPercent;
      let uPrice = item.unitPrice;
      const lineTaxRate = field === 'taxRate' ? Number(value) : (item.taxRate ?? taxRate);

      if (field === 'quantity') {
        qty = Number(value) || 0;
      } else if (field === 'costPrice') {
        cost = Number(value) || 0;
        uPrice = Math.round(cost * (1 + markup / 100) * 100) / 100;
      } else if (field === 'markupPercent') {
        markup = Number(value) || 0;
        uPrice = Math.round(cost * (1 + markup / 100) * 100) / 100;
      } else if (field === 'unitPrice') {
        uPrice = Number(value) || 0;
        // Recalculate markup if cost is specified
        if (cost > 0) {
          markup = Math.round(((uPrice - cost) / cost) * 10000) / 100;
        }
      } else {
        (item as any)[field] = value;
      }

      const subtotal = Math.round(qty * uPrice * 100) / 100;
      const profit = Math.round(qty * (uPrice - cost) * 100) / 100;
      const taxAmount = Math.round(subtotal * lineTaxRate * 100) / 100;

      item.quantity = qty;
      item.costPrice = cost;
      item.markupPercent = markup;
      item.unitPrice = uPrice;
      item.subtotal = subtotal;
      item.profit = profit;
      item.taxRate = lineTaxRate;
      item.taxAmount = taxAmount;
      item.total = subtotal + taxAmount;

      copy[index] = item;
      return copy;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        quantity: 1,
        unit: 'pza',
        name: '',
        description: '',
        costPrice: 0,
        markupPercent: 25,
        unitPrice: 0,
        subtotal: 0,
        profit: 0,
        taxRate: taxRate,
        taxAmount: 0,
        total: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        {
          id: `item-${Date.now()}`,
          quantity: 1,
          unit: 'pza',
          name: '',
          description: '',
          costPrice: 0,
          markupPercent: 25,
          unitPrice: 0,
          subtotal: 0,
          profit: 0,
          taxRate: taxRate,
          taxAmount: 0,
          total: 0,
        },
      ]);
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedSubtotal = Math.round(
    items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0) * 100
  ) / 100;

  const calculatedTotalCost = Math.round(
    items.reduce((acc, it) => acc + (it.quantity * it.costPrice), 0) * 100
  ) / 100;

  const calculatedTotalProfit = Math.round(
    items.reduce((acc, it) => acc + (it.quantity * (it.unitPrice - it.costPrice)), 0) * 100
  ) / 100;

  const averageMarkupPercent =
    calculatedTotalCost > 0
      ? Math.round((calculatedTotalProfit / calculatedTotalCost) * 10000) / 100
      : 0;

  const taxableBase = calculatedSubtotal;
  const calculatedTaxAmount = Math.round(taxableBase * taxRate * 100) / 100;
  const calculatedRetentionAmount = Math.round(taxableBase * retentionRate * 100) / 100;
  const calculatedTotal = Math.max(
    0,
    Math.round((taxableBase + calculatedTaxAmount - calculatedRetentionAmount) * 100) / 100
  );
  const totalInWords = numberToWords(calculatedTotal, currency);

  // Client Autofill
  const handleClientSelectByName = (name: string) => {
    setClientName(name);
    const found = clients.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (found) {
      setClientTaxId(found.taxId || '');
      setClientPhone(found.phone || '');
      setClientEmail(found.email || '');
      setClientAddress(found.address || '');
    }
  };

  // Build document object
  const buildCurrentDocument = (forcedStatus?: DocumentStatus): DocumentRecord => {
    return {
      id: activeDocument?.id || `doc-${Date.now()}`,
      userId: activeDocument?.userId || companySettings.userId || 'local-user',
      docType,
      folio: folio || getNextFolioForType(docType),
      issueDate,
      dueDate,
      status: forcedStatus || status,
      currency,
      clientName: clientName.trim() || 'PÚBLICO EN GENERAL',
      clientTaxId: clientTaxId.trim().toUpperCase() || 'XAXX010101000',
      clientPhone,
      clientEmail,
      clientAddress,
      driverName: docType === 'remision' ? driverName : undefined,
      vehiclePlates: docType === 'remision' ? vehiclePlates : undefined,
      deliveryAddress: docType === 'remision' ? deliveryAddress : undefined,
      items,
      subtotal: calculatedSubtotal,
      totalCost: calculatedTotalCost,
      totalProfit: calculatedTotalProfit,
      taxRate,
      taxAmount: calculatedTaxAmount,
      retentionRate,
      retentionAmount: calculatedRetentionAmount,
      total: calculatedTotal,
      totalInWords,
      notes,
      terms,
      pdfOptions,
      createdAt: activeDocument?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleSave = async (docStatus: DocumentStatus = 'emitida') => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const docToSave = buildCurrentDocument(docStatus);
      await onSaveDocument(docToSave);
      setSaveMessage(
        docStatus === 'borrador'
          ? 'Borrador guardado exitosamente'
          : `¡${docType === 'factura' ? 'Factura' : docType === 'remision' ? 'Remisión' : 'Nota'} ${folio} guardada exitosamente!`
      );
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (e: any) {
      console.error('Error saving document:', e);
      setSaveMessage('Error al guardar documento');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save Notification */}
      {saveMessage && (
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 shadow-sm animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Action / Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Document Type Selector (1-Click) */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 w-full sm:w-auto">
          {[
            { id: 'factura', label: 'Factura', icon: FileText, desc: 'Comercial / Fiscal' },
            { id: 'remision', label: 'Nota de Remisión', icon: Truck, desc: 'Entrega en Obra' },
            { id: 'nota_venta', label: 'Nota de Venta', icon: ShoppingBag, desc: 'Mostrador' },
          ].map((type) => {
            const Icon = type.icon;
            const isSelected = docType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleTypeChange(type.id as DocumentType)}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? type.id === 'remision'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : type.id === 'nota_venta'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Tools: AI Scanner, Previsualizar, Descargar PDFs y Nuevo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-200 animate-pulse" />
            <span className="hidden xl:inline">Escanear con IA</span>
            <span className="xl:hidden">Escanear</span>
          </button>

          {/* Botón Previsualizar */}
          <button
            type="button"
            onClick={() => onPreviewDocument(buildCurrentDocument())}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-750 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Previsualizar comprobante tal como se imprimirá"
          >
            <Eye className="h-4 w-4 text-indigo-600" />
            <span>Previsualizar</span>
          </button>

          {/* Botón PDF Cliente */}
          <button
            type="button"
            onClick={() => handleDownloadPdf('cliente')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Descargar PDF limpio para el cliente (sin costos ni márgenes)"
          >
            <Download className="h-4 w-4" />
            <span>PDF Cliente</span>
          </button>

          {/* Botón PDF Interno */}
          <button
            type="button"
            onClick={() => handleDownloadPdf('interno')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Descargar PDF interno con costos, % aumento y ganancias"
          >
            <Download className="h-4 w-4 text-amber-400" />
            <span>PDF Interno</span>
          </button>

          <button
            type="button"
            onClick={onResetToNew}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            title="Nuevo comprobante en blanco"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Form Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-6">
        {/* Document Meta Row: Folio, Dates, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pb-6 border-b border-slate-100 text-xs">
          {/* Folio Consecutivo con toggle manual */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Hash className="h-3.5 w-3.5 text-indigo-600" />
                Folio Consecutivo
              </label>
              <button
                type="button"
                onClick={() => setIsManualFolio(!isManualFolio)}
                className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-semibold"
                title="Alternar entre folio automático y edición manual"
              >
                {isManualFolio ? (
                  <>
                    <Unlock className="h-3 w-3 text-amber-500" />
                    <span>Edición Manual</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3 text-slate-400" />
                    <span>Automático</span>
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={folio}
              disabled={!isManualFolio}
              onChange={(e) => setFolio(e.target.value)}
              className={`w-full rounded-xl border px-3.5 py-2 font-mono text-sm font-bold uppercase transition-all ${
                isManualFolio
                  ? 'border-indigo-400 bg-white text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-600'
                  : 'border-slate-200 bg-slate-50 text-slate-700 cursor-not-allowed'
              }`}
            />
          </div>

          {/* Fecha de Emisión */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Fecha de Emisión</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Fecha de Vencimiento */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Vencimiento (Opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Estatus */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado de Pago</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DocumentStatus)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold focus:border-indigo-600 focus:outline-none bg-white"
            >
              <option value="emitida">Emitida / Por Cobrar</option>
              <option value="pagada">Pagada / Liquidada</option>
              <option value="pendiente">Pendiente</option>
              <option value="borrador">Borrador</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>

        {/* Client Block */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4 text-indigo-600" />
              Datos del Cliente / Destinatario
            </h3>
            <button
              type="button"
              onClick={onOpenClients}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Directorio de Clientes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Client Name with Datalist autofill */}
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-600 mb-1">
                Razón Social / Nombre Completo *
              </label>
              <input
                type="text"
                list="client-suggestions"
                value={clientName}
                onChange={(e) => handleClientSelectByName(e.target.value)}
                placeholder="Escribe o selecciona cliente frecuente..."
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-bold uppercase focus:border-indigo-600 focus:outline-none bg-white"
              />
              <datalist id="client-suggestions">
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.taxId ? `${c.name} (${c.taxId})` : c.name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">RFC / ID Fiscal</label>
              <input
                type="text"
                value={clientTaxId}
                onChange={(e) => setClientTaxId(e.target.value.toUpperCase())}
                placeholder="XAXX010101000"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold uppercase focus:border-indigo-600 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Teléfono</label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(55) 1234-5678"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none bg-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-600 mb-1">Dirección Fiscal / Entrega</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Calle, No., Colonia, Municipio, C.P., Estado"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none bg-white"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-600 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="facturacion@cliente.com"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-indigo-600 focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* Remisión Specific Block */}
        {docType === 'remision' && (
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-emerald-600" />
              Datos de Chofer, Transporte y Obra (Exclusivo Remisión)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Nombre del Chofer / Repartidor</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Ej. Roberto Mendoza"
                  className="w-full rounded-xl border border-emerald-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Vehículo / Placas</label>
                <input
                  type="text"
                  value={vehiclePlates}
                  onChange={(e) => setVehiclePlates(e.target.value)}
                  placeholder="Ej. LF-49-218 (Camión 3.5 T)"
                  className="w-full rounded-xl border border-emerald-300 px-3 py-1.5 text-xs bg-white uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-emerald-900 mb-1">Dirección de Obra o Entrega</label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Ej. Obra Torre Platino, Calle Magnolia 45"
                  className="w-full rounded-xl border border-emerald-300 px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Partidas y Conceptos Facturables
              </h3>
              <p className="text-[11px] text-slate-500">
                Ajusta el costo original y el % de aumento. El % de aumento permanecerá privado y nunca aparecerá en el PDF del cliente.
              </p>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all cursor-pointer border border-indigo-200"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar Partida</span>
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-16 text-center">Cant.</th>
                    <th className="py-2.5 px-2 w-20">Unidad</th>
                    <th className="py-2.5 px-3">Concepto / Descripción</th>
                    <th className="py-2.5 px-3 text-right w-24 text-slate-600">Costo Base</th>
                    <th className="py-2.5 px-2 text-center w-24 text-indigo-700">% Aumento</th>
                    <th className="py-2.5 px-3 text-right w-28 text-slate-900 font-black">
                      P. Venta Unit.
                    </th>
                    <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-slate-50/60 transition-colors">
                      {/* Quantity */}
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-14 rounded-lg border border-slate-200 p-1.5 text-center font-bold font-mono focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Unit */}
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(index, 'unit', e.target.value)}
                          placeholder="pza, m..."
                          className="w-16 rounded-lg border border-slate-200 p-1.5 text-center text-slate-600 focus:border-indigo-600 focus:outline-none"
                        />
                      </td>

                      {/* Name and Description */}
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="Nombre o concepto del producto/servicio..."
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 focus:border-indigo-600 focus:outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Descripción detallada, serie, código o especificación (opcional)..."
                          className="w-full rounded border-0 text-[11px] text-slate-500 px-1 py-0.5 focus:bg-slate-50 focus:outline-none"
                        />
                      </td>

                      {/* Costo Base / Original */}
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end rounded-lg border border-slate-200 px-2 py-1.5 bg-slate-50">
                          <span className="text-slate-400 font-bold mr-0.5">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.costPrice || ''}
                            onChange={(e) => updateItem(index, 'costPrice', e.target.value)}
                            className="w-16 text-right font-medium font-mono text-slate-700 focus:outline-none bg-transparent"
                            placeholder="0"
                            title="Costo base de compra u origen"
                          />
                        </div>
                      </td>

                      {/* % de Aumento */}
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50/50 px-1.5 py-1.5">
                          <span className="text-indigo-400 font-bold text-[11px] mr-0.5">+</span>
                          <input
                            type="number"
                            step="any"
                            min="-50"
                            max="500"
                            value={item.markupPercent || ''}
                            onChange={(e) => updateItem(index, 'markupPercent', e.target.value)}
                            className="w-11 text-center font-bold font-mono text-indigo-700 focus:outline-none bg-transparent"
                            placeholder="0"
                            title="% de aumento sobre el costo base"
                          />
                          <span className="text-indigo-400 text-[10px] font-bold">%</span>
                        </div>
                      </td>

                      {/* Unit Price (Precio Venta) */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end rounded-lg border border-slate-200 px-2 py-1.5 bg-white">
                          <span className="text-slate-400 font-bold mr-1">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                            className="w-20 text-right font-bold font-mono text-slate-900 focus:outline-none"
                          />
                        </div>
                      </td>

                      {/* Subtotal */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ${item.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Delete */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="p-1 rounded text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar partida"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50/80 px-4 py-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={addItemRow}
                className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Agregar otra fila</span>
              </button>
              <span>{items.length} partida(s) en total</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Notes, Internal Margin Badge & Live Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Notes and Terms (Left) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Internal profit & margin box (Only visible to user in editor / internal) */}
            <div className="p-3.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/80 to-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-600 text-white">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">
                    Control Interno de Ganancias (Privado)
                  </h4>
                  <p className="text-[11px] text-indigo-700">
                    Costo total de inversión:{' '}
                    <strong>
                      ${calculatedTotalCost.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </strong>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Ganancia Neta Estimada:
                </span>
                <span className="font-mono text-sm font-black text-emerald-700 block">
                  +${calculatedTotalProfit.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  <span className="text-xs font-bold text-indigo-800 ml-1">
                    (+{averageMarkupPercent}%)
                  </span>
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observaciones y Notas del Pedido
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Comentarios sobre entrega, número de orden de compra del cliente, etc."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Términos, Condiciones y Garantía
              </label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Políticas de pago, garantías y devoluciones..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-indigo-600 focus:outline-none"
              />
            </div>

            {/* Total In Words Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Importe con letra (Cálculo automático)
              </span>
              <p className="font-bold text-xs text-slate-800 leading-snug">
                {totalInWords}
              </p>
            </div>
          </div>

          {/* Totals Breakdown (Right) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal (Precio de Venta):</span>
                <span className="font-mono font-semibold text-slate-900 text-sm">
                  ${calculatedSubtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Tax Rate Selector */}
              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Impuesto IVA:</span>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className="rounded border border-slate-300 px-1.5 py-0.5 text-xs font-bold bg-white text-slate-800"
                  >
                    <option value="0.16">16% (General)</option>
                    <option value="0.08">8% (Frontera)</option>
                    <option value="0">0% (Tasa Cero)</option>
                    <option value="0">Exento</option>
                  </select>
                </div>
                <span className="font-mono font-semibold text-slate-900">
                  ${calculatedTaxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Retentions (RESICO or IVA retention) */}
              <div className="flex justify-between items-center text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Retenciones:</span>
                  <select
                    value={retentionRate}
                    onChange={(e) => setRetentionRate(parseFloat(e.target.value))}
                    className="rounded border border-slate-300 px-1.5 py-0.5 text-xs font-bold bg-white text-slate-800"
                  >
                    <option value="0">Sin retención</option>
                    <option value="0.0125">RESICO (1.25%)</option>
                    <option value="0.1066">Ret. IVA (10.66%)</option>
                    <option value="0.04">Ret. Fletes (4%)</option>
                  </select>
                </div>
                <span className="font-mono font-semibold text-amber-800">
                  {calculatedRetentionAmount > 0
                    ? `-$${calculatedRetentionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    : '$0.00'}
                </span>
              </div>

              {/* Total General */}
              <div className="pt-3 border-t border-slate-300 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 uppercase block">
                    Total General
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">{currency}</span>
                </div>
                <span className="font-mono text-xl font-black text-indigo-900">
                  ${calculatedTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons: Preview, Direct PDF Downloads & Save */}
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewDocument(buildCurrentDocument())}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-750 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Ver cómo lucirá el comprobante antes de emitir o imprimir"
                >
                  <Eye className="h-4 w-4 text-indigo-600" />
                  <span>Previsualizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf('cliente')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Descargar PDF limpio para enviar al cliente"
                >
                  <Download className="h-4 w-4" />
                  <span>PDF Cliente</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPdf('interno')}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm cursor-pointer"
                  title="Descargar PDF interno con costos, % de aumento y utilidades"
                >
                  <Download className="h-4 w-4 text-amber-400" />
                  <span>PDF Interno</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('borrador')}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span>Guardar Borrador</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSave('emitida')}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>Emitir y Guardar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
