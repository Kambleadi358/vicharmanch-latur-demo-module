import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { BookOpen, Award, AlertTriangle, Clock, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const rules = [
  "प्रश्नमंजुषा डॉ. बाबासाहेब आंबेडकरांच्या जीवनावर आधारित आहे",
  "प्रत्येक प्रश्नास १ गुण",
  "उत्तर देण्यासाठी निश्चित वेळ असेल",
  "परीक्षा दरम्यान टॅब बदलणे किंवा कॉपी करणे प्रतिबंधित आहे",
  "नियम मोडल्यास प्रशासनास सूचित केले जाईल",
];

const Quiz = () => {
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizDuration, setQuizDuration] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"register" | "instructions">("register");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkQuizActive();
  }, []);

  const checkQuizActive = async () => {
    setIsLoading(true);
    // Check if any quiz is active
    const { data, error } = await supabase
      .from("quiz_settings")
      .select("is_active, duration_minutes")
      .eq("is_active", true)
      .limit(1);

    if (error) {
      toast({
        title: "त्रुटी",
        description: "क्विझ माहिती लोड करण्यात त्रुटी",
        variant: "destructive",
      });
    } else if (data && data.length > 0) {
      setIsQuizActive(true);
      setQuizDuration(data[0].duration_minutes || 30);
    } else {
      setIsQuizActive(false);
    }
    setIsLoading(false);
  };

  const handleStartQuiz = () => {
    if (!name) return;
    // Navigate to quiz with a generic category - all questions will be fetched
    navigate(`/quiz/general`, { 
      state: { participantName: name } 
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              प्रश्नमंजुषा
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              डॉ. बाबासाहेब आंबेडकरांच्या जीवनावर आधारित प्रश्नमंजुषा स्पर्धा
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
          ) : !isQuizActive ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-8 border border-border text-center"
            >
              <BookOpen className="mx-auto mb-6 text-accent" size={64} />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                सध्या कोणतीही प्रश्नमंजुषा सक्रिय नाही
              </h2>
              <p className="text-muted-foreground">
                प्रशासकाने प्रश्नमंजुषा सक्रिय केल्यावर तुम्ही येथे भाग घेऊ शकता.
                <br />
                कृपया प्रतीक्षा करा किंवा प्रशासकाशी संपर्क साधा.
              </p>
            </motion.div>
          ) : step === "register" ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              {/* Registration Form */}
              <div className="bg-card rounded-xl p-8 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  प्रश्नमंजुषा नोंदणी
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-foreground font-medium mb-2">
                      तुमचे नाव *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-accent focus:border-transparent outline-none transition-all"
                      placeholder="पूर्ण नाव लिहा"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="flex items-center gap-2 text-foreground">
                      <Clock className="h-5 w-5 text-accent" />
                      <span>वेळ मर्यादा: <strong>{quizDuration} मिनिटे</strong></span>
                    </p>
                  </div>

                  <button
                    onClick={() => name && setStep("instructions")}
                    disabled={!name}
                    className="w-full btn-hero disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    पुढे जा
                  </button>
                </div>
              </div>

              {/* Info Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="card-hover bg-card rounded-xl p-6 border border-border text-center">
                  <BookOpen className="mx-auto mb-4 text-accent" size={32} />
                  <h3 className="font-semibold text-foreground mb-2">विषय</h3>
                  <p className="text-sm text-muted-foreground">
                    डॉ. आंबेडकरांचे जीवन व कार्य
                  </p>
                </div>
                <div className="card-hover bg-card rounded-xl p-6 border border-border text-center">
                  <Clock className="mx-auto mb-4 text-accent" size={32} />
                  <h3 className="font-semibold text-foreground mb-2">वेळ</h3>
                  <p className="text-sm text-muted-foreground">
                    {quizDuration} मिनिटे वेळ मर्यादा
                  </p>
                </div>
                <div className="card-hover bg-card rounded-xl p-6 border border-border text-center">
                  <Award className="mx-auto mb-4 text-accent" size={32} />
                  <h3 className="font-semibold text-foreground mb-2">बक्षीस</h3>
                  <p className="text-sm text-muted-foreground">
                    अव्वल ३ विजेत्यांना प्रमाणपत्र
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-8 border border-border"
            >
              <div className="text-center mb-8">
                <AlertTriangle className="mx-auto mb-4 text-accent" size={48} />
                <h2 className="text-2xl font-bold text-foreground">
                  महत्त्वाच्या सूचना
                </h2>
                <p className="text-muted-foreground mt-2">
                  कृपया खालील नियम काळजीपूर्वक वाचा
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {rules.map((rule, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20} />
                    <span className="text-foreground">{rule}</span>
                  </div>
                ))}
              </div>

              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-8">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ चेतावणी: परीक्षा दरम्यान टॅब बदलणे, कॉपी करणे किंवा इतर कोणतेही 
                  गैरवर्तन केल्यास तुमचे नाव प्रशासनास कळविले जाईल.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep("register")}
                  className="flex-1 px-6 py-3 border-2 border-border rounded-lg font-medium hover:bg-secondary transition-colors"
                >
                  मागे जा
                </button>
                <button
                  onClick={handleStartQuiz}
                  className="flex-1 btn-hero"
                >
                  प्रश्नमंजुषा सुरू करा
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quiz;
