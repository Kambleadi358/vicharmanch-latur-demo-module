import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Gift, Trash2 } from "lucide-react";

const ranks = ["प्रथम", "द्वितीय", "तृतीय"];

const PrizeAllocation = () => {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedWinner, setSelectedWinner] = useState("");
  const [selectedRank, setSelectedRank] = useState("");
  const [selectedItem, setSelectedItem] = useState("");

  const { data: programs } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: programWinners } = useQuery({
    queryKey: ["program-winners", selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from("program_winners")
        .select("*")
        .eq("program_id", selectedProgram);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram,
  });

  const { data: prizeItems } = useQuery({
    queryKey: ["prize-items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prize_items").select("*").order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: allocations } = useQuery({
    queryKey: ["prize-allocations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prize_allocations")
        .select("*, programs(name, date), prize_items(item_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getAllocatedCount = (itemId: string) => {
    return allocations?.filter((a) => a.prize_item_id === itemId).length || 0;
  };

  // Check if a winner already has a prize allocated for this program + group
  const isWinnerAllocated = (winnerName: string, programId: string, groupName: string) => {
    return allocations?.some(
      (a) => a.winner_name === winnerName && a.program_id === programId && a.group_name === groupName
    ) || false;
  };

  // Build winner options from program_winners based on selected group
  const winnerOptions: { name: string; rank: string; allocated: boolean }[] = [];
  if (programWinners && selectedGroup) {
    programWinners.forEach((w) => {
      if (w.category === selectedGroup) {
        if (w.first_place) {
          winnerOptions.push({
            name: w.first_place,
            rank: "प्रथम",
            allocated: isWinnerAllocated(w.first_place, selectedProgram, selectedGroup),
          });
        }
        if (w.second_place) {
          winnerOptions.push({
            name: w.second_place,
            rank: "द्वितीय",
            allocated: isWinnerAllocated(w.second_place, selectedProgram, selectedGroup),
          });
        }
        if (w.third_place) {
          winnerOptions.push({
            name: w.third_place,
            rank: "तृतीय",
            allocated: isWinnerAllocated(w.third_place, selectedProgram, selectedGroup),
          });
        }
      }
    });
  }

  const availableGroups = programWinners
    ? [...new Set(programWinners.map((w) => w.category))]
    : [];

  const handleWinnerSelect = (winnerName: string) => {
    setSelectedWinner(winnerName);
    const match = winnerOptions.find((w) => w.name === winnerName);
    if (match) {
      setSelectedRank(match.rank);
    }
  };

  const allocate = useMutation({
    mutationFn: async () => {
      if (!selectedProgram || !selectedGroup || !selectedWinner || !selectedRank || !selectedItem) {
        throw new Error("सर्व फील्ड भरा");
      }
      // Check if winner already allocated
      if (isWinnerAllocated(selectedWinner, selectedProgram, selectedGroup)) {
        throw new Error(`"${selectedWinner}" ला आधीच बक्षीस वाटप केले आहे!`);
      }
      const item = prizeItems?.find((i) => i.id === selectedItem);
      if (!item) throw new Error("वस्तू सापडली नाही");
      const allocated = getAllocatedCount(selectedItem);
      if (allocated >= item.quantity) {
        throw new Error(`"${item.item_name}" चा स्टॉक संपला आहे!`);
      }
      const { error } = await supabase.from("prize_allocations").insert({
        program_id: selectedProgram,
        group_name: selectedGroup,
        winner_name: selectedWinner,
        rank: selectedRank,
        prize_item_id: selectedItem,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prize-allocations"] });
      setSelectedWinner("");
      setSelectedRank("");
      setSelectedItem("");
      toast.success("बक्षीस वाटप केले!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteAllocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prize_allocations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prize-allocations"] });
      toast.success("वाटप काढले!");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5" />
          बक्षीस वाटप
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">कार्यक्रम</Label>
            <Select value={selectedProgram} onValueChange={(v) => { setSelectedProgram(v); setSelectedGroup(""); setSelectedWinner(""); setSelectedRank(""); }}>
              <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
              <SelectContent>
                {programs?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">गट (Category)</Label>
            <Select value={selectedGroup} onValueChange={(v) => { setSelectedGroup(v); setSelectedWinner(""); setSelectedRank(""); }}>
              <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
              <SelectContent>
                {availableGroups.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">विजेता (सिस्टम मधून)</Label>
            <Select value={selectedWinner} onValueChange={handleWinnerSelect}>
              <SelectTrigger><SelectValue placeholder="विजेता निवडा" /></SelectTrigger>
              <SelectContent>
                {winnerOptions.map((w) => (
                  <SelectItem key={`${w.name}-${w.rank}`} value={w.name} disabled={w.allocated}>
                    {w.rank === "प्रथम" ? "🥇" : w.rank === "द्वितीय" ? "🥈" : "🥉"} {w.name} ({w.rank})
                    {w.allocated && " ✅ वाटप झाले"}
                  </SelectItem>
                ))}
                {winnerOptions.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {!selectedProgram ? "कार्यक्रम निवडा" : !selectedGroup ? "गट निवडा" : "विजेते जाहीर नाहीत"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">क्रमांक (Auto - बदलता येत नाही)</Label>
            <Select value={selectedRank} disabled>
              <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
              <SelectContent>
                {ranks.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">बक्षीस वस्तू</Label>
            <Select value={selectedItem} onValueChange={setSelectedItem}>
              <SelectTrigger><SelectValue placeholder="निवडा" /></SelectTrigger>
              <SelectContent>
                {prizeItems?.map((item) => {
                  const remaining = item.quantity - getAllocatedCount(item.id);
                  return (
                    <SelectItem key={item.id} value={item.id} disabled={remaining <= 0}>
                      {item.item_name} ({remaining} शिल्लक)
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => allocate.mutate()} className="w-full gap-1">
              <Gift className="h-4 w-4" /> वाटप करा
            </Button>
          </div>
        </div>

        {/* Allocations list */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>कार्यक्रम</TableHead>
                <TableHead>गट</TableHead>
                <TableHead>विजेता</TableHead>
                <TableHead>क्रमांक</TableHead>
                <TableHead>बक्षीस</TableHead>
                <TableHead className="text-right">क्रिया</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations?.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.programs?.name}</TableCell>
                  <TableCell>{a.group_name}</TableCell>
                  <TableCell>{a.winner_name}</TableCell>
                  <TableCell><Badge variant="outline">{a.rank}</Badge></TableCell>
                  <TableCell>{a.prize_items?.item_name}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="destructive" onClick={() => deleteAllocation.mutate(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!allocations || allocations.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    कोणतेही वाटप नाही
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrizeAllocation;
