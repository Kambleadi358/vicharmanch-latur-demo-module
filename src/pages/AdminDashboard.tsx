import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuizManagement from "@/components/admin/QuizManagement";
import NoticeManagement from "@/components/admin/NoticeManagement";
import DonationManagement from "@/components/admin/DonationManagement";
import ProgramManagement from "@/components/admin/ProgramManagement";
import CertificateManagement from "@/components/admin/CertificateManagement";
import AdminSettings from "@/components/admin/AdminSettings";
import { Shield, LogOut, HelpCircle, Bell, IndianRupee, Home, CalendarDays, Award, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin-login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm opacity-80">विचारमंच प्रशासक पॅनेल</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Home className="h-4 w-4 mr-2" />
                  मुख्यपृष्ठ
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="h-4 w-4 mr-2" />
                लॉगआउट
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Tabs defaultValue="programs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
              <TabsTrigger value="programs" className="gap-2">
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">कार्यक्रम</span>
              </TabsTrigger>
              <TabsTrigger value="certificates" className="gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">प्रमाणपत्र</span>
              </TabsTrigger>
              <TabsTrigger value="quiz" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">प्रश्नमंजुषा</span>
              </TabsTrigger>
              <TabsTrigger value="notices" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">सूचना</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="gap-2">
                <IndianRupee className="h-4 w-4" />
                <span className="hidden sm:inline">देणगी व खाते</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">सेटिंग्स</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="programs">
              <ProgramManagement />
            </TabsContent>

            <TabsContent value="certificates">
              <CertificateManagement />
            </TabsContent>

            <TabsContent value="quiz">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    प्रश्नमंजुषा व्यवस्थापन
                  </CardTitle>
                  <CardDescription>
                    प्रश्न जोडा, संपादित करा आणि क्विझ सक्रिय/निष्क्रिय करा
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuizManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notices">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    सूचना व्यवस्थापन
                  </CardTitle>
                  <CardDescription>मुख्यपृष्ठावरील सूचना व्यवस्थापित करा</CardDescription>
                </CardHeader>
                <CardContent>
                  <NoticeManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    देणगी व खाते व्यवस्थापन
                  </CardTitle>
                  <CardDescription>घरमालकांकडून देणगी जमा करा आणि खर्च व्यवस्थापित करा</CardDescription>
                </CardHeader>
                <CardContent>
                  <DonationManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    सेटिंग्स
                  </CardTitle>
                  <CardDescription>खाते सेटिंग्स आणि प्रशासकीय क्रिया</CardDescription>
                </CardHeader>
                <CardContent>
                  <AdminSettings />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
