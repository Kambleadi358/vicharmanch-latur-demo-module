import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuizManagement from "@/components/admin/QuizManagement";
import NoticeManagement from "@/components/admin/NoticeManagement";
import LedgerWorkspace from "@/components/admin/LedgerWorkspace";
import VoteResults from "@/components/admin/VoteResults";
import SamajNondaniManagement from "@/components/admin/SamajNondaniManagement";
import ProgramManagement from "@/components/admin/ProgramManagement";
import CertificateManagement from "@/components/admin/CertificateManagement";
import SettingsCenter from "@/components/admin/SettingsCenter";
import LetterpadManagement from "@/components/admin/DocumentStudio";
import PrizeDistribution from "@/components/admin/PrizeDistribution";
import CompetitionManagement from "@/components/admin/CompetitionManagement";
import ParticipantManagement from "@/components/admin/ParticipantManagement";
import DashboardHome from "@/components/admin/dashboard/DashboardHome";
import AnnualReportManagement from "@/components/admin/AnnualReportManagement";
import SuggestionManagement from "@/components/admin/SuggestionManagement";
import ActivityLogManagement from "@/components/admin/ActivityLogManagement";
import ParticipationAnalytics from "@/components/admin/ParticipationAnalytics";
import FailedSearchManagement from "@/components/admin/FailedSearchManagement";
import CommunityIntelligenceReport from "@/components/admin/CommunityIntelligenceReport";
import ConnectionStatus from "@/components/ConnectionStatus";
import {
  Shield, LogOut, Bell, IndianRupee, Home, CalendarDays, Award, Settings,
  FileText, Gift, BookOpen, Trophy, Users, Menu, LayoutDashboard, Plus, BookMarked,
  UsersRound, BookText, MessageSquare, Activity, BarChart3, BrainCircuit,
} from "lucide-react";

type SectionKey =
  | "dashboard" | "programs" | "competition" | "participants" | "quiz"
  | "certificates" | "notices" | "prizes"
  | "letterpad" | "annual" | "settings" | "registry" | "ledger"
  | "suggestions" | "activity" | "analytics" | "missing" | "votes" | "intelligence";


type NavItem = {
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
};

const NAV: NavItem[] = [
  { key: "dashboard",    label: "डॅशबोर्ड",       icon: LayoutDashboard, group: "मुख्यपृष्ठ" },
  { key: "registry",     label: "समाज नोंदणी",    icon: UsersRound,   group: "समाज" },
  { key: "ledger",       label: "देणगी खातावही",  icon: BookText,     group: "समाज" },
  { key: "suggestions",  label: "सुझाव पेटी",     icon: MessageSquare, group: "समाज" },
  { key: "missing",      label: "उपलब्ध नसलेली नावे", icon: UsersRound, group: "समाज" },
  { key: "programs",     label: "कार्यक्रम",     icon: CalendarDays, group: "कार्यक्रम व स्पर्धा" },
  { key: "competition",  label: "स्पर्धा मूल्यांकन", icon: Trophy,    group: "कार्यक्रम व स्पर्धा" },
  { key: "participants", label: "सहभागी नोंदणी",  icon: Users,        group: "कार्यक्रम व स्पर्धा" },
  { key: "votes",        label: "मतदान निकाल",    icon: BarChart3,    group: "कार्यक्रम व स्पर्धा" },
  { key: "analytics",    label: "सहभाग विश्लेषण", icon: BarChart3,    group: "कार्यक्रम व स्पर्धा" },
  { key: "quiz",         label: "प्रश्नमंजुषा",   icon: BookOpen,     group: "कार्यक्रम व स्पर्धा" },
  { key: "certificates", label: "प्रमाणपत्र",     icon: Award,        group: "गौरव व सूचना" },
  { key: "prizes",       label: "बक्षीस",         icon: Gift,         group: "गौरव व सूचना" },
  { key: "notices",      label: "सूचना",          icon: Bell,         group: "गौरव व सूचना" },
  { key: "letterpad",    label: "दस्तऐवज",        icon: FileText,     group: "वित्त व दस्तऐवज" },
  { key: "annual",       label: "वार्षिक अहवाल",  icon: BookMarked,   group: "वित्त व दस्तऐवज" },
  { key: "intelligence", label: "बुद्धिमत्ता अहवाल", icon: BrainCircuit, group: "वित्त व दस्तऐवज" },
  { key: "activity",     label: "क्रियाकलाप नोंदी", icon: Activity,   group: "इतर" },
  { key: "settings",     label: "सेटिंग्स",       icon: Settings,     group: "इतर" },
];

const groupOrder = ["मुख्यपृष्ठ", "समाज", "कार्यक्रम व स्पर्धा", "गौरव व सूचना", "वित्त व दस्तऐवज", "इतर"];

const Sidebar = ({
  active, onSelect,
}: { active: SectionKey; onSelect: (k: SectionKey) => void }) => (
  <nav className="space-y-5 p-4 pb-8">
    {groupOrder.map((g) => (
      <div key={g}>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 px-2 font-semibold">
          {g}
        </p>
        <div className="space-y-1">
          {NAV.filter((n) => n.group === g).map((n) => {
            const Icon = n.icon;
            const isActive = n.key === active;
            return (
              <button
                key={n.key}
                onClick={() => onSelect(n.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-[hsl(217,80%,35%)] text-primary-foreground shadow-md"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

// Mobile bottom navigation - 5 most-used
const BOTTOM_NAV: SectionKey[] = ["dashboard", "ledger", "competition", "notices", "settings"];

const AdminDashboard = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/admin-login");
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
  };

  const renderSection = (k: SectionKey) => {
    switch (k) {
      case "dashboard":    return <DashboardHome onNavigate={setActive} />;
      case "registry":     return <SamajNondaniManagement />;
      case "ledger":       return <LedgerWorkspace />;
      case "suggestions":  return <SuggestionManagement />;
      case "programs":     return <ProgramManagement />;
      case "competition":  return <CompetitionManagement />;
      case "participants": return <ParticipantManagement />;
      case "votes":        return <VoteResults />;
      case "analytics":    return <ParticipationAnalytics />;
      case "quiz":         return <QuizManagement />;
      case "certificates": return <CertificateManagement />;
      case "notices":      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> सूचना व्यवस्थापन</CardTitle>
            <CardDescription>मुख्यपृष्ठावरील सूचना व्यवस्थापित करा</CardDescription>
          </CardHeader>
          <CardContent><NoticeManagement /></CardContent>
        </Card>
      );
      case "prizes":       return <PrizeDistribution />;
      case "letterpad":    return <LetterpadManagement />;
      case "annual":       return <AnnualReportManagement />;
      case "intelligence": return <CommunityIntelligenceReport />;
      case "activity":     return <ActivityLogManagement />;
      case "settings":     return <SettingsCenter />;
      case "missing":      return <FailedSearchManagement />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  const activeMeta = NAV.find((n) => n.key === active)!;
  const ActiveIcon = activeMeta.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/40 via-background to-muted/30 flex flex-col">
      {/* Top header */}
      <header className="bg-gradient-to-r from-primary via-[hsl(217,80%,30%)] to-[hsl(220,15%,15%)] text-primary-foreground shadow-lg sticky top-0 z-40 backdrop-blur">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="p-4 border-b bg-gradient-to-r from-primary to-[hsl(217,80%,30%)] text-primary-foreground flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <div>
                      <p className="font-bold text-sm">Admin Dashboard</p>
                      <p className="text-xs opacity-80">प्रशासक पॅनेल</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <Sidebar active={active} onSelect={(k) => { setActive(k); setMobileOpen(false); }} />
                </div>
              </SheetContent>
            </Sheet>

            <Shield className="h-6 w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">विचारमंच — Admin</h1>
              <p className="text-[11px] sm:text-xs opacity-80 truncate">पारदर्शक प्रशासन पॅनेल</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ConnectionStatus adminMode className="mr-1 hidden sm:inline-flex" />
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">मुख्यपृष्ठ</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">लॉगआउट</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 border-r bg-card/80 backdrop-blur sticky top-[64px] self-start h-[calc(100vh-64px)] overflow-y-auto overscroll-contain">
          <Sidebar active={active} onSelect={setActive} />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full pb-24 lg:pb-6">
            {/* Breadcrumb (hide on dashboard home) */}
            {active !== "dashboard" && (
              <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm text-muted-foreground">
                <button onClick={() => setActive("dashboard")} className="hover:text-foreground inline-flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> डॅशबोर्ड
                </button>
                <span>/</span>
                <span>{activeMeta.group}</span>
                <span>/</span>
                <span className="text-foreground font-semibold flex items-center gap-1.5">
                  <ActiveIcon className="h-4 w-4" /> {activeMeta.label}
                </span>
              </div>
            )}

            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection(active)}
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur-lg border-t shadow-2xl">
        <div className="grid grid-cols-5 max-w-xl mx-auto">
          {BOTTOM_NAV.map((k) => {
            const item = NAV.find((n) => n.key === k)!;
            const Icon = item.icon;
            const isActive = active === k;
            return (
              <button
                key={k}
                onClick={() => setActive(k)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors relative ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-primary rounded-b-full" />
                )}
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile floating action button */}
      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-accent to-amber-600 hover:scale-105 transition-transform">
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuLabel>त्वरित जोडा</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActive("registry")}>
              <UsersRound className="h-4 w-4 mr-2" /> समाज नोंदणी
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("ledger")}>
              <BookText className="h-4 w-4 mr-2" /> देणगी खातावही
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("programs")}>
              <CalendarDays className="h-4 w-4 mr-2" /> कार्यक्रम
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("competition")}>
              <Trophy className="h-4 w-4 mr-2" /> स्पर्धा
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("notices")}>
              <Bell className="h-4 w-4 mr-2" /> सूचना
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("letterpad")}>
              <FileText className="h-4 w-4 mr-2" /> अहवाल
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("participants")}>
              <Users className="h-4 w-4 mr-2" /> सहभागी
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActive("settings")}>
              <Settings className="h-4 w-4 mr-2" /> सेटिंग्स
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AdminDashboard;
