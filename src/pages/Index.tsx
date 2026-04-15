import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";
import MediaGallerySection from "@/components/home/MediaGallerySection";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <HeroSection />
      <NoticeSection />
      <IntroSection />
      <MediaGallerySection />

      {/* Quiz CTA Button */}
      <section className="py-12 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Button
              size="lg"
              onClick={() => navigate("/quiz")}
              className="text-lg px-10 py-6 rounded-full shadow-lg hover:shadow-xl transition-all gap-3"
            >
              <BookOpen size={24} />
              प्रश्नमंजुषा
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
