import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Plus, Search, Users, Home, Phone, Trash2, Edit2, GraduationCap,
  RefreshCw, UserPlus, Loader2,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

type Gender = "male" | "female" | "other";
type Edu =
  | "school_not_eligible" | "balwadi"
  | "class_1" | "class_2" | "class_3" | "class_4" | "class_5" | "class_6"
  | "class_7" | "class_8" | "class_9" | "class_10" | "class_11" | "class_12"
  | "diploma" | "degree" | "other";

const EDU_LABELS: Record<Edu, string> = {
  school_not_eligible: "शाळेत जाण्यायोग्य नाही", balwadi: "बालवाडी",
  class_1: "१ ली", class_2: "२ री", class_3: "३ री", class_4: "४ थी",
  class_5: "५ वी", class_6: "६ वी", class_7: "७ वी", class_8: "८ वी",
  class_9: "९ वी", class_10: "१० वी", class_11: "११ वी", class_12: "१२ वी",
  diploma: "डिप्लोमा", degree: "पदवी", other: "इतर",
};
const EDU_ORDER: Edu[] = [
  "school_not_eligible","balwadi","class_1","class_2","class_3","class_4","class_5",
  "class_6","class_7","class_8","class_9","class_10","class_11","class_12",
  "diploma","degree","other",
];
const GENDER_LABELS: Record<Gender, string> = { male: "पुरुष", female: "महिला", other: "इतर" };

interface Household {
  id: string;
  house_code: number;
  head_name: string;
  head_gender: Gender;
  mobile: string;
  address: string | null;
  active_year: string;
}
interface Member {
  id: string;
  household_id: string;
  name: string;
  gender: Gender;
  education_level: Edu;
  is_head: boolean;
}

const SamajNondaniManagement = () => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddHH, setShowAddHH] = useState(false);
  const [detailHH, setDetailHH] = useState<Household | null>(null);
  const [promoting, setPromoting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [{ data: hh }, { data: m }] = await Promise.all([
      supabase.from("households").select("*").order("house_code", { ascending: true }),
      supabase.from("household_members").select("*").order("is_head", { ascending: false }),
    ]);
    setHouseholds((hh as any) || []);
    setMembers((m as any) || []);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const filtered = households.filter((h) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      h.head_name.toLowerCase().includes(q) ||
      h.mobile.includes(q) ||
      String(h.house_code).includes(q)
    );
  });

  const totalMale = members.filter((m) => m.gender === "male").length;
  const totalFemale = members.filter((m) => m.gender === "female").length;
  const eduCounts = EDU_ORDER.map((k) => ({
    label: EDU_LABELS[k],
    count: members.filter((m) => m.education_level === k).length,
  })).filter((x) => x.count > 0);

  const handlePromote = async () => {
    setPromoting(true);
    const { data, error } = await supabase.rpc("promote_education_levels");
    setPromoting(false);
    if (error) toast.error("त्रुटी: " + error.message);
    else {
      toast.success(`${data} सदस्यांचे शिक्षण स्तर पुढे नेले`);
      loadAll();
    }
  };

  return (
    <div className="space-y-4">
      {/* Analytics summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "एकूण घरे", value: households.length, icon: Home, color: "from-blue-500 to-indigo-600" },
          { label: "एकूण सदस्य", value: members.length, icon: Users, color: "from-emerald-500 to-teal-600" },
          { label: "पुरुष", value: totalMale, icon: Users, color: "from-sky-500 to-blue-600" },
          { label: "महिला", value: totalFemale, icon: Users, color: "from-pink-500 to-rose-600" },
          { label: "इतर", value: members.length - totalMale - totalFemale, icon: Users, color: "from-violet-500 to-purple-600" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-md overflow-hidden relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-95`} />
              <CardContent className="relative p-3 text-white">
                <Icon className="h-4 w-4 opacity-80" />
                <p className="mt-1.5 text-[11px] opacity-90">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Education distribution chart */}
      {eduCounts.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" /> शिक्षण वितरण
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eduCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" /> समाज नोंदणी
              <Badge variant="outline" className="ml-2">{filtered.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={promoting}>
                    {promoting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    वार्षिक प्रमोशन
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>वार्षिक शिक्षण प्रमोशन</AlertDialogTitle>
                    <AlertDialogDescription>
                      सर्व सदस्यांचे शिक्षण स्तर एक पाऊल पुढे जाईल (उदा. १ ली → २ री).
                      हे केवळ समुदाय नियोजनासाठी आहे — शैक्षणिक प्रमाणीकरण नाही.
                      नंतर तुम्ही प्रत्येक सदस्य स्वतंत्रपणे संपादित करू शकता.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>रद्द</AlertDialogCancel>
                    <AlertDialogAction onClick={handlePromote}>पुढे न्या</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button size="sm" onClick={() => setShowAddHH(true)}>
                <Plus className="h-4 w-4 mr-1" /> नवीन घर
              </Button>
            </div>
          </div>
          <div className="relative mt-2">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="नाव, मोबाईल किंवा घर क्रमांकाने शोधा..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">लोड होत आहे...</div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {search ? "शोधाशी जुळणारी नोंद नाही" : "अद्याप कोणतीही नोंद नाही — पहिले घर जोडा"}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((h) => {
                const mc = members.filter((m) => m.household_id === h.id).length;
                return (
                  <button
                    key={h.id}
                    onClick={() => setDetailHH(h)}
                    className="w-full flex items-center gap-3 py-3 hover:bg-muted/40 -mx-2 px-2 rounded-lg text-left transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0 text-xs">
                      #{h.house_code}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{h.head_name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{h.mobile}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{mc} सदस्य</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{GENDER_LABELS[h.head_gender]}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddHouseholdDialog open={showAddHH} onOpenChange={setShowAddHH} onSaved={loadAll} />
      {detailHH && (
        <HouseholdDetailDialog
          household={detailHH}
          members={members.filter((m) => m.household_id === detailHH.id)}
          onClose={() => setDetailHH(null)}
          onChanged={loadAll}
        />
      )}
    </div>
  );
};

// ----------------- Add Household Dialog -----------------
const AddHouseholdDialog = ({ open, onOpenChange, onSaved }: {
  open: boolean; onOpenChange: (b: boolean) => void; onSaved: () => void;
}) => {
  const [headName, setHeadName] = useState("");
  const [headGender, setHeadGender] = useState<Gender>("male");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setHeadName(""); setHeadGender("male"); setMobile(""); setAddress(""); };

  const handleSave = async () => {
    if (!headName.trim() || !mobile.trim()) {
      toast.error("कुटुंबप्रमुख नाव आणि मोबाईल आवश्यक");
      return;
    }
    if (!/^\d{10}$/.test(mobile.trim())) {
      toast.error("मोबाईल १० अंकी असावा");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("households").insert({
      head_name: headName.trim(),
      head_gender: headGender,
      mobile: mobile.trim(),
      address: address.trim() || null,
    });
    setSaving(false);
    if (error) { toast.error("त्रुटी: " + error.message); return; }
    toast.success("घर नोंदणी झाली — कुटुंबप्रमुख आपोआप पहिले सदस्य म्हणून जोडले गेले");
    reset();
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Home className="h-5 w-5" /> नवीन घर नोंदणी</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">कुटुंबप्रमुख नाव *</Label>
            <Input value={headName} onChange={(e) => setHeadName(e.target.value)} placeholder="पूर्ण नाव" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">कुटुंबप्रमुख लिंग *</Label>
            <Select value={headGender} onValueChange={(v) => setHeadGender(v as Gender)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">पुरुष</SelectItem>
                <SelectItem value="female">महिला</SelectItem>
                <SelectItem value="other">इतर</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">मोबाईल क्रमांक *</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="१० अंकी" inputMode="numeric" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">पत्ता (वैकल्पिक)</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="पत्ता" />
          </div>
          <p className="text-[11px] text-muted-foreground bg-muted/40 rounded p-2">
            💡 कुटुंबप्रमुख आपोआप पहिले सदस्य म्हणून जोडले जातील. नंतर इतर सदस्य जोडता येतील.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>रद्द</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} जतन करा
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Household Detail / Edit Dialog -----------------
const HouseholdDetailDialog = ({ household, members, onClose, onChanged }: {
  household: Household; members: Member[];
  onClose: () => void; onChanged: () => void;
}) => {
  const [editing, setEditing] = useState<Member | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [confirmDeleteHH, setConfirmDeleteHH] = useState(false);

  const deleteMember = async (m: Member) => {
    if (m.is_head) {
      toast.error("कुटुंबप्रमुख हटवू शकत नाही — आधी घर हटवा");
      return;
    }
    const { error } = await supabase.from("household_members").delete().eq("id", m.id);
    if (error) toast.error("त्रुटी: " + error.message);
    else { toast.success("सदस्य हटवला"); onChanged(); }
    setConfirmDelete(null);
  };

  const deleteHousehold = async () => {
    const { error } = await supabase.from("households").delete().eq("id", household.id);
    if (error) toast.error("त्रुटी: " + error.message);
    else { toast.success("घर हटवले"); onChanged(); onClose(); }
  };

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" /> घर #{household.house_code} — {household.head_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 bg-muted/30 text-sm grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">मोबाईल:</span> <b>{household.mobile}</b></div>
            <div><span className="text-muted-foreground">लिंग:</span> <b>{GENDER_LABELS[household.head_gender]}</b></div>
            {household.address && (
              <div className="col-span-2"><span className="text-muted-foreground">पत्ता:</span> {household.address}</div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" /> सदस्य ({members.length})
              </h3>
              <Button size="sm" variant="outline" onClick={() => setShowAddMember(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> सदस्य जोडा
              </Button>
            </div>
            <div className="divide-y border rounded-lg">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2 p-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate flex items-center gap-2">
                      {m.name}
                      {m.is_head && <Badge variant="secondary" className="text-[9px]">कुटुंबप्रमुख</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {GENDER_LABELS[m.gender]} • {EDU_LABELS[m.education_level]}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(m)}>
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  {!m.is_head && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => setConfirmDelete(m)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteHH(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> घर हटवा
          </Button>
          <Button variant="outline" onClick={onClose}>बंद</Button>
        </DialogFooter>

        {showAddMember && (
          <MemberEditDialog
            householdId={household.id}
            member={null}
            onClose={() => setShowAddMember(false)}
            onSaved={() => { setShowAddMember(false); onChanged(); }}
          />
        )}
        {editing && (
          <MemberEditDialog
            householdId={household.id}
            member={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); onChanged(); }}
          />
        )}

        <AlertDialog open={!!confirmDelete} onOpenChange={(b) => !b && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>सदस्य हटवायचा?</AlertDialogTitle>
              <AlertDialogDescription>{confirmDelete?.name} हटवला जाईल.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>रद्द</AlertDialogCancel>
              <AlertDialogAction onClick={() => confirmDelete && deleteMember(confirmDelete)}>हटवा</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={confirmDeleteHH} onOpenChange={setConfirmDeleteHH}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>संपूर्ण घर हटवायचे?</AlertDialogTitle>
              <AlertDialogDescription>
                हे घर आणि त्याचे सर्व सदस्य हटवले जातील. देणगी इतिहास असल्यास हटवता येणार नाही.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>रद्द</AlertDialogCancel>
              <AlertDialogAction onClick={deleteHousehold} className="bg-destructive">हटवा</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

// ----------------- Add / Edit Member -----------------
const MemberEditDialog = ({ householdId, member, onClose, onSaved }: {
  householdId: string; member: Member | null;
  onClose: () => void; onSaved: () => void;
}) => {
  const [name, setName] = useState(member?.name || "");
  const [gender, setGender] = useState<Gender>(member?.gender || "male");
  const [edu, setEdu] = useState<Edu>(member?.education_level || "other");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { toast.error("नाव आवश्यक"); return; }
    setSaving(true);
    let error;
    if (member) {
      ({ error } = await supabase.from("household_members").update({
        name: name.trim(), gender, education_level: edu,
      }).eq("id", member.id));
    } else {
      ({ error } = await supabase.from("household_members").insert({
        household_id: householdId, name: name.trim(), gender, education_level: edu,
      }));
    }
    setSaving(false);
    if (error) toast.error("त्रुटी: " + error.message);
    else { toast.success(member ? "सदस्य अद्ययावत" : "सदस्य जोडला"); onSaved(); }
  };

  return (
    <Dialog open onOpenChange={(b) => !b && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{member ? "सदस्य संपादन" : "नवीन सदस्य"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">नाव *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">लिंग *</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">पुरुष</SelectItem>
                <SelectItem value="female">महिला</SelectItem>
                <SelectItem value="other">इतर</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">शिक्षण स्तर *</Label>
            <Select value={edu} onValueChange={(v) => setEdu(v as Edu)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EDU_ORDER.map((k) => (
                  <SelectItem key={k} value={k}>{EDU_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>रद्द</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} जतन
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SamajNondaniManagement;
