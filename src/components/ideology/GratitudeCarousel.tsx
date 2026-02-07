import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Droplets, 
  BookOpen, 
  Vote, 
  MessageCircleQuestion, 
  User, 
  Eye, 
  Smile, 
  Wind, 
  Scale,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const gratitudeThoughts = [
  {
    icon: Droplets,
    title: "आज पिण्याच्या पाण्याचा हक्क",
    lines: [
      "कधी तहान लागली की अपमान गिळावा लागायचा.",
      "आज हात धुण्यासाठीही बाटलीबंद पाणी सहज मिळतं —",
      "ही सहजता संघर्षातून आली आहे."
    ]
  },
  {
    icon: BookOpen,
    title: "आज शाळेचा दरवाजा उघडा आहे",
    lines: [
      "कधी शिक्षण म्हणजे गुन्हा होता.",
      "आज पुस्तक हातात आहे —",
      "कारण कुणीतरी हक्क लिहून दिले."
    ]
  },
  {
    icon: Vote,
    title: "आज मतदान म्हणजे ओळख",
    lines: [
      "कधी मत नव्हतं, नाव नव्हतं, अस्तित्व नव्हतं.",
      "आज एक मत म्हणजे माणूस म्हणून मान्यता."
    ]
  },
  {
    icon: MessageCircleQuestion,
    title: "आज प्रश्न विचारण्याची हिंमत आहे",
    lines: [
      "कधी प्रश्न म्हणजे बंड.",
      "आज प्रश्न म्हणजे अधिकार."
    ]
  },
  {
    icon: User,
    title: "आज स्त्री माणूस म्हणून उभी आहे",
    lines: [
      "कधी तिचा आवाज घरातच दडपला जायचा.",
      "आज तो संविधानात उमटतो."
    ]
  },
  {
    icon: Eye,
    title: "आज आम्ही भविष्याचा विचार करतो",
    lines: [
      "कारण कुणीतरी वर्तमान सुरक्षित केलं."
    ]
  },
  {
    icon: Smile,
    title: "आज जगणं सहज वाटतं",
    lines: [
      "पण ही सहजता कुणाच्या तरी असह्य संघर्षातून आली आहे."
    ]
  },
  {
    icon: Wind,
    title: "श्वास घेण्याचा अधिकार",
    lines: [
      "कधी माणूस असूनही श्वास चोरून घ्यावा लागायचा.",
      "आज मोकळा श्वास घेतो —",
      "कारण कुणीतरी गुलामगिरीवर वार केला."
    ]
  },
  {
    icon: Scale,
    title: "न्याय मागणं भीक नाही",
    lines: [
      "तो हक्क आहे.",
      "आणि हक्क भीतीने मिळत नाहीत."
    ]
  }
];

const AUTO_SLIDE_INTERVAL = 6000; // 6 seconds

const GratitudeCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % gratitudeThoughts.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + gratitudeThoughts.length) % gratitudeThoughts.length);
  }, []);

  // Auto-slide functionality
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(goToNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  const currentThought = gratitudeThoughts[currentIndex];
  const IconComponent = currentThought.icon;

  return (
    <section className="py-20 bg-secondary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-accent text-sm font-medium uppercase tracking-wider">
            कृतज्ञता
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            बाबासाहेबांच्या उपकारांची जाणीव
          </h2>
          <div className="decorative-line mt-4" />
        </motion.div>

        {/* Carousel Container */}
        <div 
          className="relative min-h-[350px] md:min-h-[300px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm border-border hover:bg-primary hover:text-primary-foreground transition-all h-12 w-12 rounded-full shadow-lg"
            aria-label="Previous thought"
          >
            <ChevronLeft size={24} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm border-border hover:bg-primary hover:text-primary-foreground transition-all h-12 w-12 rounded-full shadow-lg"
            aria-label="Next thought"
          >
            <ChevronRight size={24} />
          </Button>

          {/* Thought Card */}
          <div className="px-16 md:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.95 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="bg-card rounded-2xl p-8 md:p-12 shadow-xl border border-border text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-20 h-20 bg-gradient-to-br from-primary to-ashoka rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <IconComponent className="text-primary-foreground" size={36} />
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-3xl font-bold text-foreground mb-6"
                >
                  {currentThought.title}
                </motion.h3>

                {/* Content Lines */}
                <div className="space-y-3">
                  {currentThought.lines.map((line, idx) => (
                    <motion.p
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="text-lg md:text-xl text-muted-foreground leading-relaxed"
                    >
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {gratitudeThoughts.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-accent w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to thought ${index + 1}`}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          {currentIndex + 1} / {gratitudeThoughts.length}
        </div>
      </div>
    </section>
  );
};

export default GratitudeCarousel;
