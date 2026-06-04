import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { Wifi, WifiOff, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props { compact?: boolean; className?: string }

/**
 * Always-visible connection indicator. Use compact in headers,
 * full in admin dashboard.
 */
const ConnectionStatus = ({ compact = false, className }: Props) => {
  const { status, latency, retry } = useConnectionHealth();

  const styles = {
    online:   { c: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40", icon: Wifi, label: "Online" },
    slow:     { c: "bg-amber-500/15  text-amber-700  dark:text-amber-300  border-amber-500/40",  icon: AlertTriangle, label: "Slow Network Connection" },
    offline:  { c: "bg-rose-500/15   text-rose-700   dark:text-rose-300   border-rose-500/40",   icon: WifiOff, label: "Backend Unreachable" },
    checking: { c: "bg-muted text-muted-foreground border-border", icon: Loader2, label: "तपासत आहे..." },
  }[status];

  const Icon = styles.icon;
  return (
    <button
      type="button"
      onClick={retry}
      title={latency != null ? `${styles.label} • ${latency}ms` : styles.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
        styles.c, className
      )}
      aria-label={styles.label}
    >
      <Icon className={cn("h-3 w-3", status === "checking" && "animate-spin")} />
      {!compact && <span>{styles.label}</span>}
      {!compact && latency != null && <span className="opacity-70">· {latency}ms</span>}
    </button>
  );
};

export default ConnectionStatus;
