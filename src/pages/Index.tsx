import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";
import MediaGallerySection from "@/components/home/MediaGallerySection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <NoticeSection />
      <IntroSection />
      <MediaGallerySection />
    </Layout>
  );
};

export default Index;
