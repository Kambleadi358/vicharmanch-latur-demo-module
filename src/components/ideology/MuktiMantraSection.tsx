import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";

const twentyTwoVows = [
  "मी ब्रह्मा, विष्णू, महेश यांना देव मानणार नाही किंवा त्यांची उपासना करणार नाही.",
  "मी राम व कृष्ण यांना देव मानणार नाही किंवा त्यांची उपासना करणार नाही.",
  "मी गौरी-गणपती इत्यादी हिंदू धर्मातील कोणत्याही देव-देवतेस मानणार नाही किंवा त्यांची उपासना करणार नाही.",
  "देवाने अवतार घेतले, यावर माझा विश्वास नाही.",
  "गौतम बुद्ध हा विष्णूचा अवतार होय, हा खोटा आणि खोडसळ प्रचार होय असे मी मानतो.",
  "मी श्राद्धपक्ष करणार नाही; पिंडदान करणार नाही.",
  "मी बौद्धधम्माच्या विरुद्ध विसंगत असे कोणतेही आचरण करणार नाही.",
  "मी कोणतेही क्रियाकर्म ब्राह्मणाचे हातून करवून घेणार नाही.",
  "सर्व मनुष्यमात्र समान आहेत असे मी मानतो.",
  "मी समता स्थापन करण्याचा प्रयत्न करीन.",
  "मी तथागत बुद्धाने सांगितलेल्या अष्टांग मार्गाचा अवलंब करीन.",
  "तथागताने सांगितलेल्या दहा पारमिता मी पाळीन.",
  "मी सर्व प्राणिमात्रावर दया करीन, त्यांचे लालन पालन करीन.",
  "मी चोरी करणार नाही.",
  "मी व्याभिचार करणार नाही.",
  "मी खोटे बोलणार नाही.",
  "मी दारू पिणार नाही.",
  "ज्ञान (प्रज्ञा), शील, करुणा या बौद्धधम्माच्या तीन तत्त्वांची सांगड घालून मी माझे जीवन व्यतीत करीन.",
  "माझ्या जुन्या, मनुष्यमात्राच्या उत्कर्षाला हानिकारक असणाऱ्या व मनुष्यमात्राला असमान व नीच मानणाऱ्या हिंदू धर्माचा मी त्याग करतो व बौद्धधम्माचा स्वीकार करतो.",
  "तोच सद्धम्म आहे अशी माझी खात्री पटलेली आहे.",
  "आज माझा नवा जन्म होत आहे असे मी मानतो.",
  "इतःपर मी बुद्धाच्या शिकवणुकीप्रमाणे वागेन अशी प्रतिज्ञा करतो."
];

const AUTO_SLIDE_INTERVAL = 8000; // 8 seconds for reading

const MuktiMantraSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % twentyTwoVows.length);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + twentyTwoVows.length) % twentyTwoVows.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(goToNext, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, goToNext]);

  return (
    <section className="py-20 bg-gradient-to-b from-background to-secondary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary rounded-full blur-3xl" />
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
            २२ प्रतिज्ञा
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 flex items-center justify-center gap-3">
            <Scroll className="h-8 w-8 text-accent" />
            मुक्तिमंत्र
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            डॉ. बाबासाहेब आंबेडकरांनी बौद्धांना दिलेल्या २२ प्रतिज्ञा
          </p>
          <div className="decorative-line mt-4" />
        </motion.div>

        {/* Carousel Container */}
        <div
          className="relative min-h-[280px] md:min-h-[240px]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Arrows */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground transition-all h-12 w-12 rounded-full shadow-lg"
            aria-label="Previous vow"
          >
            <ChevronLeft size={24} />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-card/80 backdrop-blur-sm border-border hover:bg-accent hover:text-accent-foreground transition-all h-12 w-12 rounded-full shadow-lg"
            aria-label="Next vow"
          >
            <ChevronRight size={24} />
          </Button>

          {/* Vow Card */}
          <div className="px-16 md:px-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="bg-gradient-to-br from-card via-card to-secondary/50 rounded-2xl p-8 md:p-12 shadow-2xl border border-accent/20 text-center"
              >
                {/* Vow Number Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-accent/70 rounded-full mb-6 shadow-lg"
                >
                  <span className="text-2xl font-bold text-accent-foreground">
                    {currentIndex + 1}
                  </span>
                </motion.div>

                {/* Vow Text */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl md:text-2xl text-foreground leading-relaxed font-medium"
                >
                  {twentyTwoVows[currentIndex]}
                </motion.p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-1.5 mt-8 flex-wrap max-w-lg mx-auto">
          {twentyTwoVows.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "bg-accent scale-125"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to vow ${index + 1}`}
            />
          ))}
        </div>

        {/* Counter */}
        <div className="text-center mt-4 text-sm text-muted-foreground">
          प्रतिज्ञा {currentIndex + 1} / {twentyTwoVows.length}
        </div>

        {/* Closing Pledge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
            <p className="text-lg text-foreground font-medium italic">
              "या २२ प्रतिज्ञांचे पालन करीनसे मी प्रतिज्ञा करतो/करते."
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MuktiMantraSection;
