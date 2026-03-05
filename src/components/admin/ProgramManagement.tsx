import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Trophy } from "lucide-react";

interface Program {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string | null;
  status: string;
  description: string | null;
  is_visible: boolean;
}

interface ProgramWinner {
  id: string;
  program_id: string;
  category: string;
  first_place: string | null;
  second_place: string | null;
  third_place: string | null;
  show_on_ui: boolean;
}

const categories = ["छोटा गट", "मोठा गट", "खुला गट"];

const ProgramManagement = () => {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isWinnersOpen, setIsWinnersOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    status: "upcoming",
    description: "",
  });
  const [winnersData, setWinnersData] = useState<Record<string, { first: string; second: string; third: string }>>({});
  const [showOnUi, setShowOnUi] = useState(true);

  const { data: programs, isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  const { data: winners } = useQuery({
    queryKey: ["program-winners", selectedProgram?.id],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from("program_winners")
        .select("*")
        .eq("program_id", selectedProgram.id);
      if (error) throw error;
      return data as ProgramWinner[];
    },
    enabled: !!selectedProgram,
  });

  const addProgram = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("programs").insert({
        name: formData.name,
        date: formData.date,
        time: formData.time,
        location: formData.location || null,
        status: formData.status,
        description: formData.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      setIsAddOpen(false);
      setFormData({ name: "", date: "", time: "", location: "", status: "upcoming", description: "" });
      toast.success("कार्यक्रम जोडला!");
    },
    onError: () => toast.error("कार्यक्रम जोडताना त्रुटी"),
  });

  const updateProgram = useMutation({
    mutationFn: async (program: Program) => {
      const { error } = await supabase
        .from("programs")
        .update({ status: program.status === "upcoming" ? "completed" : "upcoming" })
        .eq("id", program.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      toast.success("स्थिती अपडेट केली!");
    },
  });

  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      toast.success("कार्यक्रम काढला!");
    },
  });

  const saveWinners = useMutation({
    mutationFn: async () => {
      if (!selectedProgram) return;
      
      for (const category of categories) {
        const winnerData = winnersData[category];
        if (!winnerData) continue;

        const { error } = await supabase.from("program_winners").upsert({
          program_id: selectedProgram.id,
          category,
          first_place: winnerData.first || null,
          second_place: winnerData.second || null,
          third_place: winnerData.third || null,
          show_on_ui: showOnUi,
        }, { onConflict: "program_id,category" });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-winners", selectedProgram?.id] });
      toast.success("विजेते सेव्ह केले!");
    },
    onError: () => toast.error("विजेते सेव्ह करताना त्रुटी"),
  });

  const toggleShowOnUi = useMutation({
    mutationFn: async ({ programId, newValue }: { programId: string; newValue: boolean }) => {
      const { error } = await supabase
        .from("program_winners")
        .update({ show_on_ui: newValue })
        .eq("program_id", programId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-winners"] });
      toast.success("विजेते दृश्यता अपडेट केली!");
    },
  });

  const openWinnersDialog = (program: Program) => {
    setSelectedProgram(program);
    setIsWinnersOpen(true);
  };

  // Update winners data when winners are fetched
  if (winners && Object.keys(winnersData).length === 0) {
    const data: Record<string, { first: string; second: string; third: string }> = {};
    let currentShowOnUi = true;
    for (const category of categories) {
      const winner = winners.find((w) => w.category === category);
      data[category] = {
        first: winner?.first_place || "",
        second: winner?.second_place || "",
        third: winner?.third_place || "",
      };
      if (winner) currentShowOnUi = winner.show_on_ui;
    }
    if (JSON.stringify(data) !== JSON.stringify(winnersData)) {
      setWinnersData(data);
      setShowOnUi(currentShowOnUi);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">कार्यक्रम व्यवस्थापन</CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> कार्यक्रम जोडा
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>नवीन कार्यक्रम</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="कार्यक्रमाचे नाव" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <Input placeholder="तारीख (उदा. १४ एप्रिल २०२५)" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              <Input placeholder="वेळ (उदा. सकाळी ६:०० वाजता)" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} />
              <Input placeholder="ठिकाण" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">आगामी</SelectItem>
                  <SelectItem value="completed">पूर्ण</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="वर्णन (पर्यायी)" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <Button onClick={() => addProgram.mutate()} className="w-full">जोडा</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">लोड होत आहे...</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>नाव</TableHead>
                  <TableHead>तारीख</TableHead>
                  <TableHead>वेळ</TableHead>
                  <TableHead>स्थिती</TableHead>
                  <TableHead className="text-right">क्रिया</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs?.map((program) => (
                  <TableRow key={program.id}>
                    <TableCell className="font-medium">{program.name}</TableCell>
                    <TableCell>{program.date}</TableCell>
                    <TableCell>{program.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={program.status === "upcoming" ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => updateProgram.mutate(program)}
                      >
                        {program.status === "upcoming" ? "आगामी" : "पूर्ण"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="icon" variant="outline" onClick={() => { setWinnersData({}); openWinnersDialog(program); }}>
                        <Trophy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" onClick={() => deleteProgram.mutate(program.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Winners Dialog */}
        <Dialog open={isWinnersOpen} onOpenChange={setIsWinnersOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                विजेते - {selectedProgram?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Show on UI Toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label className="text-sm font-semibold">विजेते UI वर दाखवा</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    बंद केल्यास "विजेते गुपित आहेत" असा संदेश दिसेल
                  </p>
                </div>
                <Switch checked={showOnUi} onCheckedChange={setShowOnUi} />
              </div>

              {categories.map((category) => (
                <div key={category} className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-lg mb-4 text-accent">{category}</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">🥇 प्रथम:</span>
                      <Input
                        placeholder="विजेत्याचे नाव"
                        value={winnersData[category]?.first || ""}
                        onChange={(e) => setWinnersData({ ...winnersData, [category]: { ...winnersData[category], first: e.target.value } })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">🥈 द्वितीय:</span>
                      <Input
                        placeholder="विजेत्याचे नाव"
                        value={winnersData[category]?.second || ""}
                        onChange={(e) => setWinnersData({ ...winnersData, [category]: { ...winnersData[category], second: e.target.value } })}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium">🥉 तृतीय:</span>
                      <Input
                        placeholder="विजेत्याचे नाव"
                        value={winnersData[category]?.third || ""}
                        onChange={(e) => setWinnersData({ ...winnersData, [category]: { ...winnersData[category], third: e.target.value } })}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button onClick={() => saveWinners.mutate()} className="w-full">
                विजेते सेव्ह करा
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProgramManagement;
