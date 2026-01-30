import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowLeft, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const AdminSignup = () => {
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
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">प्रवेश बंद</CardTitle>
            <CardDescription className="text-base">
              नवीन Admin साइन अप सध्या बंद आहे.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              विचारमंच Admin पॅनेल फक्त अधिकृत व्यवस्थापकांसाठी उपलब्ध आहे.
            </p>
            <div className="bg-secondary p-4 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Admin संपर्क</span>
              </div>
              <p className="text-sm text-muted-foreground">
                vicharmanch1956@gmail.com
              </p>
            </div>
            <Link
              to="/admin-login"
              className="inline-block text-primary hover:underline"
            >
              आधीच Admin आहात? लॉगिन करा
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminSignup;