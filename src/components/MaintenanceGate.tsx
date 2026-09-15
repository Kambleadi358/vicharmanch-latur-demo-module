import { useEffect, useState, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/vicharmanch-stamp.png";

const ADMIN_PATHS = ["/admin", "/admin-login", "/admin-signup", "/reset-password", "/judge-login", "/judge"];

const MaintenanceGate = ({ children }: { children: ReactNode }) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("section", "system")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      if (!cancelled) setMaintenance(data?.value === true || String(data?.value) === "true");
    };
    check();
    const t = setInterval(check, 15000);
    return () => { cancelled = true; clearInterval(t); };
  }, [location.pathname]);

  const isAdminRoute = ADMIN_PATHS.some((p) => location.pathname.startsWith(p));
  if (!maintenance || isAdmin || isAdminRoute) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(220,60%,12%)] via-[hsl(217,80%,20%)] to-[hsl(220,60%,12%)] p-4">
      <div className="max-w-lg w-full bg-background rounded-2xl shadow-2xl p-8 text-center space-y-5 border">
        <img src={logo} alt="विचारमंच" className="h-24 w-24 mx-auto object-contain" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary leading-tight">
            भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर
          </h1>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-300/40 p-4">
          <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mb-2">🛑 UNDER MAINTENANCE 🛑</p>
          <p className="text-sm text-foreground leading-relaxed">
            आपल्या भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर या सिस्टममध्ये सुधारणा सुरू आहेत.
            कृपया काही वेळाने पुन्हा भेट द्या.
          </p>
        </div>
        <p className="text-xs font-medium tracking-widest text-muted-foreground">
          स्वातंत्र्य | समता | बंधुता | न्याय
        </p>
        <a
          href="/admin-login"
          className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/5 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          परीक्षक / व्यवस्थापक लॉगिन
        </a>
        <div className="flex items-center justify-center gap-2 pt-2 text-muted-foreground">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500"></span>
          </span>
          <span className="text-xs tracking-wide">देखभाल चालू आहे…</span>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceGate;
