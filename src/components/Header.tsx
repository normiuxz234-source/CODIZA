import React from 'react';
import {
  FileText,
  History,
  Users,
  Settings,
  Sparkles,
  Cloud,
  CloudCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  PlusCircle,
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentTab: 'editor' | 'history' | 'clients';
  onSelectTab: (tab: 'editor' | 'history' | 'clients') => void;
  onOpenScanner: () => void;
  onOpenSettings: () => void;
  onOpenClients: () => void;
  onNewDocument: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isCloudSyncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenScanner,
  onOpenSettings,
  onOpenClients,
  onNewDocument,
  user,
  onSignIn,
  onSignOut,
  isCloudSyncing,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('editor')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg tracking-tight text-white">FacturaYa</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  IA + NUBE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Facturas • Remisiones • Notas de Venta
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => onSelectTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'editor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Emitir</span>
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Historial</span>
            </button>

            <button
              onClick={onOpenClients}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Clientes</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden md:inline">Ajustes</span>
            </button>
          </nav>

          {/* Right AI Scanner & User Account Sync */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Quick Scanner Action */}
            <button
              onClick={onOpenScanner}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Escáner IA</span>
            </button>

            {/* Cloud Sync Status Indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                user
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={user ? 'Autoguardado activo en Firestore' : 'Guardado local activado'}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  user ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="hidden xl:inline">{user ? 'Firestore Conectado' : 'Modo Local'}</span>
            </div>

            {/* Google Authentication */}
            {user ? (
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="h-8 w-8 rounded-full border border-slate-700"
                    title={user.email || ''}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Conectar Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
