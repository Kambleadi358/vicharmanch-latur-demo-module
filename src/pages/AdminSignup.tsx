import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, ArrowLeft, UserPlus, CheckCircle } from "lucide-react";

const AdminSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if this will be the first admin
  useEffect(() => {
    const checkFirstUser = async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      if (error) {
        console.error("Error checking admin count:", error);
        setIsFirstUser(false);
        return;
      }

      setIsFirstUser(count === 0);
    };

    checkFirstUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "त्रुटी",
        description: "पासवर्ड जुळत नाहीत",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "त्रुटी",
        description: "पासवर्ड किमान 6 अक्षरांचा असावा",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (authError) {
        toast({
          title: "साइनअप त्रुटी",
          description: authError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast({
          title: "त्रुटी",
          description: "यूजर तयार करण्यात अयशस्वी",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // If this is the first user, make them admin
      if (isFirstUser) {
        const { error: roleError } = await supabase.from("user_roles").insert([
          {
            user_id: authData.user.id,
            role: "admin",
          },
        ]);

        if (roleError) {
          console.error("Error assigning admin role:", roleError);
          // Don't show error to user, the account was still created
        }
      }

      setIsSuccess(true);
      toast({
        title: "यशस्वी!",
        description: isFirstUser
          ? "Admin खाते तयार झाले! आता लॉगिन करा."
          : "खाते तयार झाले! Admin ला तुम्हाला admin role द्यावे लागेल.",
      });

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (error) {
      toast({
        title: "त्रुटी",
        description: "काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-0 text-center">
            <CardHeader className="space-y-4">
              <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <CardTitle className="text-2xl">खाते तयार झाले!</CardTitle>
              <CardDescription>
                {isFirstUser
                  ? "तुम्ही पहिले Admin आहात. लॉगिन पेजवर जात आहात..."
                  : "Admin ला तुम्हाला admin access द्यावे लागेल."}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          मुख्यपृष्ठावर परत जा
        </Link>

        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Admin Signup</CardTitle>
            <CardDescription>
              {isFirstUser === null ? (
                "लोड होत आहे..."
              ) : isFirstUser ? (
                <span className="text-green-600 font-medium">
                  🎉 तुम्ही पहिले Admin व्हाल!
                </span>
              ) : (
                "नवीन Admin खाते तयार करा"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ईमेल</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">पासवर्ड</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">पासवर्ड पुष्टी करा</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {isFirstUser && (
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    पहिला user आपोआप Admin होईल
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isFirstUser === null}
              >
                {isLoading ? "खाते तयार होत आहे..." : "साइन अप करा"}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                आधीच खाते आहे?{" "}
                <Link to="/admin-login" className="text-primary hover:underline">
                  लॉगिन करा
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminSignup;
