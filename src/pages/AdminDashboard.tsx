import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import QuizManagement from "@/components/admin/QuizManagement";
import NoticeManagement from "@/components/admin/NoticeManagement";
import DonationManagement from "@/components/admin/DonationManagement";
import ProgramManagement from "@/components/admin/ProgramManagement";
import CertificateManagement from "@/components/admin/CertificateManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import LetterpadManagement from "@/components/admin/LetterpadManagement";
import PrizeDistribution from "@/components/admin/PrizeDistribution";
import CompetitionManagement from "@/components/admin/CompetitionManagement";
import ParticipantManagement from "@/components/admin/ParticipantManagement";
import {
  Shield, LogOut, Bell, IndianRupee, Home, CalendarDays, Award, Settings,
  FileText, Gift, BookOpen, Trophy, Users, Menu, LayoutDashboard,
} from "lucide-react";
import { Link } from "react-router-dom";

type SectionKey =
  | "programs" | "competition" | "participants" | "quiz"
  | "certificates" | "notices" | "donations" | "prizes"
  | "letterpad" | "settings";

type NavItem = {
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
};

const NAV: NavItem[] = [
  { key: "programs",     label: "कार्यक्रम",     icon: CalendarDays, group: "कार्यक्रम व स्पर्धा" },
  { key: "competition",  label: "स्पर्धा मूल्यांकन", icon: Trophy,    group: "कार्यक्रम व स्पर्धा" },
  { key: "participants", label: "सहभागी नोंदणी",  icon: Users,        group: "कार्यक्रम व स्पर्धा" },
  { key: "quiz",         label: "प्रश्नमंजुषा",   icon: BookOpen,     group: "कार्यक्रम व स्पर्धा" },

  { key: "certificates", label: "प्रमाणपत्र",     icon: Award,        group: "गौरव व सूचना" },
  { key: "prizes",       label: "बक्षीस",         icon: Gift,         group: "गौरव व सूचना" },
  { key: "notices",      label: "सूचना",          icon: Bell,         group: "गौरव व सूचना" },

  { key: "donations",    label: "देणगी व खाते",   icon: IndianRupee,  group: "वित्त व दस्तऐवज" },
  { key: "letterpad",    label: "दस्तऐवज",        icon: FileText,     group: "वित्त व दस्तऐवज" },

  { key: "settings",     label: "सेटिंग्स",       icon: Settings,     group: "इतर" },
];

const groupOrder = ["कार्यक्रम व स्पर्धा", "गौरव व सूचना", "वित्त व दस्तऐवज", "इतर"];

const Sidebar = ({
  active, onSelect,
}: { active: SectionKey; onSelect: (k: SectionKey) => void }) => (
  <nav className="space-y-6 p-4">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
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

const renderSection = (k: SectionKey) => {
  switch (k) {
    case "programs":     return <ProgramManagement />;
    case "competition":  return <CompetitionManagement />;
    case "participants": return <ParticipantManagement />;
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
    case "donations":    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5" /> देणगी व खाते व्यवस्थापन</CardTitle>
          <CardDescription>घरमालकांकडून देणगी जमा करा आणि खर्च व्यवस्थापित करा</CardDescription>
        </CardHeader>
        <CardContent><DonationManagement /></CardContent>
      </Card>
    );
    case "prizes":       return <PrizeDistribution />;
    case "letterpad":    return <LetterpadManagement />;
    case "settings":     return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> सेटिंग्स</CardTitle>
          <CardDescription>खाते सेटिंग्स आणि प्रशासकीय क्रिया</CardDescription>
        </CardHeader>
        <CardContent><AdminSettings /></CardContent>
      </Card>
    );
  }
};

const AdminDashboard = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionKey>("programs");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) navigate("/admin-login");
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
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
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Top header */}
      <header className="bg-primary text-primary-foreground shadow sticky top-0 z-40">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b bg-primary text-primary-foreground">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <div>
                      <p className="font-bold text-sm">Admin Dashboard</p>
                      <p className="text-xs opacity-80">प्रशासक पॅनेल</p>
                    </div>
                  </div>
                </div>
                <Sidebar
                  active={active}
                  onSelect={(k) => { setActive(k); setMobileOpen(false); }}
                />
              </SheetContent>
            </Sheet>

            <Shield className="h-6 w-6 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold truncate">Admin Dashboard</h1>
              <p className="text-[11px] sm:text-xs opacity-80 truncate">प्रशासक पॅनेल — विचारमंच लातूर</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">मुख्यपृष्ठ</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">लॉगआउट</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 border-r bg-card sticky top-[60px] self-start max-h-[calc(100vh-60px)] overflow-y-auto">
          <Sidebar active={active} onSelect={setActive} />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto w-full">
            {/* Section breadcrumb / title */}
            <div className="mb-4 sm:mb-6 flex items-center gap-2 text-sm text-muted-foreground">
              <LayoutDashboard className="h-4 w-4" />
              <span>{activeMeta.group}</span>
              <span>/</span>
              <span className="text-foreground font-semibold flex items-center gap-1.5">
                <ActiveIcon className="h-4 w-4" /> {activeMeta.label}
              </span>
            </div>

            <motion.div
              key={active}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {renderSection(active)}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
