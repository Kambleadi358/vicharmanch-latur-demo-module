import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Eye, EyeOff } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  description: string | null;
  date: string;
  is_new: boolean | null;
  is_visible: boolean | null;
  notice_type: string;
  created_at: string;
}

const NoticeManagement = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    is_new: true,
    is_visible: true,
    notice_type: "notice" as string,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    const { data, error } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "त्रुटी", description: "सूचना लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setNotices(data || []);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      is_new: true,
      is_visible: true,
      notice_type: "notice",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: "त्रुटी", description: "शीर्षक आवश्यक आहे", variant: "destructive" });
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("notices").update(formData).eq("id", editingId);
      if (error) {
        toast({ title: "त्रुटी", description: "सूचना अपडेट करण्यात त्रुटी", variant: "destructive" });
      } else {
        toast({ title: "यशस्वी", description: "सूचना अपडेट केली" });
        resetForm();
        fetchNotices();
      }
    } else {
      const { error } = await supabase.from("notices").insert([formData]);
      if (error) {
        toast({ title: "त्रुटी", description: "सूचना जोडण्यात त्रुटी", variant: "destructive" });
      } else {
        toast({ title: "यशस्वी", description: "सूचना जोडली गेली" });
        resetForm();
        fetchNotices();
      }
    }
  };

  const handleEdit = (notice: Notice) => {
    setFormData({
      title: notice.title,
      description: notice.description || "",
      date: notice.date,
      is_new: notice.is_new ?? true,
      is_visible: notice.is_visible ?? true,
      notice_type: notice.notice_type ?? "notice",
    });
    setEditingId(notice.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: "सूचना हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "सूचना हटवली" });
      fetchNotices();
    }
  };

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("notices").update({ is_visible: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: "दृश्यता बदलण्यात त्रुटी", variant: "destructive" });
    } else {
      fetchNotices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">सूचना व्यवस्थापन</h3>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-2" /> नवीन सूचना
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "सूचना संपादित करा" : "नवीन सूचना जोडा"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>शीर्षक *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="सूचना शीर्षक" />
            </div>
            <div className="space-y-2">
              <Label>वर्णन</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="सूचनेचे तपशील"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>तारीख</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_new} onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })} />
                  <Label>नवीन म्हणून दाखवा</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_visible} onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })} />
                  <Label>दृश्यमान</Label>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" /> जतन करा
              </Button>
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-2" /> रद्द करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>शीर्षक</TableHead>
            <TableHead>तारीख</TableHead>
            <TableHead>स्थिती</TableHead>
            <TableHead>दृश्यता</TableHead>
            <TableHead>क्रिया</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notices.map((notice) => (
            <TableRow key={notice.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{notice.title}</p>
                  {notice.description && <p className="text-sm text-muted-foreground truncate max-w-xs">{notice.description}</p>}
                </div>
              </TableCell>
              <TableCell>{notice.date}</TableCell>
              <TableCell>
                {notice.is_new && <span className="bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">नवीन</span>}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => toggleVisibility(notice.id, notice.is_visible ?? true)}>
                  {notice.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(notice)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(notice.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NoticeManagement;
