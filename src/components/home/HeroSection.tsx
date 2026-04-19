import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Calendar, Wallet, Trophy } from "lucide-react";
import logo from "@/assets/vicharmanch-logo.jpeg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      {/* Ashoka Chakra Decorative */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute -right-40 top-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-5"
      >
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-primary-foreground">
          <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" />
          {[...Array(24)].map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="10"
              x2="50"
              y2="25"
              stroke="currentColor"
              strokeWidth="2"
              transform={`rotate(${i * 15} 50 50)`}
            />
          ))}
        </svg>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left space-y-8"
          >
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-block px-4 py-2 bg-accent/20 rounded-full text-accent text-sm font-medium"
              >
                अध्यक्षविहीन • विचारकेंद्रित • पारदर्शक
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight"
              >
                भारतरत्न डॉ. बाबासाहेब
                <span className="block text-gradient mt-2">आंबेडकर विचारमंच</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg md:text-xl text-primary-foreground/70 max-w-xl mx-auto lg:mx-0"
              >
                समता, बंधुता, न्याय यांच्या विचारांवर आधारित वैचारिक, बौद्धिक, सामाजिक व सांस्कृतिक चळवळ
              </motion.p>
            </div>

            {/* Quote */}
            <motion.blockquote
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="border-l-4 border-accent pl-4 text-primary-foreground/80 italic"
            >
              "जोपर्यंत तुम्ही सामाजिक स्वातंत्र्य मिळवत नाही, तोपर्यंत कायद्याने दिलेले स्वातंत्र्य निरर्थक आहे."
            </motion.blockquote>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <Link to="/programs" className="btn-hero flex items-center gap-2">
                <Calendar size={20} />
                कार्यक्रम पहा
              </Link>
              <Link to="/quiz" className="btn-outline-hero flex items-center gap-2">
                <BookOpen size={20} />
                प्रश्नमंजुषा
              </Link>
              <Link to="/spardha" className="btn-outline-hero flex items-center gap-2">
                <Trophy size={20} />
                स्पर्धा पाहा
              </Link>
              <Link to="/accounts" className="btn-outline-hero flex items-center gap-2">
                <Wallet size={20} />
                खाते माहिती
              </Link>
            </motion.div>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-3xl scale-110" />
              
              {/* Main Image */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative"
              >
                <img
                  src={logo}
                  alt="डॉ. बाबासाहेब आंबेडकर"
                  className="w-72 h-72 md:w-96 md:h-96 rounded-full object-cover border-4 border-accent shadow-2xl"
                />
                
                {/* Decorative Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-accent/30 rounded-full scale-110"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-accent rounded-full" />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
