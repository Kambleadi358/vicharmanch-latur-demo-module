import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import NoticeSection from "@/components/home/NoticeSection";
import IntroSection from "@/components/home/IntroSection";
import StatsSection from "@/components/home/StatsSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <NoticeSection />
      <IntroSection />
      <StatsSection />
    </Layout>
  );
};

export default Index;
