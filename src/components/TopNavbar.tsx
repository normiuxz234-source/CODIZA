import React from 'react';
import {
  Menu,
  PlusCircle,
  Sparkles,
  FileText,
  History,
  Users,
  Settings,
  ShieldCheck,
  Cloud,
  ChevronRight,
} from 'lucide-react';
import { AppSection } from './Sidebar';

interface TopNavbarProps {
  currentSection: AppSection;
  onOpenMobileMenu: () => void;
  onNewDocument: () => void;
  onOpenScanner: () => void;
  documentCount: number;
  clientCount: number;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentSection,
  onOpenMobileMenu,
  onNewDocument,
  onOpenScanner,
  documentCount,
  clientCount,
}) => {
  const getSectionInfo = () => {
    switch (currentSection) {
      case 'editor':
        return {
          title: 'Emitir Comprobante',
          subtitle: 'Crea facturas, notas de remisión o notas de venta con cálculo automático',
          icon: PlusCircle,
        };
      case 'history':
        return {
          title: 'Historial y Folios',
          subtitle: `${documentCount} comprobante${documentCount === 1 ? '' : 's'} emitido${documentCount === 1 ? '' : 's'} • Descarga PDF para cliente o PDF interno`,
          icon: History,
        };
      case 'clients':
        return {
          title: 'Directorio de Clientes',
          subtitle: `${clientCount} cliente${clientCount === 1 ? '' : 's'} en catálogo fiscal`,
          icon: Users,
        };
      case 'settings':
        return {
          title: 'Configuración & Casillas PDF',
          subtitle: 'Personaliza los datos de tu empresa, cuentas bancarias y datos visibles en PDF',
          icon: Settings,
        };
      case 'users':
        return {
          title: 'Usuarios & Accesos Gmail',
          subtitle: 'Administra los usuarios autorizados para operar el sistema y sus niveles de acceso',
          icon: ShieldCheck,
        };
      default:
        return {
          title: 'FacturaYa',
          subtitle: 'Sistema de Facturación y Remisiones',
          icon: FileText,
        };
    }
  };

  const info = getSectionInfo();
  const Icon = info.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Hamburger & Section Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            title="Abrir menú de secciones"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {info.title}
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate">
                {info.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/60 cursor-pointer shadow-2xs"
            title="Escanear ticket o nota con Inteligencia Artificial"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span className="hidden xs:inline">Escáner IA</span>
          </button>

          {currentSection !== 'editor' && (
            <button
              onClick={onNewDocument}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs shadow-indigo-600/20 cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Nuevo Comprobante</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
