import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ShieldCheck,
  UserPlus,
  Users,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Search,
  UserCheck,
  FileText,
  DollarSign,
  Settings,
  X,
  AlertCircle,
  Crown,
  UserX,
  BellRing,
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL, UserProfile, UserRole, UserStatus } from '../types';

interface UsersViewProps {
  currentUser: User;
  usersList: UserProfile[];
  onSaveUser: (userProfile: UserProfile) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UsersView: React.FC<UsersViewProps> = ({
  currentUser,
  usersList,
  onSaveUser,
  onDeleteUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | UserStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [copiedUid, setCopiedUid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form State for Adding / Editing an authorized user
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('facturador');
  const [formStatus, setFormStatus] = useState<UserStatus>('activo');
  const [canViewProfit, setCanViewProfit] = useState(true);
  const [canEditSettings, setCanEditSettings] = useState(false);
  const [canDeleteDocs, setCanDeleteDocs] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isSuperAdmin = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Reset or Populate Form
  const openNewUserModal = () => {
    setEditingUser(null);
    setFormEmail('');
    setFormName('');
    setFormRole('facturador');
    setFormStatus('activo');
    setCanViewProfit(true);
    setCanEditSettings(false);
    setCanDeleteDocs(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditUserModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormEmail(u.email);
    setFormName(u.displayName);
    setFormRole(u.role);
    setFormStatus(u.status);
    setCanViewProfit(u.canViewProfit);
    setCanEditSettings(u.canEditSettings);
    setCanDeleteDocs(u.canDeleteDocs);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleRolePresetChange = (newRole: UserRole) => {
    setFormRole(newRole);
    if (newRole === 'admin') {
      setCanViewProfit(true);
      setCanEditSettings(true);
      setCanDeleteDocs(true);
    } else if (newRole === 'facturador') {
      setCanViewProfit(true);
      setCanEditSettings(false);
      setCanDeleteDocs(false);
    } else if (newRole === 'auditor') {
      setCanViewProfit(false);
      setCanEditSettings(false);
      setCanDeleteDocs(false);
    }
  };

  const handleApprovePending = async (u: UserProfile, role: UserRole = 'facturador') => {
    try {
      const updated: UserProfile = {
        ...u,
        status: 'activo',
        role,
        canViewProfit: true,
        canEditSettings: role === 'admin',
        canDeleteDocs: role === 'admin',
        updatedAt: new Date().toISOString(),
      };
      await onSaveUser(updated);
      showNotification(`Acceso autorizado para ${u.email}. Ya puede ingresar al sistema.`);
    } catch (err) {
      console.error('Error approving user:', err);
    }
  };

  const handleRejectOrDelete = async (u: UserProfile) => {
    if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('La cuenta principal del Super Administrador no puede ser eliminada.');
      return;
    }
    const isPending = u.status === 'pendiente';
    const msg = isPending
      ? `¿Rechazar y descartar la solicitud de ${u.email}?`
      : `¿Seguro que deseas eliminar el usuario y revocar el acceso a ${u.email}?`;
    if (window.confirm(msg)) {
      try {
        await onDeleteUser(u.id);
        showNotification(`Registro de ${u.email} eliminado exitosamente.`);
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleToggleStatus = async (u: UserProfile) => {
    if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('La cuenta principal del Super Administrador siempre debe permanecer activa.');
      return;
    }
    const newStatus: UserStatus = u.status === 'activo' ? 'inactivo' : 'activo';
    try {
      const updated: UserProfile = {
        ...u,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      await onSaveUser(updated);
      showNotification(
        newStatus === 'activo'
          ? `Acceso reactivado para ${u.email}.`
          : `Acceso suspendido para ${u.email}.`
      );
    } catch (err) {
      console.error('Error toggling user status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      setFormError('Por favor ingresa un correo de Gmail válido.');
      return;
    }

    if (!formEmail.includes('@') || !formEmail.includes('.')) {
      setFormError('El correo ingresado no tiene un formato válido.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const now = new Date().toISOString();
      const isThisSuperAdmin = formEmail.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

      const profileToSave: UserProfile = {
        id: editingUser
          ? editingUser.id
          : `user-${formEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        userId: editingUser ? editingUser.userId : `auth-${Date.now()}`,
        email: formEmail.trim().toLowerCase(),
        displayName: formName.trim() || formEmail.split('@')[0],
        photoURL: editingUser?.photoURL || '',
        role: isThisSuperAdmin ? 'admin' : formRole,
        status: isThisSuperAdmin ? 'activo' : formStatus,
        canViewProfit: isThisSuperAdmin ? true : canViewProfit,
        canEditSettings: isThisSuperAdmin ? true : canEditSettings,
        canDeleteDocs: isThisSuperAdmin ? true : canDeleteDocs,
        addedBy: currentUser.email || 'Sistema',
        createdAt: editingUser?.createdAt || now,
        lastLoginAt: editingUser?.lastLoginAt || undefined,
        updatedAt: now,
      };

      await onSaveUser(profileToSave);
      showNotification(
        editingUser
          ? `Perfil de ${profileToSave.email} actualizado.`
          : `Cuenta ${profileToSave.email} autorizada exitosamente.`
      );
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving user profile:', err);
      setFormError('No se pudo guardar el usuario. Revisa tu conexión a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyUidToClipboard = () => {
    navigator.clipboard.writeText(currentUser.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Pending user requests
  const pendingRequests = usersList.filter((u) => u.status === 'pendiente');

  // Filter users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
    admin: {
      label: 'Administrador Total',
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    },
    facturador: {
      label: 'Emisor / Facturador',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    },
    auditor: {
      label: 'Auditor / Solo Lectura',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
    },
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-medium text-xs flex items-center gap-2.5 shadow-lg shadow-emerald-600/20 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">
                Gestión de Usuarios & Accesos
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Acceso con Autorización Previa
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control exclusivo de acceso: solo las cuentas de Gmail autorizadas por el super usuario pueden ingresar al sistema
            </p>
          </div>
        </div>

        <button
          onClick={openNewUserModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Pre-autorizar Cuenta Gmail</span>
        </button>
      </div>

      {/* Super Administrator Badge & Policy Card */}
      <div className="bg-linear-to-r from-amber-500/10 via-indigo-500/10 to-transparent p-4 rounded-2xl border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-600 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Super Administrador / Propietario Principal
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Acceso Permanente
              </span>
            </div>
            <p className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
              {SUPER_ADMIN_EMAIL}
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-600 max-w-md bg-white/70 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200/80">
          <p className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-indigo-600" />
            Control de Acceso Estricto Activado
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cualquier persona que inicie sesión con un correo de Gmail distinto será bloqueada de inmediato hasta que la autorices aquí.
          </p>
        </div>
      </div>

      {/* Outstanding Pending Access Requests (Highlighted if any) */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white animate-bounce">
                <BellRing className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <span>Solicitudes Pendientes de Aprobación</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-600 text-white">
                    {pendingRequests.length}
                  </span>
                </h3>
                <p className="text-xs text-amber-800">
                  Estos usuarios iniciaron sesión con Google y están esperando que apruebes su acceso para poder entrar a FacturaYa
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {req.photoURL ? (
                    <img
                      src={req.photoURL}
                      alt={req.displayName}
                      className="h-10 w-10 rounded-full border border-slate-200 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {req.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{req.displayName}</p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      {req.email}
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                      Intento: {new Date(req.createdAt).toLocaleDateString()} {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleApprovePending(req, 'facturador')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Autorizar acceso como Facturador"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Autorizar</span>
                  </button>

                  <button
                    onClick={() => handleRejectOrDelete(req)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Rechazar solicitud"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Logged-in User Profile Card */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'Usuario'}
                className="h-16 w-16 rounded-2xl border-2 border-indigo-400 shadow-md shrink-0 object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold border-2 border-indigo-400 shadow-md shrink-0">
                {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {currentUser.displayName || 'Usuario Autenticado'}
                </h2>
                {isSuperAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    Super Admin
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Sesión Activa
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Gmail / Google
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-indigo-400" />
                  {currentUser.email}
                </span>
                <button
                  onClick={copyUidToClipboard}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer"
                  title="Copiar UID"
                >
                  <Key className="h-3 w-3 text-slate-400" />
                  <span>UID: {currentUser.uid.slice(0, 12)}...</span>
                  {copiedUid ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick permissions indicators */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/60 text-slate-200">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Emisión Total</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/60 text-slate-200">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              <span>Costos & Ganancias</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/60 text-slate-200">
              <Settings className="h-3.5 w-3.5 text-emerald-400" />
              <span>Configuración Fiscal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Authorized Users Directory */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              <span>Cuentas y Colaboradores Registrados</span>
              <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">
                {usersList.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Solo las cuentas con estado «Activo» pueden ingresar al sistema. Las demás permanecen bloqueadas.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o gmail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600 w-48 sm:w-56"
              />
            </div>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Todos los Estados</option>
              <option value="activo">Solo Activos (Autorizados)</option>
              <option value="pendiente">Solo Pendientes</option>
              <option value="inactivo">Solo Inactivos / Suspendidos</option>
            </select>

            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:outline-none focus:border-indigo-600"
            >
              <option value="all">Todos los Roles</option>
              <option value="admin">Administrador</option>
              <option value="facturador">Facturador</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>
        </div>

        {/* Users Table / Grid */}
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-600">No se encontraron usuarios</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {searchTerm
                ? 'Intenta con otro término de búsqueda o cambia el filtro de roles/estados.'
                : 'Pre-autoriza a los colaboradores de tu empresa que requieran emitir o consultar comprobantes.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Usuario / Cuenta Gmail</th>
                  <th className="py-3 px-4">Rol Asignado</th>
                  <th className="py-3 px-4">Permisos</th>
                  <th className="py-3 px-4">Estado de Acceso</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isPrimaryOwner = u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
                  const isCurrent = u.email.toLowerCase() === (currentUser.email || '').toLowerCase();
                  const roleStyle = roleBadges[u.role] || roleBadges.facturador;

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPrimaryOwner
                          ? 'bg-amber-50/20'
                          : isCurrent
                          ? 'bg-indigo-50/30'
                          : u.status === 'pendiente'
                          ? 'bg-amber-50/40'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="h-9 w-9 rounded-xl border border-slate-200 shrink-0 object-cover"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800 truncate">
                                {u.displayName}
                              </span>
                              {isPrimaryOwner && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white flex items-center gap-0.5">
                                  <Crown className="h-2.5 w-2.5" />
                                  Super Usuario
                                </span>
                              )}
                              {isCurrent && !isPrimaryOwner && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-600 text-white">
                                  Tú
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium block truncate">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleStyle.bg} ${roleStyle.text} ${roleStyle.border}`}
                        >
                          {roleStyle.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 text-[10px]">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              u.canViewProfit
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                            title={
                              u.canViewProfit
                                ? 'Puede ver utilidades y reporte interno'
                                : 'Sin acceso a vista interna de ganancias'
                            }
                          >
                            Márgenes {u.canViewProfit ? '✓' : '✗'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              u.canEditSettings
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                            title={
                              u.canEditSettings
                                ? 'Puede modificar la configuración fiscal y empresa'
                                : 'No puede modificar la empresa'
                            }
                          >
                            Config {u.canEditSettings ? '✓' : '✗'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              u.canDeleteDocs
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                            title={
                              u.canDeleteDocs
                                ? 'Puede cancelar o borrar comprobantes'
                                : 'No puede borrar comprobantes'
                            }
                          >
                            Borrar {u.canDeleteDocs ? '✓' : '✗'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.status === 'activo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Autorizado (Activo)
                          </span>
                        )}
                        {u.status === 'pendiente' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
                            Pendiente de Autorización
                          </span>
                        )}
                        {u.status === 'inactivo' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Acceso Revocado
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Approval for Pending */}
                          {u.status === 'pendiente' && (
                            <button
                              onClick={() => handleApprovePending(u, 'facturador')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Autorizar este usuario"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Autorizar</span>
                            </button>
                          )}

                          {/* Quick Toggle Active / Inactive for authorized users */}
                          {!isPrimaryOwner && u.status !== 'pendiente' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                u.status === 'activo'
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={
                                u.status === 'activo'
                                  ? 'Suspender acceso temporalmente'
                                  : 'Reactivar acceso'
                              }
                            >
                              {u.status === 'activo' ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar permisos y rol"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Delete button (Protected for primary owner) */}
                          {!isPrimaryOwner && (
                            <button
                              onClick={() => handleRejectOrDelete(u)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title={u.status === 'pendiente' ? 'Rechazar solicitud' : 'Eliminar usuario'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingUser
                      ? 'Modificar Permisos de Usuario'
                      : 'Pre-autorizar Acceso con Cuenta Gmail'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingUser
                      ? 'Ajusta el rol y las facultades del usuario'
                      : 'Permite el acceso a un nuevo correo de Gmail antes de que inicie sesión'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Informative callout */}
              <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-indigo-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Autorización de Acceso Directo
                </p>
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Al registrar este correo de Gmail con estado <strong className="text-emerald-700">Activo (Autorizado)</strong>, la persona podrá ingresar al instante sin ser bloqueada.
                </p>
              </div>

              {/* Gmail Address */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Correo Electrónico de Gmail *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cuenta de Google</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ejemplo.colaborador@gmail.com"
                    disabled={editingUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-medium text-slate-800 disabled:bg-slate-100"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre del Colaborador</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Lic. Carlos Mendoza (Opcional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Estado de Autorización</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormStatus('activo')}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formStatus === 'activo'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Activo (Autorizado)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormStatus('inactivo')}
                    disabled={editingUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()}
                    className={`py-2 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formStatus === 'inactivo'
                        ? 'bg-red-50 border-red-500 text-red-800 shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <UserX className="h-4 w-4 text-red-600" />
                    <span>Inactivo (Bloqueado)</span>
                  </button>
                </div>
              </div>

              {/* Role Presets */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Rol del Usuario</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRolePresetChange('facturador')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formRole === 'facturador'
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800">Facturador</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Emisión y cotizaciones</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePresetChange('admin')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formRole === 'admin'
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800">Administrador</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Control y edición</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRolePresetChange('auditor')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      formRole === 'auditor'
                        ? 'border-slate-600 bg-slate-100 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-bold text-slate-800">Auditor</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Solo consulta</p>
                  </button>
                </div>
              </div>

              {/* Granular Permissions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="font-bold text-slate-700">Permisos de Acceso</p>

                <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800">Ver Costos y Márgenes de Ganancia</p>
                    <p className="text-[10px] text-slate-500">
                      Permite ver costos de compra, % de margen y generar PDF confidencial
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={canViewProfit}
                    onChange={(e) => setCanViewProfit(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800">Modificar Configuración y Datos Fiscales</p>
                    <p className="text-[10px] text-slate-500">
                      Permite cambiar razón social, cuentas bancarias, logotipo y casillas PDF
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={canEditSettings}
                    onChange={(e) => setCanEditSettings(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <p className="font-bold text-slate-800">Eliminar Comprobantes del Historial</p>
                    <p className="text-[10px] text-slate-500">
                      Permite borrar facturas o remisiones guardadas en la base de datos
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={canDeleteDocs}
                    onChange={(e) => setCanDeleteDocs(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingUser
                    ? 'Guardar Cambios'
                    : 'Autorizar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
