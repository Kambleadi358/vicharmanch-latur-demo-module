import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import GratitudeCarousel from "@/components/ideology/GratitudeCarousel";
import MuktiMantraSection from "@/components/ideology/MuktiMantraSection";
import buddhaEnlightenmentBg from "@/assets/buddha-enlightenment-bg.jpg";
import { 
  Scale, 
  Heart, 
  BookOpen, 
  Users, 
  GraduationCap, 
  Globe,
  Sparkles,
  Shield
} from "lucide-react";

const ideologies = [
  { icon: Scale, title: "समता", description: "सर्वांना समान हक्क व संधी" },
  { icon: Heart, title: "बंधुता", description: "एकमेकांप्रती आदर व प्रेम" },
  { icon: Shield, title: "न्याय", description: "सामाजिक, आर्थिक, राजकीय न्याय" },
  { icon: GraduationCap, title: "शैक्षणिक", description: "शिक्षणाद्वारे सक्षमीकरण" },
  { icon: Users, title: "सामाजिक", description: "सामाजिक परिवर्तनाची चळवळ" },
  { icon: BookOpen, title: "वैचारिक", description: "विचारांचे प्रसार व संवर्धन" },
  { icon: Globe, title: "सांस्कृतिक", description: "बौद्ध संस्कृतीचे जतन" },
  { icon: Sparkles, title: "बौद्धिक", description: "बौद्धिक विकासाला प्राधान्य" },
];

const principles = [
  "सर्वांचा, सर्वांसाठी",
  "अध्यक्षविहीन रचना",
  "महिलाशक्तीकरण",
  "बुद्ध, धम्म, संघ",
  "आंबेडकरवादी विचार",
  "संविधानवादी दृष्टिकोन",
  "भिमजल्लोष",
];

const Ideology = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              विचारधारा
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              आंबेडकरवादी विचारांवर आधारित आमची तत्त्वे व मूल्ये
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.blockquote
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-2xl md:text-3xl font-medium text-foreground italic leading-relaxed">
              "मी असे समाज घडवू इच्छितो जे स्वातंत्र्य, समता आणि बंधुत्वावर आधारित असेल."
            </p>
            <footer className="mt-6 text-accent font-semibold text-lg">
              — डॉ. बाबासाहेब आंबेडकर
            </footer>
          </motion.blockquote>
        </div>
      </section>

      {/* Gratitude Carousel - बाबासाहेबांच्या उपकारांची जाणीव */}
      <GratitudeCarousel />
      {/* Ideologies Grid */}
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              मूल्ये
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              आमच्या विचारांचे स्तंभ
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ideologies.map((ideology, index) => (
              <motion.div
                key={ideology.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="card-hover bg-card rounded-xl p-6 text-center border border-border group"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ideology.icon size={28} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {ideology.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {ideology.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Principles Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              तत्त्वे
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              आमच्या चळवळीची ओळख
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {principles.map((principle, index) => (
              <motion.span
                key={principle}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-full text-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors cursor-default"
              >
                {principle}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* 22 Vows - Mukti Mantra Section */}
      <MuktiMantraSection />

      {/* Buddha Dhamma Sangha - with Buddha image background */}
      <section className="py-20 relative overflow-hidden">
        {/* Buddha Image Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${buddhaEnlightenmentBg})` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-primary/85" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            {/* Triratna Symbol */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring" }}
              className="flex justify-center gap-4 text-4xl md:text-5xl mb-8"
            >
              <span className="text-accent animate-pulse">☸</span>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              बुद्ध • धम्म • संघ
            </h2>
            
            {/* Three Refuges in Pali */}
            <div className="space-y-3 py-6">
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-lg md:text-xl text-primary-foreground/90 italic"
              >
                बुद्धं शरणं गच्छामि
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-primary-foreground/90 italic"
              >
                धम्मं शरणं गच्छामि
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-primary-foreground/90 italic"
              >
                संघं शरणं गच्छामि
              </motion.p>
            </div>

            <p className="text-lg text-primary-foreground/80 leading-relaxed">
              बुद्ध भगवानांच्या शिकवणुकीवर आधारित, डॉ. बाबासाहेब आंबेडकरांच्या विचारांनी 
              प्रेरित, आणि संविधानाच्या मूल्यांवर उभारलेली आमची चळवळ म्हणजे एक नवीन 
              सामाजिक क्रांतीचे स्वप्न.
            </p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="text-accent text-xl font-semibold pt-4"
            >
              जय भीम • नमो बुद्धाय
            </motion.div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Ideology;
