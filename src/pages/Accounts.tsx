import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Wallet, TrendingUp, TrendingDown, Eye, Calendar, FileText, Loader2, User, IndianRupee } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface HomeData {
  id: string;
  home_number: number;
  home_name: string | null;
}

interface DonationData {
  id: string;
  home_id: string;
  year: string;
  assigned_amount: number;
  paid_amount: number;
  payment_date: string | null;
}

const Accounts = () => {
  const [accounts, setAccounts] = useState<YearlyAccount[]>([]);
  const [expensesByAccount, setExpensesByAccount] = useState<Record<string, AccountExpense[]>>({});
  const [homesByYear, setHomesByYear] = useState<Record<string, { home: HomeData; donation: DonationData }[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccountsData();
  }, []);

  const fetchAccountsData = async () => {
    setIsLoading(true);
    
    // Fetch visible yearly accounts
    const { data: accountsData, error: accountsError } = await supabase
      .from("yearly_accounts")
      .select("*")
      .eq("is_visible", true)
      .order("year", { ascending: false });

    if (accountsError) {
      console.error("Error fetching accounts:", accountsError);
      setIsLoading(false);
      return;
    }

    setAccounts(accountsData || []);

    // Fetch expenses for all visible accounts
    if (accountsData && accountsData.length > 0) {
      const accountIds = accountsData.map(a => a.id);
      const years = accountsData.map(a => a.year);

      const { data: expensesData, error: expensesError } = await supabase
        .from("account_expenses")
        .select("*")
        .in("account_id", accountIds);

      if (!expensesError && expensesData) {
        const grouped = expensesData.reduce((acc, expense) => {
          if (!acc[expense.account_id]) {
            acc[expense.account_id] = [];
          }
          acc[expense.account_id].push(expense);
          return acc;
        }, {} as Record<string, AccountExpense[]>);
        setExpensesByAccount(grouped);
      }

      // Fetch homes
      const { data: homesData } = await supabase
        .from("homes")
        .select("id, home_number, home_name")
        .order("home_number", { ascending: true });

      // Fetch donations for visible years
      const { data: donationsData } = await supabase
        .from("home_donations")
        .select("*")
        .in("year", years);

      if (homesData && donationsData) {
        const groupedByYear: Record<string, { home: HomeData; donation: DonationData }[]> = {};
        
        years.forEach(year => {
          groupedByYear[year] = [];
          const yearDonations = donationsData.filter(d => d.year === year);
          
          yearDonations.forEach(donation => {
            const home = homesData.find(h => h.id === donation.home_id);
            if (home) {
              groupedByYear[year].push({ home, donation });
            }
          });
          
          // Sort by payment date descending
          groupedByYear[year].sort((a, b) => {
            const dateA = a.donation.payment_date ? new Date(a.donation.payment_date).getTime() : 0;
            const dateB = b.donation.payment_date ? new Date(b.donation.payment_date).getTime() : 0;
            return dateB - dateA;
          });
        });
        
        setHomesByYear(groupedByYear);
      }
    }

    setIsLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mr-IN", { 
      style: "currency", 
      currency: "INR",
      maximumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("mr-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 right-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              खाते माहिती
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              पारदर्शक व्यवहार • प्रत्येक रुपयाचा हिशोब
            </p>
          </motion.div>
        </div>
      </section>

      {/* Transparency Banner */}
      <section className="py-8 bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4 text-center">
            <Eye className="text-accent" size={24} />
            <p className="text-foreground">
              <span className="font-semibold">१००% पारदर्शकता:</span> संपूर्ण खाते माहिती सार्वजनिक आहे
            </p>
          </div>
        </div>
      </section>

      {/* Yearly Reports */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              वार्षिक अहवाल
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              वर्षनिहाय खाते माहिती
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : accounts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-8 border border-border text-center"
            >
              <Wallet className="mx-auto mb-6 text-accent" size={64} />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                सध्या कोणतीही खाते माहिती उपलब्ध नाही
              </h2>
              <p className="text-muted-foreground">
                प्रशासकाने खाते माहिती प्रकाशित केल्यावर ती येथे दिसेल.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {accounts.map((account, index) => {
                const expenses = expensesByAccount[account.id] || [];
                const donations = homesByYear[account.year] || [];
                const totalIncome = account.total_income || 0;
                const totalExpense = account.total_expense || 0;
                const balance = totalIncome - totalExpense;
                const currentYear = new Date().getFullYear().toString();
                const isCurrentYear = account.year === currentYear;

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-card rounded-xl border border-border overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-primary p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Calendar className="text-primary-foreground" size={24} />
                        <h3 className="text-2xl font-bold text-primary-foreground">
                          वर्ष {account.year}
                        </h3>
                      </div>
                      {isCurrentYear && (
                        <span className="px-3 py-1 bg-accent text-accent-foreground text-sm font-semibold rounded-full">
                          चालू वर्ष
                        </span>
                      )}
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <TrendingUp className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">एकूण जमा</p>
                          <p className="text-xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                        </div>
                      </div>

                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                          <TrendingDown className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">एकूण खर्च</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                          <Wallet className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">शिल्लक</p>
                          <p className={`text-xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                            {formatCurrency(balance)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Donations Details */}
                    {donations.length > 0 && (
                      <div className="px-6 pb-6">
                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <User size={18} className="text-green-500" />
                          जमा तपशील ({donations.length} घरे)
                        </h4>
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>घरमालकाचे नाव</TableHead>
                                <TableHead className="text-right">नियुक्त</TableHead>
                                <TableHead className="text-right">दिलेली रक्कम</TableHead>
                                <TableHead className="text-right">बाकी</TableHead>
                                <TableHead>तारीख</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {donations.map(({ home, donation }) => {
                                const remaining = donation.assigned_amount > donation.paid_amount 
                                  ? donation.assigned_amount - donation.paid_amount 
                                  : 0;
                                return (
                                  <TableRow key={donation.id}>
                                    <TableCell className="font-medium">
                                      {home.home_name || `घर क्र. ${home.home_number}`}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">
                                      {formatCurrency(donation.assigned_amount || 0)}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">
                                      {formatCurrency(donation.paid_amount)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {remaining > 0 ? (
                                        <span className="text-red-600 font-medium">{formatCurrency(remaining)}</span>
                                      ) : (
                                        <span className="text-green-600">₹0</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                      {formatDate(donation.payment_date)}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Expense Details */}
                    {expenses.length > 0 && (
                      <div className="px-6 pb-6">
                        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <FileText size={18} className="text-red-500" />
                          खर्चाचा तपशील
                        </h4>
                        <div className="bg-secondary rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>बाब</TableHead>
                                <TableHead className="text-right">रक्कम</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                  <TableCell>{expense.item}</TableCell>
                                  <TableCell className="text-right text-red-600 font-medium">
                                    {formatCurrency(expense.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trust Statement */}
      <section className="py-16 hero-gradient">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Wallet className="mx-auto text-accent" size={48} />
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground">
              विश्वासार्हता • पारदर्शकता • उत्तरदायित्व
            </h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              आम्ही प्रत्येक रुपयाचा हिशोब ठेवतो आणि तो सार्वजनिक करतो. 
              कोणताही खर्च गुप्त नाही. हे आमच्या चळवळीचे वैशिष्ट्य आहे.
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Accounts;
