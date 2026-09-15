import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { MapPin, Mail, Instagram } from "lucide-react";
import ambedkarPortrait from "@/assets/ambedkar-portrait.png";
import CommunityInsights from "@/components/home/CommunityInsights";
import { useSeo } from "@/hooks/useSeo";

const About = () => {
  useSeo({
    title: "आमच्याबद्दल | विचारमंच लातूर",
    description: "विचारमंचाची ओळख, कार्यपद्धती व सामुदायिक आकडेवारी — अध्यक्षविहीन व पारदर्शक चळवळीची माहिती.",
    canonical: "/about",
  });

  return (
    <Layout>
      {/* Hero */}
      <section className="hero-gradient py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-4">आमच्याबद्दल</h1>
            <p className="text-lg md:text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              पारदर्शक आकडेवारीतून समाजाची प्रगती
            </p>
          </motion.div>
        </div>
      </section>

      {/* Compact आमची ओळख */}
      <section className="py-14 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-[220px_1fr] gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="mx-auto"
            >
              <img
                src={ambedkarPortrait} alt="डॉ. बाबासाहेब आंबेडकर"
                className="w-52 h-auto rounded-xl object-cover shadow-xl border-4 border-accent"
                loading="eager" decoding="async"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="space-y-3"
            >
              <span className="text-accent text-xs font-medium uppercase tracking-wider">आमची ओळख</span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">विचारमंच, लातूर</h2>
              <p className="text-muted-foreground leading-relaxed">
                भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर ही अध्यक्षविहीन, विचारकेंद्रित व
                पारदर्शक सामाजिक चळवळ आहे. आमची तत्त्वे व मूल्ये पाहण्यासाठी{" "}
                <a href="/ideology" className="text-accent underline underline-offset-2">विचारधारा</a>{" "}
                पहा.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 text-sm pt-1">
                <span className="flex items-center gap-1.5"><MapPin className="text-accent h-4 w-4" /> लातूर</span>
                <a href="mailto:vicharmach1956@gmail.com" className="flex items-center gap-1.5 hover:text-accent">
                  <Mail className="text-accent h-4 w-4" /> vicharmach1956@gmail.com
                </a>
                <a href="https://instagram.com/dr.ambedkar_vicharmanch" target="_blank" rel="noopener noreferrer"
                   className="flex items-center gap-1.5 hover:text-accent">
                  <Instagram className="text-accent h-4 w-4" /> @dr.ambedkar_vicharmanch
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Insights — main focus */}
      <CommunityInsights />
    </Layout>
  );
};

export default About;
