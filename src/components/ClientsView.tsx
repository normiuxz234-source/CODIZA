import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Check,
  Phone,
  Mail,
  MapPin,
  FilePlus,
  Building,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { ClientRecord } from '../types';

interface ClientsViewProps {
  clients: ClientRecord[];
  onSaveClient: (client: ClientRecord) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSelectClientForDoc: (client: ClientRecord) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  onSelectClientForDoc,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<ClientRecord>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNew = () => {
    setCurrentClient({
      id: `client-${Date.now()}`,
      name: '',
      taxId: 'XAXX010101000',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setIsEditing(true);
  };

  const handleStartEdit = (client: ClientRecord) => {
    setCurrentClient({ ...client });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient.name?.trim()) return;

    setIsSaving(true);
    try {
      await onSaveClient({
        id: currentClient.id || `client-${Date.now()}`,
        userId: currentClient.userId || 'local-user',
        name: currentClient.name.trim().toUpperCase(),
        taxId: (currentClient.taxId || 'XAXX010101000').trim().toUpperCase(),
        phone: currentClient.phone || '',
        email: currentClient.email || '',
        address: currentClient.address || '',
        notes: currentClient.notes || '',
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      setCurrentClient({});
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteClient(clientToDelete.id);
      setClientToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Directorio de Clientes
              </h1>
              <p className="text-xs text-slate-500">
                Administra tus clientes y sus datos fiscales para facturar en un solo clic
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl shadow-xs border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Nombre, Razón Social, RFC o Teléfono..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 px-2 flex items-center gap-2">
          <span>{filteredClients.length} clientes encontrados</span>
          <span className="text-slate-300">•</span>
          <span className="text-indigo-600 font-bold">{clients.length} total registrados</span>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <div className="h-14 w-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No se encontraron clientes</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm
              ? 'No hay clientes que coincidan con la búsqueda ingresada.'
              : 'Aún no tienes clientes registrados en tu catálogo.'}
          </p>
          <button
            onClick={handleStartNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Primer Cliente</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate group-hover:text-indigo-600 transition-colors">
                      {client.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        RFC: {client.taxId || 'XAXX010101000'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(client)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar cliente"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-600 my-3">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 text-[11px] leading-tight text-slate-500">
                        {client.address}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 mt-2">
                <button
                  onClick={() => onSelectClientForDoc(client)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 font-bold text-xs transition-all cursor-pointer"
                >
                  <FilePlus className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Emitir Comprobante a este Cliente</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal to Delete Client */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ¿Eliminar cliente?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-slate-800 font-bold">{clientToDelete.name}</strong>{' '}
              ({clientToDelete.taxId || 'Sin RFC'}) de tu catálogo? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / New Client Modal Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <UserCheck className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">
                  {currentClient.id && clients.some((c) => c.id === currentClient.id)
                    ? 'Editar Cliente'
                    : 'Nuevo Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo o Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. DISTRIBUIDORA DEL CENTRO S.A. DE C.V."
                  value={currentClient.name || ''}
                  onChange={(e) =>
                    setCurrentClient((prev) => ({ ...prev, name: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  RFC del Cliente
                </label>
                <input
                  type="text"
                  placeholder="XAXX010101000 (o RFC con homoclave)"
                  value={currentClient.taxId || ''}
                  onChange={(e) =>
                    setCurrentClient((prev) => ({ ...prev, taxId: e.target.value.toUpperCase() }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 55 1234 5678"
                    value={currentClient.phone || ''}
                    onChange={(e) =>
                      setCurrentClient((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={currentClient.email || ''}
                    onChange={(e) =>
                      setCurrentClient((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección Fiscal / Entrega
                </label>
                <textarea
                  rows={2}
                  placeholder="Calle, número, colonia, código postal, municipio y estado..."
                  value={currentClient.address || ''}
                  onChange={(e) =>
                    setCurrentClient((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
