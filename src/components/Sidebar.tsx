import React from 'react';
import {
  FileText,
  History,
  Users,
  Settings,
  Sparkles,
  PlusCircle,
  LogIn,
  LogOut,
  Building2,
  Receipt,
  FileSpreadsheet,
  X,
  CheckCircle,
  Cloud,
  ChevronRight,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { CompanySettings, SUPER_ADMIN_EMAIL } from '../types';

export type AppSection = 'editor' | 'history' | 'clients' | 'settings' | 'users';

interface SidebarProps {
  currentSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onNewDocument: () => void;
  onOpenScanner: () => void;
  documentCount: number;
  clientCount: number;
  pendingUsersCount?: number;
  companySettings: CompanySettings;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isCloudSyncing: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  onNewDocument,
  onOpenScanner,
  documentCount,
  clientCount,
  pendingUsersCount = 0,
  companySettings,
  user,
  onSignIn,
  onSignOut,
  isCloudSyncing,
  isOpenMobile,
  onCloseMobile,
}) => {
  const handleNavClick = (section: AppSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const handleNewDocClick = () => {
    onNewDocument();
    onSelectSection('editor');
    onCloseMobile();
  };

  const handleScannerClick = () => {
    onOpenScanner();
    onCloseMobile();
  };

  const isSuperAdmin = user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const navItems = [
    {
      id: 'editor' as AppSection,
      label: 'Emitir Comprobante',
      description: 'Facturas, Remisiones y Notas',
      icon: PlusCircle,
      badge: null,
    },
    {
      id: 'history' as AppSection,
      label: 'Historial y Folios',
      description: 'Descargas PDF cliente e interno',
      icon: History,
      badge: documentCount > 0 ? documentCount : null,
    },
    {
      id: 'clients' as AppSection,
      label: 'Directorio de Clientes',
      description: 'Catálogo de clientes y RFC',
      icon: Users,
      badge: clientCount > 0 ? clientCount : null,
    },
    {
      id: 'settings' as AppSection,
      label: 'Configuración & PDF',
      description: 'Datos fiscales, logo y casillas',
      icon: Settings,
      badge: null,
    },
    {
      id: 'users' as AppSection,
      label: 'Usuarios & Accesos',
      description: 'Cuentas Gmail y permisos',
      icon: ShieldCheck,
      badge: pendingUsersCount > 0 ? `${pendingUsersCount} nuevo${pendingUsersCount > 1 ? 's' : ''}` : null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand & Company Header */}
        <div className="p-4 pb-3 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('editor')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            {companySettings.logoUrl ? (
              <img
                src={companySettings.logoUrl}
                alt="Logo"
                className="h-10 w-10 object-contain rounded-xl bg-white/10 p-1 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
                <FileText className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight text-white truncate">
                  {companySettings.tradeName || 'FacturaYa'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {companySettings.businessName || 'Emisión y Gestión Rápida'}
              </p>
            </div>
          </div>

          {/* Close button on Mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 pb-2">
          <button
            onClick={handleNewDocClick}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-600/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>+ Nuevo Comprobante</span>
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Secciones Principales
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                      {item.label}
                    </p>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-indigo-100' : 'text-slate-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-indigo-700'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 group-hover:bg-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 pb-1">
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Herramientas Inteligentes
            </p>
            <button
              onClick={handleScannerClick}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left bg-gradient-to-r from-indigo-950/40 to-slate-800/40 border border-indigo-500/20 text-indigo-200 hover:border-indigo-400/40 hover:bg-indigo-900/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-indigo-100">Escáner IA</p>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 font-bold">
                      FOTO
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-300/80 truncate">
                    Escanear nota y extraer renglones
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>

        {/* Cloud Sync & User Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90">
          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-[11px]">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {user ? 'Nube Firestore Activa' : 'Almacenamiento Local'}
              </span>
            </div>
            {isCloudSyncing && (
              <span className="text-[10px] text-indigo-400 font-medium animate-pulse">
                Sincronizando...
              </span>
            )}
          </div>

          {/* User Account / Auth */}
          {user ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
              <div
                onClick={() => handleNavClick('users')}
                className="flex items-center space-x-2.5 min-w-0 cursor-pointer hover:opacity-90 flex-1 pr-2"
                title="Ver perfil y gestión de usuarios"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="h-8 w-8 rounded-full border border-slate-600 shrink-0 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-white truncate">
                      {user.displayName || 'Usuario'}
                    </p>
                    {isSuperAdmin && (
                      <span className="p-0.5 rounded bg-amber-500/20 text-amber-400" title="Super Administrador">
                        <Crown className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5 text-indigo-400" />
              <span>Conectar Cuenta de Google</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
