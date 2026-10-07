import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Bell, ShieldCheck, XCircle, AlertCircle, MinusCircle, Settings2 } from "lucide-react";
import {
  getAllPermissions, requestPermission,
  PERMISSION_LABELS_MR, type PermissionKind, type PermState,
} from "@/lib/permissions";

const ICONS: Record<PermissionKind, React.ComponentType<{ className?: string }>> = {
  camera: Camera, notifications: Bell,
};

const stateBadge = (s: PermState) => {
  switch (s) {
    case "granted":     return <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white"><ShieldCheck className="h-3 w-3 mr-1" /> मंजूर</Badge>;
    case "denied":      return <Badge className="bg-rose-500 hover:bg-rose-500 text-white"><XCircle className="h-3 w-3 mr-1" /> नाकारले</Badge>;
    case "prompt":      return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" /> विनंती करावी</Badge>;
    case "unsupported": return <Badge variant="secondary"><MinusCircle className="h-3 w-3 mr-1" /> उपलब्ध नाही</Badge>;
  }
};

const PermissionManager = () => {
  const [perms, setPerms] = useState<Awaited<ReturnType<typeof getAllPermissions>> | null>(null);
  const [busy, setBusy] = useState<PermissionKind | null>(null);

  const refresh = async () => setPerms(await getAllPermissions());
  useEffect(() => {
    void refresh();
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const onRequest = async (k: PermissionKind) => {
    setBusy(k);
    await requestPermission(k);
    await refresh();
    setBusy(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> परवानगी व्यवस्थापक
        </CardTitle>
        <CardDescription>
          कॅमेरा वापरताना आणि सूचना सुरू करताना परवानगी मागितली जाईल. मायक्रोफोनचा वापर नसल्याने त्याची परवानगी मागितली जात नाही.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {(["camera", "notifications"] as PermissionKind[]).map((k) => {
          const info = perms?.[k];
          const Icon = ICONS[k];
          return (
            <div key={k} className="flex items-center justify-between rounded-lg border p-3 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{PERMISSION_LABELS_MR[k]}</p>
                  <div className="mt-0.5">{info ? stateBadge(info.state) : <span className="text-xs text-muted-foreground">तपासत आहे...</span>}</div>
                </div>
              </div>
              <Button
                size="sm" variant="outline"
                disabled={!info?.supported || info.state === "granted" || busy === k}
                onClick={() => onRequest(k)}
              >
                {info?.state === "granted" ? "मंजूर" : busy === k ? "..." : "परवानगी द्या"}
              </Button>
            </div>
          );
        })}
        <p className="text-[11px] text-muted-foreground pt-1 flex items-start gap-1.5">
          <Settings2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Android 13+ वरील सूचना परवानगी ब्राउझरद्वारे मागितली जाते. नाकारल्यास पुन्हा सुरू करण्यासाठी Browser/App Settings मध्ये परवानगी बदला.
        </p>
      </CardContent>
    </Card>
  );
};

export default PermissionManager;
