import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import DailyArticle from "@/components/home/DailyArticle";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";
import MediaGallerySection from "@/components/home/MediaGallerySection";
import { useSeo } from "@/hooks/useSeo";

const Index = () => {
  useSeo({
    title: "विचारमंच लातूर | डॉ. बाबासाहेब आंबेडकर विचारमंच",
    description: "भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर — अध्यक्षविहीन, विचारकेंद्रित व पारदर्शक चळवळ. संविधान साक्षरता, उपक्रम व खुली खातेवही.",
    canonical: "/",
  });

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

