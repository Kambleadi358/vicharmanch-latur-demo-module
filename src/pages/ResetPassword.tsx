import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const hasRecoveryToken = useMemo(() => {
    const hash = window.location.hash || "";
    return hash.includes("type=recovery") || hash.includes("access_token=");
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRecoveryToken) return toast.error("वैध reset लिंक वापरा");
    if (password.length < 8) return toast.error("नवीन पासवर्ड किमान ८ अक्षरांचा असावा");
    if (password !== confirmPassword) return toast.error("पासवर्ड जुळत नाहीत");

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);

    if (error) return toast.error(error.message);
    toast.success("पासवर्ड बदलला गेला");
    navigate("/admin-login");
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>नवीन पासवर्ड सेट करा</CardTitle>
          <CardDescription>ईमेलमधील reset लिंक वापरून सुरक्षित नवीन पासवर्ड तयार करा.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasRecoveryToken ? (
            <p className="text-sm text-destructive">ही लिंक वैध नाही. पुन्हा forgot password वापरा.</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label>नवीन पासवर्ड</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label>पासवर्ड पुन्हा टाका</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "जतन होत आहे..." : "पासवर्ड बदला"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;