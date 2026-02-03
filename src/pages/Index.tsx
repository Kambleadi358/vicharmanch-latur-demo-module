import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <NoticeSection />
      <IntroSection />
    </Layout>
  );
};

export default Index;
