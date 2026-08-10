import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import DailyArticle from "@/components/home/DailyArticle";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";
import MediaGallerySection from "@/components/home/MediaGallerySection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <DailyArticle />
      <NoticeSection />
      <IntroSection />
      <MediaGallerySection />
    </Layout>
  );
};

export default Index;

