import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Home, IndianRupee, X, Edit2, Save, Search, Filter, Plus, Trash2, Wallet, TrendingDown, TrendingUp, Eye, EyeOff, Download, FileSpreadsheet, Phone, Calendar, FileText, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  payment_date: string | null;
  notes: string | null;
}

interface AccountExpense {
  id: string;
  account_id: string;
  item: string;
  amount: number;
}

interface YearlyAccount {
  id: string;
  year: string;
  total_income: number | null;
  total_expense: number | null;
  is_visible: boolean | null;
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
  const [editingHome, setEditingHome] = useState<string | null>(null);
  const [homeNameInput, setHomeNameInput] = useState("");
  const [isAddingHome, setIsAddingHome] = useState(false);
  const [newHomeForm, setNewHomeForm] = useState({ home_name: "", contact_phone: "" });
  
  // Expense management
  const [yearlyAccount, setYearlyAccount] = useState<YearlyAccount | null>(null);
  const [expenses, setExpenses] = useState<AccountExpense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ item: "", amount: 0 });
  
  const { toast } = useToast();

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  useEffect(() => {
    fetchHomes();
  }, []);

  useEffect(() => {
    if (homes.length > 0) {
      fetchDonations();
      fetchOrCreateYearlyAccount();
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

  const fetchOrCreateYearlyAccount = async () => {
    const { data: existingAccount } = await supabase
      .from("yearly_accounts")
      .select("*")
      .eq("year", selectedYear)
      .single();

    if (existingAccount) {
      setYearlyAccount(existingAccount);
      fetchExpenses(existingAccount.id);
    } else {
      const { data: newAccount, error } = await supabase
        .from("yearly_accounts")
        .insert({ year: selectedYear, total_income: 0, total_expense: 0, is_visible: false })
        .select()
        .single();

      if (!error && newAccount) {
        setYearlyAccount(newAccount);
        setExpenses([]);
      }
    }
  };

  const fetchExpenses = async (accountId: string) => {
    const { data, error } = await supabase
      .from("account_expenses")
      .select("*")
      .eq("account_id", accountId);

    if (!error) {
      setExpenses(data || []);
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

    const currentDonation = donations.find(d => d.id === editingDonation);
    const paidAmountChanged = currentDonation && currentDonation.paid_amount !== editForm.paid_amount;

    const { error } = await supabase
      .from("home_donations")
      .update({
        assigned_amount: editForm.assigned_amount,
        paid_amount: editForm.paid_amount,
        notes: editForm.notes || null,
        // Update payment date if paid amount changed or if this is a new payment
        payment_date: editForm.paid_amount > 0 && paidAmountChanged ? new Date().toISOString() : currentDonation?.payment_date,
      })
      .eq("id", editingDonation);

    if (error) {
      toast({ title: "त्रुटी", description: "अपडेट करण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "देणगी माहिती अपडेट केली" });
      setEditingDonation(null);
      fetchDonations();
      updateYearlyIncome();
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

  const getNextHomeNumber = () => {
    if (homes.length === 0) return 1;
    return Math.max(...homes.map(h => h.home_number)) + 1;
  };

  const handleAddHome = async () => {
    if (!newHomeForm.home_name.trim()) {
      toast({ title: "त्रुटी", description: "घरमालकाचे नाव आवश्यक आहे", variant: "destructive" });
      return;
    }
    const nextNumber = getNextHomeNumber();
    const { error } = await supabase.from("homes").insert({
      home_number: nextNumber,
      home_name: newHomeForm.home_name.trim(),
      contact_phone: newHomeForm.contact_phone.trim() || null,
    });
    if (error) {
      toast({ title: "त्रुटी", description: "घर जोडण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: `घर क्र. ${nextNumber} जोडले` });
      setNewHomeForm({ home_name: "", contact_phone: "" });
      setIsAddingHome(false);
      fetchHomes();
    }
  };

  const handleDeleteHome = async (homeId: string, homeNumber: number) => {
    if (!confirm(`घर क्र. ${homeNumber} हटवायचे आहे का? संबंधित देणगी माहितीही हटवली जाईल.`)) return;
    // Delete donations first
    await supabase.from("home_donations").delete().eq("home_id", homeId);
    const { error } = await supabase.from("homes").delete().eq("id", homeId);
    if (error) {
      toast({ title: "त्रुटी", description: "घर हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: `घर क्र. ${homeNumber} हटवले` });
      // Renumber remaining homes sequentially
      await renumberHomes();
      fetchHomes();
    }
  };

  const renumberHomes = async () => {
    const { data: allHomes } = await supabase
      .from("homes")
      .select("id")
      .order("home_number", { ascending: true });
    
    if (allHomes) {
      for (let i = 0; i < allHomes.length; i++) {
        await supabase.from("homes").update({ home_number: i + 1 }).eq("id", allHomes[i].id);
      }
    }
  };

  const handleEditHomeName = (home: HomeData) => {
    setEditingHome(home.id);
    setHomeNameInput(home.home_name || "");
  };

  const handleSaveHomeName = async (homeId: string) => {
    const { error } = await supabase
      .from("homes")
      .update({ home_name: homeNameInput.trim() || null })
      .eq("id", homeId);

    if (error) {
      toast({ title: "त्रुटी", description: "नाव अपडेट करण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "घरमालकाचे नाव अपडेट केले" });
      setEditingHome(null);
      fetchHomes();
    }
  };

  const updateYearlyIncome = async () => {
    if (!yearlyAccount) return;
    
    // Recalculate from database
    const { data } = await supabase
      .from("home_donations")
      .select("paid_amount")
      .eq("year", selectedYear);
    
    const totalPaid = data?.reduce((sum, d) => sum + Number(d.paid_amount), 0) || 0;
    
    await supabase
      .from("yearly_accounts")
      .update({ total_income: totalPaid })
      .eq("id", yearlyAccount.id);
    
    fetchOrCreateYearlyAccount();
  };

  const handleAddExpense = async () => {
    if (!yearlyAccount || !expenseForm.item.trim()) {
      toast({ title: "त्रुटी", description: "खर्च तपशील आवश्यक आहे", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("account_expenses").insert({
      account_id: yearlyAccount.id,
      item: expenseForm.item,
      amount: expenseForm.amount,
    });

    if (error) {
      toast({ title: "त्रुटी", description: "खर्च जोडण्यात त्रुटी", variant: "destructive" });
    } else {
      const newTotal = (yearlyAccount.total_expense || 0) + expenseForm.amount;
      await supabase.from("yearly_accounts").update({ total_expense: newTotal }).eq("id", yearlyAccount.id);

      toast({ title: "यशस्वी", description: "खर्च जोडला" });
      setExpenseForm({ item: "", amount: 0 });
      setIsAddingExpense(false);
      fetchOrCreateYearlyAccount();
    }
  };

  const handleDeleteExpense = async (expenseId: string, amount: number) => {
    if (!yearlyAccount) return;

    const { error } = await supabase.from("account_expenses").delete().eq("id", expenseId);
    if (error) {
      toast({ title: "त्रुटी", description: "खर्च हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      const newTotal = Math.max(0, (yearlyAccount.total_expense || 0) - amount);
      await supabase.from("yearly_accounts").update({ total_expense: newTotal }).eq("id", yearlyAccount.id);

      toast({ title: "यशस्वी", description: "खर्च हटवला" });
      fetchOrCreateYearlyAccount();
    }
  };

  const toggleAccountVisibility = async () => {
    if (!yearlyAccount) return;
    
    const newVisibility = !yearlyAccount.is_visible;
    const { error } = await supabase
      .from("yearly_accounts")
      .update({ is_visible: newVisibility })
      .eq("id", yearlyAccount.id);

    if (error) {
      toast({ title: "त्रुटी", description: "दृश्यता अपडेट करण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ 
        title: "यशस्वी", 
        description: newVisibility ? "खाते माहिती आता सार्वजनिक आहे" : "खाते माहिती आता लपलेली आहे" 
      });
      fetchOrCreateYearlyAccount();
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
  const totalExpense = yearlyAccount?.total_expense || 0;
  const remainingBalance = totalPaid - totalExpense;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mr-IN", { style: "currency", currency: "INR" }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("mr-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  // Open printable HTML report for donations
  const openDonationReport = () => {
    const donationRows = donations
      .filter(d => d.paid_amount > 0)
      .map(d => {
        const home = homes.find(h => h.id === d.home_id);
        return {
          name: home?.home_name || `घर क्र. ${home?.home_number}`,
          amount: d.paid_amount,
          date: d.payment_date
        };
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>जमा अहवाल - ${selectedYear}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 30px; background: #fff; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #1e3a5f; margin-bottom: 5px; }
          .header p { font-size: 14px; color: #666; }
          .org-name { font-size: 18px; color: #1e3a5f; font-weight: 600; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #1e3a5f; color: white; padding: 12px 15px; text-align: left; font-weight: 600; }
          td { padding: 10px 15px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .amount { text-align: right; font-weight: 500; }
          .total-row { background: #e8f4e8 !important; font-weight: 700; font-size: 16px; }
          .total-row td { border-top: 2px solid #1e3a5f; padding: 15px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</div>
          <h1>जमा अहवाल (देणगी)</h1>
          <p>वर्ष: ${selectedYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">क्र.</th>
              <th>घरमालकाचे नाव</th>
              <th style="width: 140px;">तारीख</th>
              <th style="width: 140px; text-align: right;">रक्कम</th>
            </tr>
          </thead>
          <tbody>
            ${donationRows.map((row, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${row.name}</td>
                <td>${formatDate(row.date)}</td>
                <td class="amount">${formatCurrency(row.amount)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">एकूण जमा:</td>
              <td class="amount">${formatCurrency(totalPaid)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>हा अहवाल ${new Date().toLocaleDateString("mr-IN")} रोजी तयार केला</p>
          <p style="margin-top: 5px;">Ctrl+P दाबून PDF म्हणून सेव्ह करा</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  };

  // Open printable HTML report for expenses
  const openExpenseReport = () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>खर्च अहवाल - ${selectedYear}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 30px; background: #fff; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #c0392b; padding-bottom: 20px; }
          .header h1 { font-size: 24px; color: #c0392b; margin-bottom: 5px; }
          .header p { font-size: 14px; color: #666; }
          .org-name { font-size: 18px; color: #1e3a5f; font-weight: 600; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #c0392b; color: white; padding: 12px 15px; text-align: left; font-weight: 600; }
          td { padding: 10px 15px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .amount { text-align: right; font-weight: 500; }
          .total-row { background: #fdecea !important; font-weight: 700; font-size: 16px; }
          .total-row td { border-top: 2px solid #c0392b; padding: 15px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #888; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</div>
          <h1>खर्च अहवाल</h1>
          <p>वर्ष: ${selectedYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 60px;">क्र.</th>
              <th>बाब (तपशील)</th>
              <th style="width: 160px; text-align: right;">रक्कम</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((expense, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${expense.item}</td>
                <td class="amount">${formatCurrency(expense.amount)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">एकूण खर्च:</td>
              <td class="amount">${formatCurrency(totalExpense)}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          <p>हा अहवाल ${new Date().toLocaleDateString("mr-IN")} रोजी तयार केला</p>
          <p style="margin-top: 5px;">Ctrl+P दाबून PDF म्हणून सेव्ह करा</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  };

  // Open combined summary report
  const openSummaryReport = () => {
    const donationRows = donations
      .filter(d => d.paid_amount > 0)
      .map(d => {
        const home = homes.find(h => h.id === d.home_id);
        return {
          name: home?.home_name || `घर क्र. ${home?.home_number}`,
          amount: d.paid_amount,
          date: d.payment_date
        };
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>संपूर्ण खाते अहवाल - ${selectedYear}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Noto Sans Devanagari', sans-serif; padding: 30px; background: #fff; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; }
          .header h1 { font-size: 26px; color: #1e3a5f; margin-bottom: 5px; }
          .header p { font-size: 14px; color: #666; }
          .org-name { font-size: 20px; color: #1e3a5f; font-weight: 700; margin-bottom: 10px; }
          .section { margin-bottom: 35px; }
          .section-title { font-size: 18px; font-weight: 600; color: #1e3a5f; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #1e3a5f; }
          .section-title.expense { color: #c0392b; border-color: #c0392b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background: #1e3a5f; color: white; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 13px; }
          th.expense-header { background: #c0392b; }
          td { padding: 8px 12px; border-bottom: 1px solid #ddd; font-size: 13px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .amount { text-align: right; font-weight: 500; }
          .total-row { font-weight: 700; font-size: 14px; }
          .total-row.income { background: #e8f4e8 !important; }
          .total-row.expense { background: #fdecea !important; }
          .total-row td { border-top: 2px solid #333; padding: 12px; }
          .summary-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .summary-box h3 { font-size: 18px; color: #1e3a5f; margin-bottom: 15px; text-align: center; }
          .summary-grid { display: flex; justify-content: space-around; text-align: center; }
          .summary-item { padding: 10px 20px; }
          .summary-item .label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .summary-item .value { font-size: 22px; font-weight: 700; }
          .summary-item .value.income { color: #27ae60; }
          .summary-item .value.expense { color: #c0392b; }
          .summary-item .value.balance { color: #1e3a5f; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #888; }
          @media print { body { padding: 20px; } .summary-box { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="org-name">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर</div>
          <h1>संपूर्ण खाते अहवाल</h1>
          <p>वर्ष: ${selectedYear}</p>
        </div>
        
        <div class="section">
          <div class="section-title">जमा तपशील (देणगी)</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">क्र.</th>
                <th>घरमालकाचे नाव</th>
                <th style="width: 120px;">तारीख</th>
                <th style="width: 120px; text-align: right;">रक्कम</th>
              </tr>
            </thead>
            <tbody>
              ${donationRows.map((row, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${row.name}</td>
                  <td>${formatDate(row.date)}</td>
                  <td class="amount">${formatCurrency(row.amount)}</td>
                </tr>
              `).join('')}
              <tr class="total-row income">
                <td colspan="3" style="text-align: right;">एकूण जमा:</td>
                <td class="amount">${formatCurrency(totalPaid)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title expense">खर्च तपशील</div>
          <table>
            <thead>
              <tr>
                <th class="expense-header" style="width: 50px;">क्र.</th>
                <th class="expense-header">बाब (तपशील)</th>
                <th class="expense-header" style="width: 140px; text-align: right;">रक्कम</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.length > 0 ? expenses.map((expense, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${expense.item}</td>
                  <td class="amount">${formatCurrency(expense.amount)}</td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align: center; color: #888;">कोणताही खर्च नोंदवलेला नाही</td></tr>'}
              <tr class="total-row expense">
                <td colspan="2" style="text-align: right;">एकूण खर्च:</td>
                <td class="amount">${formatCurrency(totalExpense)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="summary-box">
          <h3>सारांश</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="label">एकूण जमा</div>
              <div class="value income">${formatCurrency(totalPaid)}</div>
            </div>
            <div class="summary-item">
              <div class="label">एकूण खर्च</div>
              <div class="value expense">${formatCurrency(totalExpense)}</div>
            </div>
            <div class="summary-item">
              <div class="label">शिल्लक रक्कम</div>
              <div class="value balance">${formatCurrency(remainingBalance)}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>हा अहवाल ${new Date().toLocaleDateString("mr-IN")} रोजी तयार केला</p>
          <p style="margin-top: 5px;">Ctrl+P दाबून PDF म्हणून सेव्ह करा</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-6">
      {/* === Summary: horizontal scroll on mobile, grid on desktop === */}
      <div className="-mx-3 sm:mx-0">
        <div className="flex gap-3 overflow-x-auto px-3 pb-1 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible sm:px-0 snap-x snap-mandatory">
          {[
            { icon: Home, label: "एकूण घरे", value: homes.length.toString(), color: "text-muted-foreground", bg: "" },
            { icon: IndianRupee, label: "नियुक्त", value: `₹${totalAssigned.toLocaleString()}`, color: "text-blue-600", bg: "" },
            { icon: TrendingUp, label: "जमा", value: `₹${totalPaid.toLocaleString()}`, color: "text-green-600", bg: "" },
            { icon: TrendingDown, label: "खर्च", value: `₹${totalExpense.toLocaleString()}`, color: "text-red-600", bg: "" },
            { icon: Wallet, label: "शिल्लक", value: `₹${remainingBalance.toLocaleString()}`, color: remainingBalance >= 0 ? "text-primary" : "text-destructive", bg: "bg-primary/10 border-primary/20" },
          ].map((s, i) => (
            <Card key={i} className={`min-w-[44vw] sm:min-w-0 snap-start ${s.bg}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color} shrink-0`} />
                  <div className="min-w-0">
                    <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                    <p className={`text-sm sm:text-lg font-bold truncate ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* === Visibility + Reports bar === */}
      <Card className={yearlyAccount?.is_visible ? "border-green-500/60" : "border-orange-500/60"}>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {yearlyAccount?.is_visible ? <Eye className="h-4 w-4 text-green-600 shrink-0" /> : <EyeOff className="h-4 w-4 text-orange-600 shrink-0" />}
              <p className="text-xs sm:text-sm font-medium truncate">
                {yearlyAccount?.is_visible ? "सार्वजनिक" : "लपलेले"}
              </p>
            </div>
            <Switch checked={yearlyAccount?.is_visible || false} onCheckedChange={toggleAccountVisibility} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={openSummaryReport} className="gap-1 text-xs h-9 px-2">
              <FileSpreadsheet className="h-3.5 w-3.5" /> सर्व
            </Button>
            <Button variant="outline" size="sm" onClick={openDonationReport} className="gap-1 text-xs h-9 px-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-3.5 w-3.5" /> जमा
            </Button>
            <Button variant="outline" size="sm" onClick={openExpenseReport} className="gap-1 text-xs h-9 px-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-3.5 w-3.5" /> खर्च
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* === Year selector === */}
      <div className="flex items-center gap-2">
        <Label className="text-sm shrink-0">वर्ष:</Label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="h-9 flex-1 sm:w-40 sm:flex-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* === Tabs: जमा / खर्च === */}
      <Tabs defaultValue="donations" className="w-full">
        <TabsList className="grid grid-cols-2 w-full h-11 sticky top-0 z-10 bg-background/95 backdrop-blur">
          <TabsTrigger value="donations" className="gap-2 text-sm">
            <TrendingUp className="h-4 w-4" /> जमा ({homes.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2 text-sm">
            <TrendingDown className="h-4 w-4" /> खर्च ({expenses.length})
          </TabsTrigger>
        </TabsList>

        {/* ---------- DONATIONS TAB ---------- */}
        <TabsContent value="donations" className="space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative col-span-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="घरमालक शोधा..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-10"
              />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="h-10">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">सर्व</SelectItem>
                <SelectItem value="paid">दिले</SelectItem>
                <SelectItem value="partial">अंशतः</SelectItem>
                <SelectItem value="pending">बाकी</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddingHome(true)} disabled={isAddingHome} className="h-10 gap-1">
              <Plus className="h-4 w-4" /> घर जोडा
            </Button>
          </div>

          <div className="flex gap-2 items-center p-3 rounded-lg bg-secondary/50 border">
            <Input
              type="number"
              placeholder="सर्वांना नियुक्त रक्कम ₹"
              value={bulkAssignAmount}
              onChange={(e) => setBulkAssignAmount(e.target.value)}
              className="h-9 flex-1"
            />
            <Button size="sm" onClick={handleBulkAssign} className="h-9 shrink-0">नियुक्त</Button>
          </div>

          {isAddingHome && (
            <Card className="border-primary/40">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium">नवीन घर (क्र. {getNextHomeNumber()})</p>
                <Input value={newHomeForm.home_name} onChange={(e) => setNewHomeForm({ ...newHomeForm, home_name: e.target.value })} placeholder="घरमालकाचे नाव *" className="h-9" />
                <Input value={newHomeForm.contact_phone} onChange={(e) => setNewHomeForm({ ...newHomeForm, contact_phone: e.target.value })} placeholder="फोन (ऐच्छिक)" className="h-9" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddHome} className="flex-1">जोडा</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsAddingHome(false); setNewHomeForm({ home_name: "", contact_phone: "" }); }} className="flex-1">रद्द</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">क्र.</TableHead>
                  <TableHead>घरमालक</TableHead>
                  <TableHead>संपर्क</TableHead>
                  <TableHead className="text-right">नियुक्त</TableHead>
                  <TableHead className="text-right">दिले</TableHead>
                  <TableHead className="text-right">बाकी</TableHead>
                  <TableHead>तारीख</TableHead>
                  <TableHead>स्थिती</TableHead>
                  <TableHead>क्रिया</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHomes.map((home) => {
                  const donation = getDonationForHome(home.id);
                  const status = getPaymentStatus(donation);
                  const remaining = donation ? donation.assigned_amount - donation.paid_amount : 0;
                  const isEditing = editingDonation === donation?.id;
                  const isEditingName = editingHome === home.id;
                  return (
                    <TableRow key={home.id}>
                      <TableCell className="font-medium">{home.home_number}</TableCell>
                      <TableCell>
                        {isEditingName ? (
                          <div className="flex gap-1">
                            <Input value={homeNameInput} onChange={(e) => setHomeNameInput(e.target.value)} className="w-40 h-8" />
                            <Button size="sm" variant="ghost" onClick={() => handleSaveHomeName(home.id)}><Save className="h-4 w-4" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingHome(null)}><X className="h-4 w-4" /></Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={home.home_name ? "" : "text-muted-foreground italic"}>{home.home_name || "नाव नाही"}</span>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleEditHomeName(home)}><Edit2 className="h-3 w-3" /></Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{home.contact_phone || "-"}</span></TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input type="number" value={editForm.assigned_amount} onChange={(e) => setEditForm({ ...editForm, assigned_amount: parseFloat(e.target.value) || 0 })} className="w-24" />
                        ) : <span>₹{donation?.assigned_amount?.toLocaleString() || 0}</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <Input type="number" value={editForm.paid_amount} onChange={(e) => setEditForm({ ...editForm, paid_amount: parseFloat(e.target.value) || 0 })} className="w-24" />
                        ) : <span className="text-green-600">₹{donation?.paid_amount?.toLocaleString() || 0}</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        {remaining > 0 ? <span className="text-red-600 font-medium">₹{remaining.toLocaleString()}</span> : <span className="text-green-600">₹0</span>}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{donation?.payment_date ? formatDate(donation.payment_date) : "-"}</TableCell>
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
                              <Button size="sm" onClick={handleSaveDonation}><Save className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingDonation(null)}><X className="h-4 w-4" /></Button>
                            </div>
                          ) : <Button size="sm" variant="ghost" onClick={() => handleEditStart(donation)}><Edit2 className="h-4 w-4" /></Button>
                        ) : <Button size="sm" variant="outline" onClick={() => handleCreateDonation(home.id)}>नियुक्त</Button>}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteHome(home.id, home.home_number)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {filteredHomes.length === 0 && (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">कोणतेही घर सापडले नाही</CardContent></Card>
            )}
            {filteredHomes.map((home) => {
              const donation = getDonationForHome(home.id);
              const status = getPaymentStatus(donation);
              const remaining = donation ? donation.assigned_amount - donation.paid_amount : 0;
              const isEditing = editingDonation === donation?.id;
              const isEditingName = editingHome === home.id;
              const statusColor =
                status === "paid" ? "border-l-green-500" :
                status === "partial" ? "border-l-yellow-500" :
                status === "pending" ? "border-l-red-500" : "border-l-muted";
              return (
                <Card key={home.id} className={`border-l-4 ${statusColor}`}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {home.home_number}
                        </span>
                        {isEditingName ? (
                          <Input value={homeNameInput} onChange={(e) => setHomeNameInput(e.target.value)} className="h-8 text-sm" autoFocus />
                        ) : (
                          <p className={`text-sm font-medium truncate ${!home.home_name ? "text-muted-foreground italic" : ""}`}>
                            {home.home_name || "नाव नाही"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isEditingName ? (
                          <>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveHomeName(home.id)}><Save className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingHome(null)}><X className="h-3.5 w-3.5" /></Button>
                          </>
                        ) : (
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditHomeName(home)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDeleteHome(home.id, home.home_number)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {home.contact_phone || "-"}
                      </span>
                      {status === "paid" && <Badge className="bg-green-500 h-5 text-[10px]">पूर्ण</Badge>}
                      {status === "partial" && <Badge className="bg-yellow-500 h-5 text-[10px]">अंशतः</Badge>}
                      {status === "pending" && <Badge variant="destructive" className="h-5 text-[10px]">बाकी</Badge>}
                      {status === "none" && <Badge variant="outline" className="h-5 text-[10px]">नियुक्त नाही</Badge>}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[10px] text-muted-foreground">नियुक्त ₹</Label>
                            <Input type="number" value={editForm.assigned_amount} onChange={(e) => setEditForm({ ...editForm, assigned_amount: parseFloat(e.target.value) || 0 })} className="h-9" />
                          </div>
                          <div>
                            <Label className="text-[10px] text-muted-foreground">दिले ₹</Label>
                            <Input type="number" value={editForm.paid_amount} onChange={(e) => setEditForm({ ...editForm, paid_amount: parseFloat(e.target.value) || 0 })} className="h-9" />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveDonation} className="flex-1 h-9"><Save className="h-3.5 w-3.5 mr-1" /> जतन</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingDonation(null)} className="flex-1 h-9"><X className="h-3.5 w-3.5 mr-1" /> रद्द</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="rounded-md bg-muted/50 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">नियुक्त</p>
                            <p className="text-xs font-semibold">₹{donation?.assigned_amount?.toLocaleString() || 0}</p>
                          </div>
                          <div className="rounded-md bg-green-500/10 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">दिले</p>
                            <p className="text-xs font-semibold text-green-600">₹{donation?.paid_amount?.toLocaleString() || 0}</p>
                          </div>
                          <div className={`rounded-md p-2 text-center ${remaining > 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                            <p className="text-[10px] text-muted-foreground">बाकी</p>
                            <p className={`text-xs font-semibold ${remaining > 0 ? "text-red-600" : "text-green-600"}`}>₹{remaining.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {donation?.payment_date ? formatDate(donation.payment_date) : "—"}
                          </span>
                          {donation ? (
                            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleEditStart(donation)}>
                              <Edit2 className="h-3 w-3 mr-1" /> संपादन
                            </Button>
                          ) : (
                            <Button size="sm" className="h-8 text-xs" onClick={() => handleCreateDonation(home.id)}>नियुक्त करा</Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ---------- EXPENSES TAB ---------- */}
        <TabsContent value="expenses" className="space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border bg-green-500/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">जमा</p>
              <p className="text-xs sm:text-sm font-bold text-green-600 truncate">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="rounded-lg border bg-red-500/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">खर्च</p>
              <p className="text-xs sm:text-sm font-bold text-red-600 truncate">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="rounded-lg border bg-primary/5 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">शिल्लक</p>
              <p className={`text-xs sm:text-sm font-bold truncate ${remainingBalance >= 0 ? "text-primary" : "text-destructive"}`}>{formatCurrency(remainingBalance)}</p>
            </div>
          </div>

          <Button onClick={() => setIsAddingExpense(true)} disabled={isAddingExpense} className="w-full h-10 gap-1">
            <Plus className="h-4 w-4" /> नवीन खर्च जोडा
          </Button>

          {isAddingExpense && (
            <Card className="border-primary/40">
              <CardContent className="p-3 space-y-2">
                <div>
                  <Label className="text-xs">तपशील</Label>
                  <Input value={expenseForm.item} onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })} placeholder="खर्चाचे तपशील" className="h-9" />
                </div>
                <div>
                  <Label className="text-xs">रक्कम ₹</Label>
                  <Input type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} className="h-9" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddExpense} className="flex-1"><Save className="h-3.5 w-3.5 mr-1" /> जतन</Button>
                  <Button size="sm" variant="outline" onClick={() => { setIsAddingExpense(false); setExpenseForm({ item: "", amount: 0 }); }} className="flex-1"><X className="h-3.5 w-3.5 mr-1" /> रद्द</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {expenses.length === 0 && (
              <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">कोणताही खर्च नोंदवलेला नाही</CardContent></Card>
            )}
            {expenses.map((expense, idx) => (
              <Card key={expense.id} className="border-l-4 border-l-red-500/60">
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500/10 text-red-600 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{expense.item}</p>
                    <p className="text-base font-bold text-red-600">{formatCurrency(expense.amount)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDeleteExpense(expense.id, expense.amount)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DonationManagement;
