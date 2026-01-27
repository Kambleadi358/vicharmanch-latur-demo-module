import { useState } from "react";
import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Award, AlertTriangle, Clock, CheckCircle } from "lucide-react";

const categories = [
  { id: "small", label: "छोटा गट", ageGroup: "१ ली ते ४ थी" },
  { id: "medium", label: "मोठा गट", ageGroup: "५ वी ते १० वी" },
  { id: "open", label: "खुला गट", ageGroup: "सर्वांसाठी" },
];

const rules = [
  "प्रश्नमंजुषा डॉ. बाबासाहेब आंबेडकरांच्या जीवनावर आधारित आहे",
  "प्रत्येक प्रश्नास १ गुण",
  "उत्तर देण्यासाठी निश्चित वेळ असेल",
  "परीक्षा दरम्यान टॅब बदलणे किंवा कॉपी करणे प्रतिबंधित आहे",
  "नियम मोडल्यास प्रशासनास सूचित केले जाईल",
];

const Quiz = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"register" | "instructions" | "quiz">("register");

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
          {step === "register" && (
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

                  <div>
                    <label className="block text-foreground font-medium mb-4">
                      गट निवडा *
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedCategory === cat.id
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <Users className="mx-auto mb-2 text-accent" size={24} />
                          <div className="font-semibold text-foreground">{cat.label}</div>
                          <div className="text-sm text-muted-foreground">{cat.ageGroup}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => name && selectedCategory && setStep("instructions")}
                    disabled={!name || !selectedCategory}
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
                    निश्चित वेळ मर्यादा
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
          )}

          {step === "instructions" && (
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
                  onClick={() => setStep("quiz")}
                  className="flex-1 btn-hero"
                >
                  प्रश्नमंजुषा सुरू करा
                </button>
              </div>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-xl p-8 border border-border text-center"
            >
              <BookOpen className="mx-auto mb-6 text-accent" size={64} />
              <h2 className="text-2xl font-bold text-foreground mb-4">
                प्रश्नमंजुषा लवकरच सुरू होईल
              </h2>
              <p className="text-muted-foreground mb-8">
                प्रशासकाने प्रश्नमंजुषा सक्रिय केल्यावर तुम्ही येथे प्रश्न सोडवू शकता.
                <br />
                कृपया प्रतीक्षा करा किंवा प्रशासकाशी संपर्क साधा.
              </p>
              <p className="text-accent font-semibold">
                {name} • {categories.find(c => c.id === selectedCategory)?.label}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Quiz;
