import React, { useState, useRef } from 'react';
import {
  Building2,
  Upload,
  Trash2,
  Save,
  X,
  CreditCard,
  FileCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  MessageCircle,
  Hash,
  CheckCircle2,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CompanySettings, PdfCustomizationOptions } from '../types';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CompanySettings;
  onSave: (updated: CompanySettings) => Promise<void>;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<'empresa' | 'banco' | 'folios' | 'leyendas' | 'pdf'>('empresa');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  const handlePdfOptionSetAll = (val: boolean) => {
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
      const reader = new FileReader();
      reader.onload = () => {
        handleChange('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        updatedAt: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Ajustes del Negocio / Empresa</h2>
              <p className="text-xs text-slate-400">
                Memoria persistente: estos datos se plasman automáticamente en tus facturas, notas y remisiones
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

        <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-2 overflow-x-auto">
          {[
            { id: 'empresa', label: 'Datos Fiscales y Contacto', icon: Building2 },
            { id: 'banco', label: 'Cuentas Bancarias / SPEI', icon: CreditCard },
            { id: 'folios', label: 'Series y Folios Consecutivos', icon: Hash },
            { id: 'leyendas', label: 'Términos y Leyendas', icon: FileCheck },
            { id: 'pdf', label: 'Casillas para PDF (Activar/Desactivar)', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {savedSuccess && (
            <div className="flex items-center space-x-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="font-semibold">
                ¡Ajustes de la empresa guardados correctamente en Firestore!
              </p>
            </div>
          )}

          {activeTab === 'empresa' && (
            <div className="space-y-6">
              {/* Logo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="relative flex h-24 w-40 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white overflow-hidden shadow-sm">
                  {formData.logoUrl ? (
                    <img
                      src={formData.logoUrl}
                      alt="Logo corporativo"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-2 text-slate-400 text-xs">
                      <Building2 className="h-6 w-6 mx-auto mb-1 text-slate-300" />
                      Sin Logotipo
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h4 className="text-sm font-bold text-slate-800">Logotipo Corporativo</h4>
                  <p className="text-xs text-slate-500">
                    Aparecerá en el encabezado oficial de todas tus facturas, notas y remisiones impresas o descargadas.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-200 cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Subir Logo (PNG/JPG)
                    </button>
                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={() => handleChange('logoUrl', '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold border border-red-200 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social / Nombre Legal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Ej. COMERCIALIZADORA DEL VALLE S.A. DE C.V."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre Comercial / Marca
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => handleChange('tradeName', e.target.value)}
                    placeholder="Ej. DISTRIBUIDORA VALLE"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RFC / Identificador Fiscal (CIF/RUT/NIF) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.taxId}
                    onChange={(e) => handleChange('taxId', e.target.value)}
                    placeholder="Ej. CVA180420H51"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Régimen Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.taxRegime}
                    onChange={(e) => handleChange('taxRegime', e.target.value)}
                    placeholder="Ej. 601 - General de Ley Personas Morales"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Domicilio Fiscal */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-indigo-600" />
                  Domicilio Fiscal y Ubicación
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Calle
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => handleChange('street', e.target.value)}
                      placeholder="Calle o Avenida"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        No. Exterior
                      </label>
                      <input
                        type="text"
                        value={formData.exteriorNumber}
                        onChange={(e) => handleChange('exteriorNumber', e.target.value)}
                        placeholder="123"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        No. Interior
                      </label>
                      <input
                        type="text"
                        value={formData.interiorNumber}
                        onChange={(e) => handleChange('interiorNumber', e.target.value)}
                        placeholder="Piso 2"
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Colonia
                    </label>
                    <input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) => handleChange('neighborhood', e.target.value)}
                      placeholder="Colonia"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ciudad / Municipio
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Ciudad"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      placeholder="Estado"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Código Postal
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleChange('postalCode', e.target.value)}
                      placeholder="C.P."
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Canales de Contacto */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-indigo-600" />
                  Canales de Contacto y Atención
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Teléfono Fijo / Principal
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="(55) 1234-5678"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      WhatsApp de Ventas
                    </label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      placeholder="5512345678"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="ventas@negocio.com"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Sitio Web
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="www.tunegocio.com"
                      className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'banco' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5 text-amber-950">
                  <CreditCard className="h-4 w-4 text-amber-700" />
                  Instrucciones de Pago y Transferencias SPEI
                </p>
                <p className="text-amber-800 mt-1">
                  Estos datos se imprimirán en el pie de página de tus comprobantes para que tus clientes puedan realizar pagos y transferencias bancarias de inmediato.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Institución Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="Ej. BBVA, Santander, Banorte, CitiBanamex"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nombre del Titular de la Cuenta
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountHolder}
                    onChange={(e) => handleChange('bankAccountHolder', e.target.value)}
                    placeholder="Nombre completo o Razón Social"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs uppercase focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Cuenta Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleChange('bankAccountNumber', e.target.value)}
                    placeholder="10 dígitos"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CLABE Interbancaria (SPEI)
                  </label>
                  <input
                    type="text"
                    value={formData.bankClabe}
                    onChange={(e) => handleChange('bankClabe', e.target.value)}
                    placeholder="18 dígitos para transferencias interbancarias"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-bold focus:border-indigo-600 focus:outline-none tracking-wider text-indigo-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Pago Adicionales
                </label>
                <textarea
                  rows={2}
                  value={formData.bankNotes}
                  onChange={(e) => handleChange('bankNotes', e.target.value)}
                  placeholder="Ej. Favor de referenciar su pago con el número de folio y enviar comprobante a pagos@..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'folios' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Define prefijos y números consecutivos independientes por cada tipo de documento para mantener una numeración ordenada y profesional.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Facturas */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-slate-800" />
                    <h4 className="font-bold text-sm text-slate-900">Facturas</h4>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Prefijo de Serie
                    </label>
                    <input
                      type="text"
                      value={formData.invoicePrefix}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value)}
                      placeholder="FACT-"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Siguiente Consecutivo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.invoiceNextNumber}
                      onChange={(e) =>
                        handleChange('invoiceNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                  <div className="p-2 rounded bg-white border border-slate-200 text-center font-mono text-xs font-bold text-slate-700">
                    Vista previa: {formData.invoicePrefix}
                    {formData.invoiceNextNumber}
                  </div>
                </div>

                {/* Notas de Remisión */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-emerald-600" />
                    <h4 className="font-bold text-sm text-emerald-950">Notas de Remisión</h4>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Prefijo de Serie
                    </label>
                    <input
                      type="text"
                      value={formData.remisionPrefix}
                      onChange={(e) => handleChange('remisionPrefix', e.target.value)}
                      placeholder="REM-"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                      Siguiente Consecutivo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.remisionNextNumber}
                      onChange={(e) =>
                        handleChange('remisionNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white"
                    />
                  </div>
                  <div className="p-2 rounded bg-white border border-emerald-200 text-center font-mono text-xs font-bold text-emerald-800">
                    Vista previa: {formData.remisionPrefix}
                    {formData.remisionNextNumber}
                  </div>
                </div>

                {/* Notas de Venta */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    <h4 className="font-bold text-sm text-indigo-950">Notas de Venta</h4>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      Prefijo de Serie
                    </label>
                    <input
                      type="text"
                      value={formData.saleNotePrefix}
                      onChange={(e) => handleChange('saleNotePrefix', e.target.value)}
                      placeholder="NOT-"
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                      Siguiente Consecutivo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.saleNoteNextNumber}
                      onChange={(e) =>
                        handleChange('saleNoteNextNumber', parseInt(e.target.value) || 1)
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono font-bold text-slate-800 bg-white"
                    />
                  </div>
                  <div className="p-2 rounded bg-white border border-indigo-200 text-center font-mono text-xs font-bold text-indigo-800">
                    Vista previa: {formData.saleNotePrefix}
                    {formData.saleNoteNextNumber}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leyendas' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Términos y Condiciones Predeterminados
                </label>
                <textarea
                  rows={3}
                  value={formData.defaultTerms}
                  onChange={(e) => handleChange('defaultTerms', e.target.value)}
                  placeholder="Políticas de pago, interés moratorio, validez de cotizaciones..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Políticas de Garantía Predeterminadas
                </label>
                <textarea
                  rows={3}
                  value={formData.defaultWarranty}
                  onChange={(e) => handleChange('defaultWarranty', e.target.value)}
                  placeholder="Garantía de productos o servicios..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Leyenda de Entrega y Recepción (para Remisiones)
                </label>
                <textarea
                  rows={3}
                  value={formData.defaultDeliveryNotice}
                  onChange={(e) => handleChange('defaultDeliveryNotice', e.target.value)}
                  placeholder="Texto que acompaña al espacio de firmas de conformidad..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-indigo-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-600 text-white">
                    <Sliders className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-indigo-950">
                      Casillas Predeterminadas para el PDF e Impresión
                    </h4>
                    <p className="text-xs text-indigo-700">
                      Configura qué datos aparecerán marcados por defecto al generar o imprimir comprobantes. Si no quieres que aparezca el RFC, teléfono o datos bancarios, desmárcalos aquí.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handlePdfOptionSetAll(true)}
                    className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-indigo-300 shadow-2xs cursor-pointer"
                  >
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Activar Todas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePdfOptionSetAll(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5 text-slate-400" />
                    <span>Desactivar Todas</span>
                  </button>
                </div>
              </div>

              {/* Casillas Groups */}
              {(() => {
                const currentPdf = formData.defaultPdfOptions || {
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

                return (
                  <div className="space-y-5">
                    {/* 1. Empresa */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        🏢 Datos de Mi Empresa (Emisor):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        {[
                          { key: 'showLogo', label: 'Logotipo (Logo)', desc: 'Muestra tu logo corporativo' },
                          { key: 'showIssuerBusinessName', label: 'Razón Social', desc: formData.businessName || 'Nombre fiscal de la empresa' },
                          { key: 'showIssuerTradeName', label: 'Nombre Comercial', desc: formData.tradeName || 'Marca comercial o de mostrador' },
                          { key: 'showIssuerTaxId', label: 'RFC Empresa', desc: formData.taxId || 'RFC / Identificador fiscal' },
                          { key: 'showIssuerAddress', label: 'Dirección Empresa', desc: 'Calle, número, colonia y C.P.' },
                          { key: 'showIssuerPhone', label: 'Teléfono Empresa', desc: formData.phone || 'Teléfono principal' },
                          { key: 'showIssuerEmail', label: 'Email Empresa', desc: formData.email || 'Correo de facturación' },
                        ].map(({ key, label, desc }) => {
                          const isChecked = currentPdf[key as keyof PdfCustomizationOptions];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-indigo-600 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked as boolean}
                                onChange={() => handlePdfOptionToggle(key as keyof PdfCustomizationOptions)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-600"
                              />
                              <div>
                                <span className="font-bold block text-xs leading-tight">{label}</span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[160px]">{desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Datos Bancarios */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        💳 Datos Bancarios y Cobro:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                        {[
                          {
                            key: 'showBankDetails',
                            label: 'Datos Bancarios para Pago (SPEI)',
                            desc: `Banco ${formData.bankName || 'General'}, CLABE ${formData.bankClabe || '012...'} y Titular`,
                          },
                        ].map(({ key, label, desc }) => {
                          const isChecked = currentPdf[key as keyof PdfCustomizationOptions];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer col-span-2 ${
                                isChecked
                                  ? 'bg-white border-amber-500 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked as boolean}
                                onChange={() => handlePdfOptionToggle(key as keyof PdfCustomizationOptions)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-0 cursor-pointer accent-amber-600"
                              />
                              <div>
                                <span className="font-bold block text-xs leading-tight">{label}</span>
                                <span className="text-[11px] text-slate-500 block">{desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Cliente */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        👤 Datos del Cliente (Receptor):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                        {[
                          { key: 'showClientName', label: 'Nombre Cliente', desc: 'Razón social del cliente' },
                          { key: 'showClientTaxId', label: 'RFC Cliente', desc: 'RFC / Identificador fiscal' },
                          { key: 'showClientAddress', label: 'Dirección Cliente', desc: 'Dirección fiscal o entrega' },
                          { key: 'showClientPhone', label: 'Teléfono Cliente', desc: 'Teléfono del receptor' },
                          { key: 'showClientEmail', label: 'Email Cliente', desc: 'Correo del receptor' },
                        ].map(({ key, label, desc }) => {
                          const isChecked = currentPdf[key as keyof PdfCustomizationOptions];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-emerald-600 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked as boolean}
                                onChange={() => handlePdfOptionToggle(key as keyof PdfCustomizationOptions)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600"
                              />
                              <div>
                                <span className="font-bold block text-xs leading-tight">{label}</span>
                                <span className="text-[11px] text-slate-500 block">{desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Folio y Logística */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        🔢 Folio, Fechas y Logística:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        {[
                          { key: 'showFolio', label: 'Número de Folio', desc: 'Folio consecutivo' },
                          { key: 'showDates', label: 'Fechas Emisión/Venc.', desc: 'Fecha y vencimiento' },
                          { key: 'showStatus', label: 'Estado de Pago', desc: 'Badge (Pagada/Emitida)' },
                          { key: 'showDeliveryDetails', label: 'Chofer y Placas', desc: 'Transporte en remisiones' },
                        ].map(({ key, label, desc }) => {
                          const isChecked = currentPdf[key as keyof PdfCustomizationOptions];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-purple-600 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked as boolean}
                                onChange={() => handlePdfOptionToggle(key as keyof PdfCustomizationOptions)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-0 cursor-pointer accent-purple-600"
                              />
                              <div>
                                <span className="font-bold block text-xs leading-tight">{label}</span>
                                <span className="text-[11px] text-slate-500 block">{desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* 5. Cierre */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        📝 Conceptos, Impuestos y Cierre:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                        {[
                          { key: 'showItemDescriptions', label: 'Descripciones Ext.', desc: 'Detalles secundarios' },
                          { key: 'showUnitPrices', label: 'Precios Unitarios', desc: 'Columna de precio unitario' },
                          { key: 'showTaxes', label: 'Desglose IVA', desc: 'Tasa e importe de IVA' },
                          { key: 'showRetentions', label: 'Retenciones', desc: 'RESICO o retención IVA' },
                          { key: 'showTotalInWords', label: 'Total en Letra', desc: 'Importe con letra' },
                          { key: 'showNotes', label: 'Observaciones', desc: 'Notas del pedido' },
                          { key: 'showTerms', label: 'Términos/Garantía', desc: 'Políticas predeterminadas' },
                          { key: 'showSignatures', label: 'Espacio Firmas', desc: 'Firma de recibido y emisión' },
                        ].map(({ key, label, desc }) => {
                          const isChecked = currentPdf[key as keyof PdfCustomizationOptions];
                          return (
                            <label
                              key={key}
                              className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-white border-sky-600 text-slate-900 shadow-2xs'
                                  : 'bg-slate-100/60 border-slate-200 text-slate-400 opacity-70'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked as boolean}
                                onChange={() => handlePdfOptionToggle(key as keyof PdfCustomizationOptions)}
                                className="h-4 w-4 mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-0 cursor-pointer accent-sky-600"
                              />
                              <div>
                                <span className="font-bold block text-xs leading-tight">{label}</span>
                                <span className="text-[11px] text-slate-500 block">{desc}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Última sincronización: {new Date(formData.updatedAt || Date.now()).toLocaleDateString()}
          </p>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando en la nube...' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
