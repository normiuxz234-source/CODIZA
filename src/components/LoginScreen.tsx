import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Sparkles,
  TrendingUp,
  Receipt,
  Users,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react';

interface LoginScreenProps {
  onSignIn: () => Promise<void>;
  isLoading?: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSignIn, isLoading = false }) => {
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setSigningIn(true);
      setErrorMsg(null);
      await onSignIn();
    } catch (err: any) {
      console.error('Error during Google login:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('La ventana de inicio de sesión de Google se cerró antes de completar el acceso.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setErrorMsg('Ocurrió un error al autenticar con Google. Por favor, intenta de nuevo.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 antialiased selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glowing ambient elements */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        {/* Left Column: Brand & Benefits */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Sistema Privado con Acceso Restringido</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  Factura<span className="text-indigo-400">Ya</span>
                </h1>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Facturación • Remisiones • Notas de Venta
                </p>
              </div>
            </div>

            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Plataforma profesional para emisión de comprobantes fiscales y comerciales, control de costos, cálculo de utilidades y reportes en PDF vectorial.
            </p>
          </div>

          {/* Value points grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <span>Control de Ganancias</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calcula costo unitario, % de aumento y ganancia neta en modo interno confidencial.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>PDF Cliente e Interno</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Descarga directa de comprobantes con alta definición vectorial sin encimados.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Escáner IA</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Extrae partidas y conceptos desde fotos de notas o documentos escaneados.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm space-y-1">
              <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
                <Users className="h-4 w-4 text-blue-400" />
                <span>Gestión de Usuarios</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Roles y permisos de emisión por cuenta Gmail para tu equipo.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Google Login Box */}
        <div className="lg:col-span-5">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto border border-indigo-500/30">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Accede con tu cuenta autorizada de <strong className="text-slate-200">Gmail o Google Workspace</strong> para ingresar al panel de facturación.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-3">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={signingIn || isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg shadow-white/5 transition-all transform active:scale-98 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                {/* Official Google G Logo */}
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {signingIn ? 'Iniciando sesión...' : 'Continuar con Gmail / Google'}
                </span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Autenticación oficial y segura de Google</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/60 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Al iniciar sesión, tus comprobantes, clientes y configuraciones fiscales se sincronizan de manera privada con tu cuenta.
              </p>
              <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 font-mono">
                <span>Versión 2.5</span>
                <span>•</span>
                <span>Base de Datos Firestore</span>
                <span>•</span>
                <span>SSL / TLS 256-bit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
