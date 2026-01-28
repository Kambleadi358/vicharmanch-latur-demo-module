import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Save, X, Eye, EyeOff, ChevronDown, ChevronRight, IndianRupee } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface YearlyAccount {
  id: string;
  year: string;
  total_income: number | null;
  total_expense: number | null;
  is_visible: boolean | null;
}

interface AccountExpense {
  id: string;
  account_id: string;
  item: string;
  amount: number;
}

const AccountsManagement = () => {
  const [accounts, setAccounts] = useState<YearlyAccount[]>([]);
  const [expenses, setExpenses] = useState<Record<string, AccountExpense[]>>({});
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountForm, setAccountForm] = useState({
    year: new Date().getFullYear().toString(),
    total_income: 0,
    is_visible: false,
  });
  const [expenseForm, setExpenseForm] = useState({
    item: "",
    amount: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase.from("yearly_accounts").select("*").order("year", { ascending: false });
    if (error) {
      toast({ title: "त्रुटी", description: "खाते लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setAccounts(data || []);
    }
  };

  const fetchExpenses = async (accountId: string) => {
    const { data, error } = await supabase.from("account_expenses").select("*").eq("account_id", accountId);
    if (error) {
      toast({ title: "त्रुटी", description: "खर्च लोड करण्यात त्रुटी", variant: "destructive" });
    } else {
      setExpenses((prev) => ({ ...prev, [accountId]: data || [] }));
    }
  };

  const handleExpandAccount = (accountId: string) => {
    if (expandedAccount === accountId) {
      setExpandedAccount(null);
    } else {
      setExpandedAccount(accountId);
      if (!expenses[accountId]) {
        fetchExpenses(accountId);
      }
    }
  };

  const handleSaveAccount = async () => {
    if (editingAccountId) {
      const { error } = await supabase
        .from("yearly_accounts")
        .update({ year: accountForm.year, total_income: accountForm.total_income, is_visible: accountForm.is_visible })
        .eq("id", editingAccountId);
      if (error) {
        toast({ title: "त्रुटी", description: "खाते अपडेट करण्यात त्रुटी", variant: "destructive" });
      } else {
        toast({ title: "यशस्वी", description: "खाते अपडेट केले" });
        resetAccountForm();
        fetchAccounts();
      }
    } else {
      const { error } = await supabase
        .from("yearly_accounts")
        .insert([{ year: accountForm.year, total_income: accountForm.total_income, total_expense: 0, is_visible: accountForm.is_visible }]);
      if (error) {
        toast({ title: "त्रुटी", description: "खाते जोडण्यात त्रुटी", variant: "destructive" });
      } else {
        toast({ title: "यशस्वी", description: "खाते जोडले" });
        resetAccountForm();
        fetchAccounts();
      }
    }
  };

  const resetAccountForm = () => {
    setAccountForm({ year: new Date().getFullYear().toString(), total_income: 0, is_visible: false });
    setIsAddingAccount(false);
    setEditingAccountId(null);
  };

  const handleEditAccount = (account: YearlyAccount) => {
    setAccountForm({
      year: account.year,
      total_income: account.total_income || 0,
      is_visible: account.is_visible ?? false,
    });
    setEditingAccountId(account.id);
    setIsAddingAccount(true);
  };

  const handleDeleteAccount = async (id: string) => {
    const { error } = await supabase.from("yearly_accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: "खाते हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      toast({ title: "यशस्वी", description: "खाते हटवले" });
      fetchAccounts();
    }
  };

  const handleAddExpense = async (accountId: string) => {
    if (!expenseForm.item.trim()) {
      toast({ title: "त्रुटी", description: "खर्च तपशील आवश्यक आहे", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("account_expenses").insert([{ account_id: accountId, item: expenseForm.item, amount: expenseForm.amount }]);
    if (error) {
      toast({ title: "त्रुटी", description: "खर्च जोडण्यात त्रुटी", variant: "destructive" });
    } else {
      // Update total_expense in yearly_accounts
      const account = accounts.find((a) => a.id === accountId);
      const newTotal = (account?.total_expense || 0) + expenseForm.amount;
      await supabase.from("yearly_accounts").update({ total_expense: newTotal }).eq("id", accountId);

      toast({ title: "यशस्वी", description: "खर्च जोडला" });
      setExpenseForm({ item: "", amount: 0 });
      setIsAddingExpense(null);
      fetchExpenses(accountId);
      fetchAccounts();
    }
  };

  const handleDeleteExpense = async (expenseId: string, accountId: string, amount: number) => {
    const { error } = await supabase.from("account_expenses").delete().eq("id", expenseId);
    if (error) {
      toast({ title: "त्रुटी", description: "खर्च हटवण्यात त्रुटी", variant: "destructive" });
    } else {
      // Update total_expense in yearly_accounts
      const account = accounts.find((a) => a.id === accountId);
      const newTotal = Math.max(0, (account?.total_expense || 0) - amount);
      await supabase.from("yearly_accounts").update({ total_expense: newTotal }).eq("id", accountId);

      toast({ title: "यशस्वी", description: "खर्च हटवला" });
      fetchExpenses(accountId);
      fetchAccounts();
    }
  };

  const toggleVisibility = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("yearly_accounts").update({ is_visible: !currentStatus }).eq("id", id);
    if (error) {
      toast({ title: "त्रुटी", description: "दृश्यता बदलण्यात त्रुटी", variant: "destructive" });
    } else {
      fetchAccounts();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mr-IN", { style: "currency", currency: "INR" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">वार्षिक खाते व्यवस्थापन</h3>
        <Button onClick={() => setIsAddingAccount(true)} disabled={isAddingAccount}>
          <Plus className="h-4 w-4 mr-2" /> नवीन वर्ष
        </Button>
      </div>

      {isAddingAccount && (
        <Card>
          <CardHeader>
            <CardTitle>{editingAccountId ? "खाते संपादित करा" : "नवीन वर्षाचे खाते"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>वर्ष</Label>
                <Input value={accountForm.year} onChange={(e) => setAccountForm({ ...accountForm, year: e.target.value })} placeholder="2024-25" />
              </div>
              <div className="space-y-2">
                <Label>एकूण जमा</Label>
                <Input
                  type="number"
                  value={accountForm.total_income}
                  onChange={(e) => setAccountForm({ ...accountForm, total_income: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={accountForm.is_visible} onCheckedChange={(checked) => setAccountForm({ ...accountForm, is_visible: checked })} />
              <Label>सार्वजनिकरित्या दृश्यमान</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveAccount}>
                <Save className="h-4 w-4 mr-2" /> जतन करा
              </Button>
              <Button variant="outline" onClick={resetAccountForm}>
                <X className="h-4 w-4 mr-2" /> रद्द करा
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {accounts.map((account) => (
          <Collapsible key={account.id} open={expandedAccount === account.id} onOpenChange={() => handleExpandAccount(account.id)}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedAccount === account.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      <div>
                        <CardTitle className="text-lg">{account.year}</CardTitle>
                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                          <span className="text-green-600">जमा: {formatCurrency(account.total_income || 0)}</span>
                          <span className="text-red-600">खर्च: {formatCurrency(account.total_expense || 0)}</span>
                          <span className="text-primary">
                            शिल्लक: {formatCurrency((account.total_income || 0) - (account.total_expense || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleVisibility(account.id, account.is_visible ?? false); }}>
                        {account.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEditAccount(account); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">खर्च तपशील</h4>
                      <Button size="sm" onClick={() => setIsAddingExpense(account.id)} disabled={isAddingExpense === account.id}>
                        <Plus className="h-4 w-4 mr-1" /> खर्च जोडा
                      </Button>
                    </div>

                    {isAddingExpense === account.id && (
                      <div className="flex gap-2 items-end p-3 bg-muted rounded-lg">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">तपशील</Label>
                          <Input
                            value={expenseForm.item}
                            onChange={(e) => setExpenseForm({ ...expenseForm, item: e.target.value })}
                            placeholder="खर्चाचे तपशील"
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-xs">रक्कम</Label>
                          <Input
                            type="number"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <Button size="sm" onClick={() => handleAddExpense(account.id)}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setIsAddingExpense(null); setExpenseForm({ item: "", amount: 0 }); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>तपशील</TableHead>
                          <TableHead className="text-right">रक्कम</TableHead>
                          <TableHead className="w-16">क्रिया</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenses[account.id]?.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{expense.item}</TableCell>
                            <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteExpense(expense.id, account.id, expense.amount)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!expenses[account.id] || expenses[account.id].length === 0) && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                              कोणताही खर्च नोंदवलेला नाही
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
};

export default AccountsManagement;
