import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  ShieldAlert,
  Clock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Lock,
  Mail,
  AlertTriangle,
  UserX,
  Crown,
} from 'lucide-react';
import { SUPER_ADMIN_EMAIL, UserProfile, UserStatus } from '../types';

interface UnauthorizedAccessScreenProps {
  user: User;
  userProfile?: UserProfile | null;
  status: UserStatus;
  onSignOut: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
}

export const UnauthorizedAccessScreen: React.FC<UnauthorizedAccessScreenProps> = ({
  user,
  userProfile,
  status,
  onSignOut,
  onRefreshStatus,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  const handleManualCheck = async () => {
    try {
      setIsRefreshing(true);
      setRefreshMessage(null);
      await onRefreshStatus();
      setRefreshMessage('Estado verificado. Si fuiste autorizado, la pantalla se actualizará automáticamente.');
    } catch (err) {
      console.error('Error refreshing status:', err);
      setRefreshMessage('Error al verificar el estado. Inténtalo de nuevo en unos segundos.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const isPending = status === 'pendiente';
  const isInactive = status === 'inactivo';

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl z-10 space-y-6">
        {/* Card Box */}
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          {/* Header Icon & Title */}
          <div className="text-center space-y-3">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl border mx-auto shadow-lg ${
                isPending
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-amber-500/10'
                  : 'bg-red-500/15 border-red-500/30 text-red-400 shadow-red-500/10'
              }`}
            >
              {isPending ? (
                <Clock className="h-8 w-8 animate-pulse" />
              ) : (
                <ShieldAlert className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-1">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPending
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                {isPending ? 'Pendiente de Autorización' : 'Acceso Restringido'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {isPending ? 'Acceso No Autorizado' : 'Cuenta Suspendida'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                {isPending
                  ? 'Tu cuenta de Google requiere aprobación previa para ingresar.'
                  : 'Tu acceso al sistema ha sido revocado temporalmente.'}
              </p>
            </div>
          </div>

          {/* User Account Info Pill */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="h-11 w-11 rounded-full border-2 border-slate-600 shrink-0 object-cover"
                />
              ) : (
                <div className="h-11 w-11 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'G'}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate">
                  {user.displayName || 'Usuario de Google'}
                </p>
                <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                  {user.email}
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                isPending
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/10 text-red-300 border-red-500/30'
              }`}
            >
              {isPending ? 'En Revisión' : 'Inactivo'}
            </span>
          </div>

          {/* Detailed Security & Instructions Box */}
          <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-2.5 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Crown className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">
                  Política de Acceso Privado con Super Usuario
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  La cuenta principal y propietaria autorizada es:{' '}
                  <span className="font-mono font-bold text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    {SUPER_ADMIN_EMAIL}
                  </span>
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-[11px] pl-6">
              Nadie más puede ingresar a la plataforma si no ha sido autorizado previamente por el super usuario desde la sección de{' '}
              <strong className="text-white">Usuarios & Accesos</strong>.
            </p>

            {isPending && (
              <div className="pl-6 pt-1 text-slate-400 text-[11px] flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>
                  Tu solicitud ya está en la bandeja del administrador con tu correo ({user.email}).
                </span>
              </div>
            )}
          </div>

          {/* Feedback message */}
          {refreshMessage && (
            <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-indigo-300 text-center animate-fade-in">
              {refreshMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleManualCheck}
              disabled={isRefreshing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing ? 'Consultando autorización...' : 'Comprobar si ya fui autorizado'}
              </span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              <span>Cerrar sesión / Cambiar de cuenta de Google</span>
            </button>
          </div>

          {/* Footer note for super admin */}
          <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500">
            ¿Eres el administrador principal? Asegúrate de iniciar sesión con{' '}
            <strong className="text-slate-400 font-medium">{SUPER_ADMIN_EMAIL}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
};
