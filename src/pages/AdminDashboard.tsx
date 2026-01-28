import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import QuizManagement from "@/components/admin/QuizManagement";
import NoticeManagement from "@/components/admin/NoticeManagement";
import AccountsManagement from "@/components/admin/AccountsManagement";
import { Shield, LogOut, HelpCircle, Bell, IndianRupee, Home } from "lucide-react";
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
          <Tabs defaultValue="quiz" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
              <TabsTrigger value="quiz" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">प्रश्नमंजुषा</span>
              </TabsTrigger>
              <TabsTrigger value="notices" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">सूचना</span>
              </TabsTrigger>
              <TabsTrigger value="accounts" className="gap-2">
                <IndianRupee className="h-4 w-4" />
                <span className="hidden sm:inline">खाते</span>
              </TabsTrigger>
            </TabsList>

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

            <TabsContent value="accounts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5" />
                    खाते व्यवस्थापन
                  </CardTitle>
                  <CardDescription>
                    वर्षनिहाय जमा-खर्च व्यवस्थापित करा
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AccountsManagement />
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
