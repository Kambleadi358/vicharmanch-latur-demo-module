import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Download, AlertTriangle } from "lucide-react";
import JSZip from "jszip";

const LOCK_PASSWORD = "vicharmanch@2026";

const YearLockManager = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear] = useState(currentYear.toString());
  const [password, setPassword] = useState("");
  const [remark, setRemark] = useState("");
  const [isLocking, setIsLocking] = useState(false);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString('mr-IN', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "₹0";
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const generateReadableReport = (data: {
    programs: any[];
    winners: any[];
    quizResponses: any[];
    donations: any[];
    expenses: any[];
    notices: any[];
    accounts: any[];
    homes: any[];
  }, year: string, remark: string) => {
    const lines: string[] = [];
    const separator = "═".repeat(60);
    const thinSeparator = "─".repeat(60);

    // Header
    lines.push(separator);
    lines.push("");
    lines.push("        भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर - वार्षिक अहवाल " + year);
    lines.push("        (Year Lock Archive Report)");
    lines.push("");
    lines.push(separator);
    lines.push("");
    lines.push(`📅 अहवाल तारीख: ${formatDate(new Date().toISOString())}`);
    lines.push(`📝 टिप्पणी: ${remark}`);
    lines.push("");
    lines.push(thinSeparator);

    // Programs Section
    lines.push("");
    lines.push("📋 कार्यक्रम (Programs)");
    lines.push(thinSeparator);
    if (data.programs.length === 0) {
      lines.push("  कोणतेही कार्यक्रम नोंदवले नाहीत.");
    } else {
      data.programs.forEach((program, index) => {
        lines.push("");
        lines.push(`  ${index + 1}. ${program.name}`);
        lines.push(`     📍 ठिकाण: ${program.location || "—"}`);
        lines.push(`     📅 तारीख: ${program.date}`);
        lines.push(`     🕐 वेळ: ${program.time}`);
        lines.push(`     📊 स्थिती: ${program.status === 'completed' ? 'पूर्ण' : program.status === 'upcoming' ? 'आगामी' : program.status}`);
        if (program.description) {
          lines.push(`     📝 वर्णन: ${program.description}`);
        }
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Winners Section
    lines.push("");
    lines.push("🏆 विजेते (Winners)");
    lines.push(thinSeparator);
    if (data.winners.length === 0) {
      lines.push("  कोणतेही विजेते नोंदवले नाहीत.");
    } else {
      // Group winners by program
      const winnersByProgram: { [key: string]: any[] } = {};
      data.winners.forEach(winner => {
        const programId = winner.program_id;
        if (!winnersByProgram[programId]) {
          winnersByProgram[programId] = [];
        }
        winnersByProgram[programId].push(winner);
      });

      Object.entries(winnersByProgram).forEach(([programId, winners]) => {
        const program = data.programs.find(p => p.id === programId);
        lines.push("");
        lines.push(`  📌 ${program?.name || "अज्ञात कार्यक्रम"}`);
        winners.forEach(winner => {
          lines.push(`     🏅 ${winner.category}:`);
          if (winner.first_place) lines.push(`        🥇 प्रथम: ${winner.first_place}`);
          if (winner.second_place) lines.push(`        🥈 द्वितीय: ${winner.second_place}`);
          if (winner.third_place) lines.push(`        🥉 तृतीय: ${winner.third_place}`);
        });
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Quiz Results Section
    lines.push("");
    lines.push("📝 प्रश्नमंजुषा निकाल (Quiz Results)");
    lines.push(thinSeparator);
    if (data.quizResponses.length === 0) {
      lines.push("  कोणतेही प्रश्नमंजुषा प्रतिसाद नाहीत.");
    } else {
      // Group by category
      const responsesByCategory: { [key: string]: any[] } = {};
      data.quizResponses.forEach(response => {
        if (!responsesByCategory[response.category]) {
          responsesByCategory[response.category] = [];
        }
        responsesByCategory[response.category].push(response);
      });

      Object.entries(responsesByCategory).forEach(([category, responses]) => {
        lines.push("");
        lines.push(`  📚 गट: ${category}`);
        lines.push(`     एकूण सहभागी: ${responses.length}`);
        
        // Sort by score descending
        const sorted = responses.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        lines.push("     🏆 अव्वल ५:");
        sorted.slice(0, 5).forEach((r, i) => {
          lines.push(`        ${i + 1}. ${r.participant_name} - ${r.score || 0}/${r.total_questions || 0} गुण`);
        });
        
        if (sorted.length > 5) {
          lines.push("");
          lines.push("     📋 सर्व सहभागी:");
          sorted.forEach((r, i) => {
            lines.push(`        ${i + 1}. ${r.participant_name} - ${r.score || 0}/${r.total_questions || 0} गुण (Tab बदल: ${r.tab_switches || 0})`);
          });
        }
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Donations Section
    lines.push("");
    lines.push("💰 वर्गणी / देणगी (Donations)");
    lines.push(thinSeparator);
    
    const totalAssigned = data.donations.reduce((sum, d) => sum + (d.assigned_amount || 0), 0);
    const totalPaid = data.donations.reduce((sum, d) => sum + (d.paid_amount || 0), 0);
    const paidCount = data.donations.filter(d => d.paid_amount >= d.assigned_amount && d.assigned_amount > 0).length;
    const partialCount = data.donations.filter(d => d.paid_amount > 0 && d.paid_amount < d.assigned_amount).length;
    const pendingCount = data.donations.filter(d => d.paid_amount === 0 && d.assigned_amount > 0).length;

    lines.push("");
    lines.push(`  📊 सारांश:`);
    lines.push(`     एकूण नियुक्त रक्कम: ${formatCurrency(totalAssigned)}`);
    lines.push(`     एकूण जमा रक्कम: ${formatCurrency(totalPaid)}`);
    lines.push(`     बाकी रक्कम: ${formatCurrency(totalAssigned - totalPaid)}`);
    lines.push("");
    lines.push(`     ✅ पूर्ण भरणा: ${paidCount} घरे`);
    lines.push(`     ⏳ अंशतः भरणा: ${partialCount} घरे`);
    lines.push(`     ⏸️ प्रलंबित: ${pendingCount} घरे`);
    
    if (data.donations.length > 0) {
      lines.push("");
      lines.push("  📋 तपशीलवार यादी:");
      data.donations.forEach(donation => {
        const home = data.homes.find(h => h.id === donation.home_id);
        const homeDisplay = home ? `${home.home_number}. ${home.home_name || home.contact_person || ''}` : `घर ${donation.home_id}`;
        const status = donation.paid_amount >= donation.assigned_amount && donation.assigned_amount > 0 
          ? "✅ पूर्ण" 
          : donation.paid_amount > 0 
            ? "⏳ अंशतः" 
            : "⏸️ प्रलंबित";
        lines.push(`     ${homeDisplay}`);
        lines.push(`        नियुक्त: ${formatCurrency(donation.assigned_amount)} | भरले: ${formatCurrency(donation.paid_amount)} | ${status}`);
        if (donation.notes) {
          lines.push(`        टीप: ${donation.notes}`);
        }
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Expenses Section
    lines.push("");
    lines.push("💸 खर्च (Expenses)");
    lines.push(thinSeparator);
    if (data.expenses.length === 0) {
      lines.push("  कोणताही खर्च नोंदवला नाही.");
    } else {
      const totalExpense = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      lines.push("");
      lines.push(`  📊 एकूण खर्च: ${formatCurrency(totalExpense)}`);
      lines.push("");
      lines.push("  📋 खर्च तपशील:");
      data.expenses.forEach((expense, i) => {
        lines.push(`     ${i + 1}. ${expense.item} - ${formatCurrency(expense.amount)}`);
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Notices Section
    lines.push("");
    lines.push("📢 सूचना (Notices)");
    lines.push(thinSeparator);
    if (data.notices.length === 0) {
      lines.push("  कोणत्याही सूचना नाहीत.");
    } else {
      data.notices.forEach((notice, i) => {
        lines.push("");
        lines.push(`  ${i + 1}. ${notice.title}`);
        lines.push(`     📅 तारीख: ${notice.date}`);
        lines.push(`     📌 प्रकार: ${notice.notice_type === 'notice' ? 'सूचना' : notice.notice_type === 'event' ? 'कार्यक्रम' : notice.notice_type}`);
        if (notice.description) {
          lines.push(`     📝 ${notice.description}`);
        }
      });
    }
    lines.push("");
    lines.push(thinSeparator);

    // Financial Summary
    lines.push("");
    lines.push("📈 आर्थिक सारांश (Financial Summary)");
    lines.push(thinSeparator);
    
    const account = data.accounts.find(a => a.year === year);
    if (account) {
      lines.push("");
      lines.push(`  💵 एकूण उत्पन्न: ${formatCurrency(account.total_income)}`);
      lines.push(`  💸 एकूण खर्च: ${formatCurrency(account.total_expense)}`);
      lines.push(`  📊 शिल्लक: ${formatCurrency((account.total_income || 0) - (account.total_expense || 0))}`);
    } else {
      lines.push("  आर्थिक माहिती उपलब्ध नाही.");
    }
    lines.push("");
    lines.push(separator);
    lines.push("");
    lines.push("        हा अहवाल Year Lock प्रक्रियेद्वारे स्वयंचलितपणे तयार झाला आहे.");
    lines.push(`        Archive तारीख: ${formatDate(new Date().toISOString())}`);
    lines.push("");
    lines.push(separator);

    return lines.join("\n");
  };

  const handleYearLock = async () => {
    // Validate password
    if (password !== LOCK_PASSWORD) {
      toast.error("चुकीचा पासवर्ड! कृपया योग्य पासवर्ड टाका.");
      return;
    }

    // Validate remark
    if (!remark.trim()) {
      toast.error("कृपया टिप्पणी/रिमार्क टाका.");
      return;
    }

    // Confirm action
    if (!confirm(`तुम्हाला खात्री आहे का की तुम्ही ${selectedYear} वर्ष लॉक करू इच्छिता?\n\nयामुळे:\n• सर्व डेटा ZIP मध्ये डाउनलोड होईल\n• सिस्टम पूर्णपणे रीसेट होईल\n• ही क्रिया पूर्ववत करता येणार नाही!`)) {
      return;
    }

    setIsLocking(true);
    try {
      // Fetch all data
      const [
        programsRes,
        winnersRes,
        quizResponsesRes,
        donationsRes,
        expensesRes,
        noticesRes,
        accountsRes,
        homesRes,
        quizQuestionsRes
      ] = await Promise.all([
        supabase.from("programs").select("*"),
        supabase.from("program_winners").select("*"),
        supabase.from("quiz_responses").select("*"),
        supabase.from("home_donations").select("*").eq("year", selectedYear),
        supabase.from("account_expenses").select("*"),
        supabase.from("notices").select("*"),
        supabase.from("yearly_accounts").select("*"),
        supabase.from("homes").select("*"),
        supabase.from("quiz_questions").select("*")
      ]);

      const data = {
        programs: programsRes.data || [],
        winners: winnersRes.data || [],
        quizResponses: quizResponsesRes.data || [],
        donations: donationsRes.data || [],
        expenses: expensesRes.data || [],
        notices: noticesRes.data || [],
        accounts: accountsRes.data || [],
        homes: homesRes.data || [],
        quizQuestions: quizQuestionsRes.data || []
      };

      // Create ZIP file
      const zip = new JSZip();
      
      // Add readable report
      const readableReport = generateReadableReport(data, selectedYear, remark);
      zip.file(`विचारमंच_${selectedYear}_अहवाल.txt`, readableReport);

      // Add data files folder with readable JSON
      const dataFolder = zip.folder("data");
      if (dataFolder) {
        dataFolder.file("programs.json", JSON.stringify(data.programs, null, 2));
        dataFolder.file("winners.json", JSON.stringify(data.winners, null, 2));
        dataFolder.file("quiz_responses.json", JSON.stringify(data.quizResponses, null, 2));
        dataFolder.file("quiz_questions.json", JSON.stringify(data.quizQuestions, null, 2));
        dataFolder.file("donations.json", JSON.stringify(data.donations, null, 2));
        dataFolder.file("homes.json", JSON.stringify(data.homes, null, 2));
        dataFolder.file("expenses.json", JSON.stringify(data.expenses, null, 2));
        dataFolder.file("notices.json", JSON.stringify(data.notices, null, 2));
        dataFolder.file("yearly_accounts.json", JSON.stringify(data.accounts, null, 2));
      }

      // Add metadata
      const metadata = {
        year: selectedYear,
        lockedAt: new Date().toISOString(),
        remark: remark,
        stats: {
          totalPrograms: data.programs.length,
          totalWinners: data.winners.length,
          totalQuizResponses: data.quizResponses.length,
          totalDonations: data.donations.length,
          totalExpenses: data.expenses.length,
          totalNotices: data.notices.length
        }
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VicharManch_${selectedYear}_Archive.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("ZIP फाईल डाउनलोड झाली! आता डेटा साफ करत आहोत...");

      // Clear all data - Delete in proper order (child tables first)
      
      // 1. Delete quiz answers first (references quiz_responses)
      await supabase.from("quiz_answers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 2. Delete quiz responses
      await supabase.from("quiz_responses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 3. Delete program winners (references programs)
      await supabase.from("program_winners").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 4. Delete programs
      await supabase.from("programs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 5. Delete notices
      await supabase.from("notices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      // 6. Delete expenses (references yearly_accounts)
      await supabase.from("account_expenses").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      // 7. Reset donations for the year (don't delete, just reset amounts)
      await supabase
        .from("home_donations")
        .update({ 
          paid_amount: 0, 
          assigned_amount: 0, 
          notes: null,
          payment_date: null 
        })
        .eq("year", selectedYear);

      // 8. Reset yearly accounts
      await supabase
        .from("yearly_accounts")
        .update({ 
          total_income: 0, 
          total_expense: 0 
        })
        .eq("year", selectedYear);

      // 9. Deactivate all quizzes
      await supabase
        .from("quiz_settings")
        .update({ is_active: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      toast.success(`${selectedYear} वर्ष यशस्वीरित्या लॉक झाले! सिस्टम नवीन वर्षासाठी तयार आहे.`);
      
      // Reset form
      setPassword("");
      setRemark("");

    } catch (error) {
      console.error("Year lock error:", error);
      toast.error("वर्ष लॉक करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.");
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          वर्ष लॉक करा (Year Lock)
        </CardTitle>
        <CardDescription>
          संपूर्ण वर्षाचा डेटा संग्रहित करा आणि नवीन वर्षासाठी सिस्टम तयार करा
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-destructive">सावधान!</p>
            <p className="text-muted-foreground">
              ही क्रिया अपरिवर्तनीय आहे. सर्व डेटा ZIP मध्ये डाउनलोड होईल आणि 
              सिस्टममधून कायमचा हटवला जाईल.
            </p>
          </div>
        </div>

        {/* Year Display */}
        <div className="space-y-2">
          <Label>लॉक करायचे वर्ष</Label>
          <div className="p-3 bg-muted rounded-lg text-center">
            <span className="text-2xl font-bold">{currentYear}</span>
            <p className="text-sm text-muted-foreground mt-1">
              सध्याचे वर्ष आपोआप निवडले जाते
            </p>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="lock-password">पासवर्ड *</Label>
          <Input
            id="lock-password"
            type="password"
            placeholder="Year Lock पासवर्ड टाका"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Remark */}
        <div className="space-y-2">
          <Label htmlFor="lock-remark">टिप्पणी / रिमार्क *</Label>
          <Textarea
            id="lock-remark"
            placeholder="उदा. जयंती २०२६ कार्यक्रम यशस्वीरित्या पूर्ण झाला..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        </div>

        {/* Lock Button */}
        <Button 
          variant="destructive" 
          onClick={handleYearLock}
          disabled={isLocking || !password || !remark.trim()}
          className="w-full"
        >
          {isLocking ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-bounce" />
              डेटा संग्रहित करत आहे...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 mr-2" />
              {currentYear} वर्ष लॉक करा आणि Archive डाउनलोड करा
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default YearLockManager;
