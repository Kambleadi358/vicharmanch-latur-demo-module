import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Home, IndianRupee, Check, X, Edit2, Save, Search, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface HomeData {
  id: string;
  home_number: number;
  home_name: string | null;
  contact_person: string | null;
  contact_phone: string | null;
}

interface DonationData {
  id: string;
  home_id: string;
  year: string;
  assigned_amount: number;
  paid_amount: number;
  notes: string | null;
}

const DonationManagement = () => {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [donations, setDonations] = useState<DonationData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "partial">("all");
  const [editingDonation, setEditingDonation] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ assigned_amount: 0, paid_amount: 0, notes: "" });
  const [bulkAssignAmount, setBulkAssignAmount] = useState("");
  const { toast } = useToast();

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  useEffect(() => {
    fetchHomes();
  }, []);

  useEffect(() => {
    if (homes.length > 0) {
      fetchDonations();
    }
  }, [selectedYear, homes]);

  const fetchHomes = async () => {
    const { data, error } = await supabase
      .from("homes")
      .select("*")
      .order("home_number", { ascending: true });
    
    if (error) {
      toast({ title: "त्रुटी", description: "घरे लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setHomes(data || []);
    }
  };

  const fetchDonations = async () => {
    const { data, error } = await supabase
      .from("home_donations")
      .select("*")
      .eq("year", selectedYear);
    
    if (error) {
      toast({ title: "त्रुटी", description: "देणगी माहिती लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setDonations(data || []);
    }
  };

  const getDonationForHome = (homeId: string) => {
    return donations.find(d => d.home_id === homeId);
  };

  const handleBulkAssign = async () => {
    const amount = parseFloat(bulkAssignAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "त्रुटी", description: "वैध रक्कम प्रविष्ट करा", variant: "destructive" });
      return;
    }

    const existingDonations = donations.map(d => d.home_id);
    const homesToUpdate = homes.filter(h => !existingDonations.includes(h.id));

    if (homesToUpdate.length === 0) {
      toast({ title: "माहिती", description: "सर्व घरांना आधीच देणगी नियुक्त केली आहे" });
      return;
    }

    const newDonations = homesToUpdate.map(home => ({
      home_id: home.id,
      year: selectedYear,
      assigned_amount: amount,
      paid_amount: 0,
    }));

    const { error } = await supabase.from("home_donations").insert(newDonations);

    if (error) {
      toast({ title: "त्रुटी", description: "देणगी नियुक्त करण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: `${homesToUpdate.length} घरांना देणगी नियुक्त केली` });
      setBulkAssignAmount("");
      fetchDonations();
    }
  };

  const handleEditStart = (donation: DonationData) => {
    setEditingDonation(donation.id);
    setEditForm({
      assigned_amount: donation.assigned_amount,
      paid_amount: donation.paid_amount,
      notes: donation.notes || "",
    });
  };

  const handleSaveDonation = async () => {
    if (!editingDonation) return;

    const { error } = await supabase
      .from("home_donations")
      .update({
        assigned_amount: editForm.assigned_amount,
        paid_amount: editForm.paid_amount,
        notes: editForm.notes || null,
        payment_date: editForm.paid_amount > 0 ? new Date().toISOString() : null,
      })
      .eq("id", editingDonation);

    if (error) {
      toast({ title: "त्रुटी", description: "अपडेट करण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "देणगी माहिती अपडेट केली" });
      setEditingDonation(null);
      fetchDonations();
    }
  };

  const handleCreateDonation = async (homeId: string) => {
    const { error } = await supabase.from("home_donations").insert({
      home_id: homeId,
      year: selectedYear,
      assigned_amount: 0,
      paid_amount: 0,
    });

    if (error) {
      toast({ title: "त्रुटी", description: "देणगी तयार करण्यात त्रुटी", variant: "destructive" });
    } else {
      fetchDonations();
    }
  };

  const getPaymentStatus = (donation: DonationData | undefined) => {
    if (!donation) return "none";
    if (donation.paid_amount >= donation.assigned_amount && donation.assigned_amount > 0) return "paid";
    if (donation.paid_amount > 0) return "partial";
    return "pending";
  };

  const filteredHomes = homes.filter(home => {
    const matchesSearch = home.home_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      home.home_number.toString().includes(searchTerm) ||
      home.contact_person?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    const donation = getDonationForHome(home.id);
    const status = getPaymentStatus(donation);

    if (filter === "all") return true;
    if (filter === "paid") return status === "paid";
    if (filter === "pending") return status === "pending" || status === "none";
    if (filter === "partial") return status === "partial";
    return true;
  });

  const totalAssigned = donations.reduce((sum, d) => sum + Number(d.assigned_amount), 0);
  const totalPaid = donations.reduce((sum, d) => sum + Number(d.paid_amount), 0);
  const totalPending = totalAssigned - totalPaid;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">एकूण घरे</p>
                <p className="text-2xl font-bold">{homes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">नियुक्त रक्कम</p>
                <p className="text-2xl font-bold">₹{totalAssigned.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">जमा रक्कम</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">बाकी रक्कम</p>
                <p className="text-2xl font-bold text-red-600">₹{totalPending.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            देणगी व्यवस्थापन - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Label>वर्ष:</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="घर शोधा..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-48"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">सर्व</SelectItem>
                  <SelectItem value="paid">दिले</SelectItem>
                  <SelectItem value="partial">अंशतः</SelectItem>
                  <SelectItem value="pending">बाकी</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-end gap-4 p-4 bg-secondary rounded-lg">
            <div className="space-y-2">
              <Label>सर्व घरांना एकत्र देणगी नियुक्त करा</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="रक्कम (₹)"
                  value={bulkAssignAmount}
                  onChange={(e) => setBulkAssignAmount(e.target.value)}
                  className="w-32"
                />
                <Button onClick={handleBulkAssign}>सर्वांना नियुक्त करा</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Homes Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">क्र.</TableHead>
              <TableHead>घर</TableHead>
              <TableHead>संपर्क</TableHead>
              <TableHead className="text-right">नियुक्त</TableHead>
              <TableHead className="text-right">दिले</TableHead>
              <TableHead className="text-right">बाकी</TableHead>
              <TableHead>स्थिती</TableHead>
              <TableHead>क्रिया</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHomes.map((home) => {
              const donation = getDonationForHome(home.id);
              const status = getPaymentStatus(donation);
              const remaining = donation ? donation.assigned_amount - donation.paid_amount : 0;
              const isEditing = editingDonation === donation?.id;

              return (
                <TableRow key={home.id}>
                  <TableCell className="font-medium">{home.home_number}</TableCell>
                  <TableCell>{home.home_name || `घर ${home.home_number}`}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{home.contact_person || "-"}</p>
                      <p className="text-muted-foreground">{home.contact_phone || ""}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.assigned_amount}
                        onChange={(e) => setEditForm({ ...editForm, assigned_amount: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                    ) : (
                      <span>₹{donation?.assigned_amount?.toLocaleString() || 0}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.paid_amount}
                        onChange={(e) => setEditForm({ ...editForm, paid_amount: parseFloat(e.target.value) || 0 })}
                        className="w-24"
                      />
                    ) : (
                      <span className="text-green-600">₹{donation?.paid_amount?.toLocaleString() || 0}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                      ₹{remaining.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {status === "paid" && <Badge className="bg-green-500">पूर्ण</Badge>}
                    {status === "partial" && <Badge className="bg-yellow-500">अंशतः</Badge>}
                    {status === "pending" && <Badge variant="destructive">बाकी</Badge>}
                    {status === "none" && <Badge variant="outline">नियुक्त नाही</Badge>}
                  </TableCell>
                  <TableCell>
                    {donation ? (
                      isEditing ? (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={handleSaveDonation}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDonation(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => handleEditStart(donation)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleCreateDonation(home.id)}>
                        नियुक्त करा
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DonationManagement;
