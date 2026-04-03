import { useLocation, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-canvas-inset font-sans selection:bg-accent-emphasis/30 selection:text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-emphasis/10 rounded-full blur-[120px] pointer-events-none opacity-50 uppercase tracking-widest text-[500px] font-black text-white/[0.02] flex items-center justify-center">
        404
      </div>
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none opacity-30 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[110px] pointer-events-none opacity-30"></div>

      <div className="relative z-10 text-center px-4 max-w-2xl">
        <h1 className="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-fg-default via-fg-muted to-transparent select-none drop-shadow-2xl opacity-90 animate-in fade-in slide-in-from-bottom-24 duration-1000 ease-out">
          404
        </h1>

        <div className="bg-white/[0.02] backdrop-blur-2xl border border-border-default rounded-3xl p-8 md:p-12 -mt-12 md:-mt-20 shadow-2xl shadow-black animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300 fill-mode-both">
          <h2 className="text-3xl md:text-5xl font-bold text-fg-default mb-4 tracking-tight">
            Page not found
          </h2>
          <p className="text-fg-muted text-lg md:text-xl leading-relaxed mb-6 max-w-md mx-auto">
            The requested page{" "}
            <span className="text-accent-fg font-mono uppercase tracking-wider">
              {location.pathname}
            </span>{" "}
            was not found.
          </p>
          <p className="text-fg-muted text-sm md:text-base mb-10 max-w-md mx-auto">
            It may have moved, been deleted, or the URL may be incorrect.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => navigate("/", { replace: true })}
              className="relative px-10 py-4 bg-accent-emphasis text-white font-bold rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95 hover:shadow-[0_0_40px_rgba(31,111,235,0.4)] overflow-hidden"
            >
              Go Home
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="relative px-10 py-4 border border-border-default text-fg-default font-bold rounded-2xl transition-all duration-500 hover:scale-105 active:scale-95 hover:bg-white/5"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-4 text-fg-subtle text-[0.6rem] tracking-[0.3em] uppercase pointer-events-none px-6 text-center leading-relaxed font-semibold">
        <div className="w-12 h-[1px] bg-border-default/50"></div>
        Attendance API Dashboard • Error Log Ref: 0x404_SEC_INF
      </div>
    </div>
  );
}
