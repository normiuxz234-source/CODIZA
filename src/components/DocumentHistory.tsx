import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Download,
  Share2,
  Copy,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
  FileText,
  Truck,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Calendar,
  Edit,
} from 'lucide-react';
import { DocumentRecord, DocumentType, DocumentStatus, CompanySettings } from '../types';

interface DocumentHistoryProps {
  documents: DocumentRecord[];
  companySettings: CompanySettings;
  onViewDocument: (doc: DocumentRecord) => void;
  onEditDocument: (doc: DocumentRecord) => void;
  onDuplicateDocument: (doc: DocumentRecord) => void;
  onUpdateStatus: (id: string, status: DocumentStatus) => void;
  onDeleteDocument: (id: string) => void;
}

export const DocumentHistory: React.FC<DocumentHistoryProps> = ({
  documents,
  companySettings,
  onViewDocument,
  onEditDocument,
  onDuplicateDocument,
  onUpdateStatus,
  onDeleteDocument,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | DocumentType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [docToDelete, setDocToDelete] = useState<DocumentRecord | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Filter logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const filteredDocuments = documents.filter((doc) => {
    // Search query matches folio, client name, tax ID, or item names
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      doc.folio.toLowerCase().includes(query) ||
      doc.clientName.toLowerCase().includes(query) ||
      doc.clientTaxId.toLowerCase().includes(query) ||
      doc.items.some((it) => it.name.toLowerCase().includes(query) || it.description.toLowerCase().includes(query));

    // Type filter
    const matchesType = typeFilter === 'all' || doc.docType === typeFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

    // Date filter
    let matchesDate = true;
    if (dateFilter === 'today') {
      matchesDate = doc.issueDate === todayStr;
    } else if (dateFilter === 'week') {
      matchesDate = doc.issueDate >= oneWeekAgo;
    } else if (dateFilter === 'month') {
      matchesDate = doc.issueDate >= firstDayOfMonth;
    }

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // KPI Statistics
  const totalAmount = documents.reduce((acc, d) => (d.status !== 'cancelada' ? acc + d.total : acc), 0);
  const totalPaid = documents
    .filter((d) => d.status === 'pagada')
    .reduce((acc, d) => acc + d.total, 0);
  const totalPending = documents
    .filter((d) => d.status === 'pendiente' || d.status === 'emitida')
    .reduce((acc, d) => acc + d.total, 0);

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'factura':
        return { label: 'Factura', bg: 'bg-indigo-100 text-indigo-800', icon: FileText };
      case 'remision':
        return { label: 'Remisión', bg: 'bg-emerald-100 text-emerald-800', icon: Truck };
      case 'nota_venta':
        return { label: 'Nota Venta', bg: 'bg-slate-100 text-slate-800', icon: ShoppingBag };
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'pagada':
        return { label: 'Pagada', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'pendiente':
        return { label: 'Pendiente', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'emitida':
        return { label: 'Emitida', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'borrador':
        return { label: 'Borrador', bg: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'cancelada':
        return { label: 'Cancelada', bg: 'bg-red-50 text-red-700 border-red-200' };
    }
  };

  const handleShareWhatsApp = (doc: DocumentRecord) => {
    const phone = (doc.clientPhone || '').replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hola ${doc.clientName}, le compartimos el resumen de su ${doc.docType.toUpperCase()} con folio *${doc.folio}*:\n\n` +
        `• Total: *$${doc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${doc.currency}*\n` +
        `• Fecha: ${doc.issueDate}\n` +
        (companySettings.bankClabe ? `• CLABE de pago (${companySettings.bankName}): *${companySettings.bankClabe}*\n\n` : '\n') +
        `¡Muchas gracias por su preferencia!`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facturado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Facturado</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900">
            ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {documents.length} documentos emitidos
          </span>
        </div>

        {/* Total Cobrado / Liquidado */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Cobrado / Liquidado</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-emerald-700">
            ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {documents.filter((d) => d.status === 'pagada').length} pagados
          </span>
        </div>

        {/* Pendiente de Cobro */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pendiente de Cobro</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-amber-700">
            ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
            {documents.filter((d) => d.status === 'pendiente' || d.status === 'emitida').length} por cobrar
          </span>
        </div>

        {/* Total Remisiones */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Notas de Remisión</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black font-mono text-slate-900">
            {documents.filter((d) => d.docType === 'remision').length}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Entregas y traslados
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Instant Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por folio, cliente, RFC o producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
            />
          </div>

          {/* Quick Type Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'factura', label: 'Facturas' },
              { id: 'remision', label: 'Remisiones' },
              { id: 'nota_venta', label: 'Notas Venta' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  typeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filters: Status & Date */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-semibold">Estatus:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'pagada', label: 'Pagada' },
              { id: 'pendiente', label: 'Pendiente' },
              { id: 'emitida', label: 'Emitida' },
              { id: 'borrador', label: 'Borrador' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  statusFilter === st.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold">Fecha:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium bg-white text-slate-700"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Últimos 7 días</option>
              <option value="month">Este mes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tipo & Folio</th>
                <th className="py-3 px-4">Cliente / Receptor</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Partidas</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-3 text-center">Estatus</th>
                <th className="py-3 px-4 text-right">Acciones Directas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No se encontraron documentos con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const typeBadge = getDocTypeBadge(doc.docType);
                  const statusBadge = getStatusBadge(doc.status);
                  const TypeIcon = typeBadge.icon;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Type and Folio */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${typeBadge.bg}`}
                          >
                            <TypeIcon className="h-3 w-3" />
                            {typeBadge.label}
                          </span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {doc.folio}
                          </span>
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-900 block truncate">
                          {doc.clientName}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500">
                          {doc.clientTaxId || 'RFC General'}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {doc.issueDate}
                      </td>

                      {/* Items summary */}
                      <td className="py-3 px-3 text-slate-500">
                        <span className="font-semibold text-slate-700">{doc.items.length}</span> conceptos
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                        ${doc.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            // Cycle through statuses easily
                            const nextStatus: DocumentStatus =
                              doc.status === 'emitida'
                                ? 'pagada'
                                : doc.status === 'pagada'
                                ? 'pendiente'
                                : 'emitida';
                            onUpdateStatus(doc.id, nextStatus);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${statusBadge.bg}`}
                          title="Clic para cambiar estatus de pago"
                        >
                          {statusBadge.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview & Print */}
                          <button
                            onClick={() => onViewDocument(doc)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Ver e Imprimir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(doc)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Compartir por WhatsApp"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => onEditDocument(doc)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Editar en el formulario"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Duplicate */}
                          <button
                            onClick={() => onDuplicateDocument(doc)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            title="Duplicar documento"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {filteredDocuments.length} de {documents.length} comprobantes</span>
          <span className="font-semibold">FacturaYa Cloud Archive</span>
        </div>
      </div>

      {/* Confirmation Modal to Delete Document */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ¿Eliminar comprobante {docToDelete.folio}?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar este comprobante emitido a{' '}
              <strong className="text-slate-800 font-bold">{docToDelete.clientName}</strong> por un total de{' '}
              <strong className="text-slate-800 font-bold">${docToDelete.total.toFixed(2)}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDocument(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Sí, Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
