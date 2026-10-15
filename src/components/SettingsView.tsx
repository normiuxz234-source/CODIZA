import React, { useState, useRef } from 'react';
import {
  Building2,
  CreditCard,
  Hash,
  FileText,
  Sliders,
  CheckCircle2,
  Upload,
  Trash2,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  Save,
} from 'lucide-react';
import { CompanySettings, PdfCustomizationOptions } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  onSave: (updated: CompanySettings) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<'empresa' | 'banco' | 'folios' | 'pdf' | 'leyendas'>('empresa');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => {
      const updated: any = {
        ...prev,
        [field]: value,
      };
      if (field === 'address') {
        updated.street = value;
      }
      if (field === 'bankBeneficiary') {
        updated.bankAccountHolder = value;
      }
      if (field === 'bankAccount') {
        updated.bankAccountNumber = value;
      }
      return updated;
    });
  };

  const handlePdfOptionToggle = (key: keyof PdfCustomizationOptions) => {
    setFormData((prev) => {
      const currentOpts = prev.defaultPdfOptions || {
        mode: 'cliente',
        showLogo: true,
        showIssuerBusinessName: true,
        showIssuerTradeName: true,
        showIssuerTaxId: true,
        showIssuerAddress: true,
        showIssuerPhone: true,
        showIssuerEmail: true,
        showBankDetails: true,
        showFolio: true,
        showDates: true,
        showStatus: true,
        showClientName: true,
        showClientTaxId: true,
        showClientAddress: true,
        showClientPhone: true,
        showClientEmail: true,
        showDeliveryDetails: true,
        showItemDescriptions: true,
        showUnitPrices: true,
        showTaxes: true,
        showRetentions: true,
        showTotalInWords: true,
        showNotes: true,
        showTerms: true,
        showSignatures: true,
      };

      return {
        ...prev,
        defaultPdfOptions: {
          ...currentOpts,
          [key]: !currentOpts[key],
        },
      };
    });
  };

  const handleSetAllPdfOptions = (val: boolean) => {
    setFormData((prev) => {
      const currentOpts = prev.defaultPdfOptions || {
        mode: 'cliente',
        showLogo: true,
        showIssuerBusinessName: true,
        showIssuerTradeName: true,
        showIssuerTaxId: true,
        showIssuerAddress: true,
        showIssuerPhone: true,
        showIssuerEmail: true,
        showBankDetails: true,
        showFolio: true,
        showDates: true,
        showStatus: true,
        showClientName: true,
        showClientTaxId: true,
        showClientAddress: true,
        showClientPhone: true,
        showClientEmail: true,
        showDeliveryDetails: true,
        showItemDescriptions: true,
        showUnitPrices: true,
        showTaxes: true,
        showRetentions: true,
        showTotalInWords: true,
        showNotes: true,
        showTerms: true,
        showSignatures: true,
      };

      return {
        ...prev,
        defaultPdfOptions: {
          ...currentOpts,
          showLogo: val,
          showIssuerBusinessName: val,
          showIssuerTradeName: val,
          showIssuerTaxId: val,
          showIssuerAddress: val,
          showIssuerPhone: val,
          showIssuerEmail: val,
          showBankDetails: val,
          showFolio: val,
          showDates: val,
          showStatus: val,
          showClientName: val,
          showClientTaxId: val,
          showClientAddress: val,
          showClientPhone: val,
          showClientEmail: val,
          showDeliveryDetails: val,
          showItemDescriptions: val,
          showUnitPrices: val,
          showTaxes: val,
          showRetentions: val,
          showTotalInWords: val,
          showNotes: val,
          showTerms: val,
          showSignatures: val,
        },
      };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        handleChange('logoUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const pdfOpts = formData.defaultPdfOptions || {
    mode: 'cliente',
    showLogo: true,
    showIssuerBusinessName: true,
    showIssuerTradeName: true,
    showIssuerTaxId: true,
    showIssuerAddress: true,
    showIssuerPhone: true,
    showIssuerEmail: true,
    showBankDetails: true,
    showFolio: true,
    showDates: true,
    showStatus: true,
    showClientName: true,
    showClientTaxId: true,
    showClientAddress: true,
    showClientPhone: true,
    showClientEmail: true,
    showDeliveryDetails: true,
    showItemDescriptions: true,
    showUnitPrices: true,
    showTaxes: true,
    showRetentions: true,
    showTotalInWords: true,
    showNotes: true,
    showTerms: true,
    showSignatures: true,
  };

  const tabs = [
    { id: 'empresa' as const, label: 'Datos de la Empresa', icon: Building2 },
    { id: 'pdf' as const, label: 'Casillas para PDF', icon: Sliders },
    { id: 'banco' as const, label: 'Cuentas Bancarias', icon: CreditCard },
    { id: 'folios' as const, label: 'Folios y Prefijos', icon: Hash },
    { id: 'leyendas' as const, label: 'Leyendas & Términos', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Configuración de Empresa & PDF
            </h1>
            <p className="text-xs text-slate-500">
              Personaliza los datos del emisor, cuentas bancarias y casillas visibles en los comprobantes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
              ¡Cambios guardados con éxito!
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.id === 'pdf' && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold ml-1">
                    Casillas
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* TAB 1: DATOS DE LA EMPRESA */}
          {activeTab === 'empresa' && (
            <div className="space-y-6 max-w-4xl">
              {/* Logo Upload Section */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center gap-5">
                <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-xs font-bold text-slate-800">Logotipo de la Empresa</h4>
                  <p className="text-[11px] text-slate-500">
                    Aparecerá en el encabezado de tus facturas, remisiones y notas de venta en PDF.
                  </p>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{formData.logoUrl ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('logoUrl', '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social (Nombre Fiscal) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value.toUpperCase())}
                    placeholder="Ej. COMERCIALIZADORA DEL VALLE S.A. DE C.V."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Comercial (Marca)
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName || ''}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    placeholder="Ej. COMERCIAL VALLE"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RFC del Emisor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value.toUpperCase())}
                    placeholder="Ej. CVA980101XYZ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Ej. 55 9876 5432"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contacto@miempresa.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sitio Web</label>
                  <input
                    type="text"
                    value={formData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="www.miempresa.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Fiscal Completa
                </label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Calle, número exterior/interior, colonia, C.P., ciudad y estado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CASILLAS PARA ACTIVAR/DESACTIVAR DATOS EN EL PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-6 max-w-4xl">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                      Casillas Predeterminadas para el PDF
                    </h3>
                  </div>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">
                    Marca o desmarca las casillas para definir qué datos deben aparecer en los documentos PDF e impresiones.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAllPdfOptions(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>Marcar Todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetAllPdfOptions(false)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Desmarcar Todos</span>
                  </button>
                </div>
              </div>

              {/* Group 1: Datos de Tu Empresa (Emisor) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600" />
                  <span>Datos de Tu Empresa (Emisor)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'showLogo' as const, label: 'Logotipo de la empresa' },
                    { key: 'showIssuerBusinessName' as const, label: 'Razón Social de la empresa' },
                    { key: 'showIssuerTradeName' as const, label: 'Nombre Comercial / Marca' },
                    { key: 'showIssuerTaxId' as const, label: 'RFC de tu empresa' },
                    { key: 'showIssuerAddress' as const, label: 'Dirección de tu empresa' },
                    { key: 'showIssuerPhone' as const, label: 'Teléfono de tu empresa' },
                    { key: 'showIssuerEmail' as const, label: 'Correo de tu empresa' },
                    { key: 'showBankDetails' as const, label: 'Datos bancarios (SPEI / CLABE)' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        pdfOpts[item.key]
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!pdfOpts[item.key]}
                        onChange={() => handlePdfOptionToggle(item.key)}
                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 2: Datos del Cliente */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-indigo-600" />
                  <span>Datos del Cliente / Receptor</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'showClientName' as const, label: 'Nombre / Razón Social del cliente' },
                    { key: 'showClientTaxId' as const, label: 'RFC del cliente' },
                    { key: 'showClientAddress' as const, label: 'Dirección del cliente' },
                    { key: 'showClientPhone' as const, label: 'Teléfono del cliente' },
                    { key: 'showClientEmail' as const, label: 'Correo del cliente' },
                    { key: 'showDeliveryDetails' as const, label: 'Datos de chofer y entrega (Remisión)' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        pdfOpts[item.key]
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!pdfOpts[item.key]}
                        onChange={() => handlePdfOptionToggle(item.key)}
                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group 3: Documento, Partidas y Cierre */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/40">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  <span>Folios, Totales y Cierre del Documento</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { key: 'showFolio' as const, label: 'Número de Folio' },
                    { key: 'showDates' as const, label: 'Fechas de emisión y vencimiento' },
                    { key: 'showStatus' as const, label: 'Sello de estado (Pagada / Pendiente)' },
                    { key: 'showItemDescriptions' as const, label: 'Descripciones de conceptos' },
                    { key: 'showUnitPrices' as const, label: 'Columna de Precio Unitario' },
                    { key: 'showTaxes' as const, label: 'Desglose de IVA' },
                    { key: 'showRetentions' as const, label: 'Desglose de Retenciones' },
                    { key: 'showTotalInWords' as const, label: 'Total en letra (Moneda)' },
                    { key: 'showNotes' as const, label: 'Observaciones / Notas adicionales' },
                    { key: 'showTerms' as const, label: 'Términos y condiciones' },
                    { key: 'showSignatures' as const, label: 'Recuadro para firmas' },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        pdfOpts[item.key]
                          ? 'bg-indigo-50/50 border-indigo-200 text-indigo-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!pdfOpts[item.key]}
                        onChange={() => handlePdfOptionToggle(item.key)}
                        className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUENTAS BANCARIAS */}
          {activeTab === 'banco' && (
            <div className="space-y-4 max-w-4xl">
              <p className="text-xs text-slate-500">
                Estos datos se imprimen en el pie de página de las facturas y notas de venta para que tus clientes te transfieran por SPEI.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institución Bancaria (Banco)
                  </label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="Ej. BBVA México, Santander, Banorte"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Beneficiario / Titular
                  </label>
                  <input
                    type="text"
                    value={formData.bankBeneficiary || ''}
                    onChange={(e) => handleChange('bankBeneficiary', e.target.value.toUpperCase())}
                    placeholder="Ej. COMERCIALIZADORA DEL VALLE S.A."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CLABE Interbancaria (18 dígitos)
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={formData.bankClabe || ''}
                    onChange={(e) => handleChange('bankClabe', e.target.value)}
                    placeholder="012180001234567890"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 tracking-wider"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Cuenta Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount || ''}
                    onChange={(e) => handleChange('bankAccount', e.target.value)}
                    placeholder="Ej. 0123456789"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FOLIOS Y PREFIJOS */}
          {activeTab === 'folios' && (
            <div className="space-y-4 max-w-4xl">
              <p className="text-xs text-slate-500">
                Configura el prefijo y el número consecutivo siguiente para cada tipo de comprobante. El número se incrementa automáticamente cada vez que emites uno nuevo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Factura */}
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                    Facturas
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prefijo
                    </label>
                    <input
                      type="text"
                      value={formData.invoicePrefix || ''}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="FACT-"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Siguiente Folio
                    </label>
                    <input
                      type="number"
                      value={formData.invoiceNextNumber ?? 101}
                      onChange={(e) =>
                        handleChange('invoiceNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Remisión */}
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    Remisiones
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prefijo
                    </label>
                    <input
                      type="text"
                      value={formData.remisionPrefix || ''}
                      onChange={(e) => handleChange('remisionPrefix', e.target.value.toUpperCase())}
                      placeholder="REM-"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Siguiente Folio
                    </label>
                    <input
                      type="number"
                      value={formData.remisionNextNumber ?? 301}
                      onChange={(e) =>
                        handleChange('remisionNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Nota de Venta */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Notas de Venta
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prefijo
                    </label>
                    <input
                      type="text"
                      value={formData.saleNotePrefix || ''}
                      onChange={(e) => handleChange('saleNotePrefix', e.target.value.toUpperCase())}
                      placeholder="NOT-"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Siguiente Folio
                    </label>
                    <input
                      type="number"
                      value={formData.saleNoteNextNumber ?? 501}
                      onChange={(e) =>
                        handleChange('saleNoteNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEYENDAS Y TÉRMINOS */}
          {activeTab === 'leyendas' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones Predeterminadas
                </label>
                <textarea
                  rows={3}
                  value={formData.defaultNotes || ''}
                  onChange={(e) => handleChange('defaultNotes', e.target.value)}
                  placeholder="Texto que aparecerá por defecto en las notas u observaciones de nuevos comprobantes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Términos, Condiciones y Políticas de Garantía
                </label>
                <textarea
                  rows={4}
                  value={formData.defaultTerms || ''}
                  onChange={(e) => handleChange('defaultTerms', e.target.value)}
                  placeholder="Ej. Precios sujetos a cambio sin previo aviso. Mercancía viaja por cuenta y riesgo del comprador. Garantía de 30 días con comprobante original..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Bottom Save Action */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Los cambios se aplicarán inmediatamente a los nuevos comprobantes emitidos.
            </p>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Configuración'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
