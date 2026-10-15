import React, { useState } from 'react';
import { Users, Plus, Search, Trash2, Edit3, X, Check, Phone, Mail, MapPin, AlertTriangle } from 'lucide-react';
import { ClientRecord } from '../types';

interface ClientCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientRecord[];
  onSaveClient: (client: ClientRecord) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSelectClient?: (client: ClientRecord) => void;
}

export const ClientCatalogModal: React.FC<ClientCatalogModalProps> = ({
  isOpen,
  onClose,
  clients,
  onSaveClient,
  onDeleteClient,
  onSelectClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<ClientRecord>>({});
  const [clientToDelete, setClientToDelete] = useState<ClientRecord | null>(null);

  if (!isOpen) return null;

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.taxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartNew = () => {
    setCurrentClient({
      id: `client-${Date.now()}`,
      name: '',
      taxId: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    });
    setIsEditing(true);
  };

  const handleStartEdit = (client: ClientRecord) => {
    setCurrentClient(client);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient.name) return;

    await onSaveClient({
      id: currentClient.id || `client-${Date.now()}`,
      userId: currentClient.userId || 'local-user',
      name: currentClient.name.toUpperCase(),
      taxId: (currentClient.taxId || '').toUpperCase(),
      phone: currentClient.phone || '',
      email: currentClient.email || '',
      address: currentClient.address || '',
      notes: currentClient.notes || '',
      updatedAt: new Date().toISOString(),
    });

    setIsEditing(false);
    setCurrentClient({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 backdrop-blur-sm sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-900 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Catálogo de Clientes</h2>
              <p className="text-xs text-slate-400">
                Directorio frecuente para autocompletar facturas y remisiones en 1 toque
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {!isEditing ? (
            <>
              {/* Search and Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, RFC o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleStartNew}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo Cliente</span>
                </button>
              </div>

              {/* Client List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No se encontraron clientes registrados.
                  </div>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{client.name}</span>
                          {client.taxId && (
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
                              {client.taxId}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          {client.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {client.phone}
                            </span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {client.email}
                            </span>
                          )}
                          {client.address && (
                            <span className="flex items-center gap-1 truncate max-w-xs">
                              <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              {client.address}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {onSelectClient && (
                          <button
                            onClick={() => {
                              onSelectClient(client);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 border border-emerald-200"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Seleccionar
                          </button>
                        )}
                        <button
                          onClick={() => handleStartEdit(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* Edit / Create Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Razón Social / Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={currentClient.name || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
                    placeholder="Ej. CONSTRUCTORA METROPOLITANA S.A."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RFC / Identificador Fiscal
                  </label>
                  <input
                    type="text"
                    value={currentClient.taxId || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, taxId: e.target.value })}
                    placeholder="Ej. CME120803K89"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono uppercase focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    value={currentClient.phone || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
                    placeholder="Ej. 55 1234 5678"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={currentClient.email || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, email: e.target.value })}
                    placeholder="compras@cliente.com"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección Fiscal / Entrega
                  </label>
                  <input
                    type="text"
                    value={currentClient.address || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
                    placeholder="Calle, No., Colonia, Municipio, C.P., Estado"
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observaciones o Notas del Cliente
                  </label>
                  <textarea
                    rows={2}
                    value={currentClient.notes || ''}
                    onChange={(e) => setCurrentClient({ ...currentClient, notes: e.target.value })}
                    placeholder="Plazos de crédito, requerimientos de entrega, persona de compras..."
                    className="w-full rounded-xl border border-slate-300 p-2 text-xs focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Delete Client */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-60 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-150">
            <div className="h-12 w-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ¿Eliminar cliente?
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong className="text-slate-800 font-bold">{clientToDelete.name}</strong>{' '}
              de tu catálogo? Esta acción no se puede deshacer.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteClient(clientToDelete.id);
                  setClientToDelete(null);
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
