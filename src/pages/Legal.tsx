import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import {
  Shield,
  FileText,
  Database,
  Scale,
  Copyright,
  Info,
  Code2,
} from "lucide-react";
import {
import { useSeo } from "@/hooks/useSeo";
  PLATFORM_NAME,
  PLATFORM_NAME_MR,
  ORGANIZATION,
  ORGANIZATION_MR,
  DEVELOPER,
  APP_VERSION,
  COPYRIGHT_LINE,
  DEVELOPER_LINE,
  RIGHTS_LINE,
} from "@/lib/attribution";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-card border border-border rounded-xl p-5 sm:p-6 space-y-3"
  >
    <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <Icon className="h-5 w-5 text-accent" />
      {title}
    </h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
      {children}
    </div>
  </motion.section>
);

const Legal = () => {
  useSeo({
    title: "कायदेशीर माहिती | विचारमंच लातूर",
    description: "गोपनीयता धोरण, वापर अटी, डेटा वापर व कॉपीराइट attribution ची माहिती.",
    canonical: "/legal",
  });

  return (
    <Layout>
      <section className="hero-gradient py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-3">
              कायदेशीर माहिती
            </h1>
            <p className="text-primary-foreground/70">
              प्लॅटफॉर्म, मालकी, गोपनीयता व वापर अटी
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-5 md:grid-cols-2">
        <Section icon={Info} title="प्लॅटफॉर्म माहिती">
          <dl className="grid grid-cols-[130px_1fr] gap-y-2 gap-x-3">
            <dt className="font-medium text-foreground">प्लॅटफॉर्म</dt>
            <dd>
              {PLATFORM_NAME_MR}
              <span className="block text-xs">{PLATFORM_NAME}</span>
            </dd>
            <dt className="font-medium text-foreground">संस्था</dt>
            <dd>
              {ORGANIZATION_MR}
              <span className="block text-xs">{ORGANIZATION}</span>
            </dd>
            <dt className="font-medium text-foreground">विकसक</dt>
            <dd>{DEVELOPER}</dd>
            <dt className="font-medium text-foreground">आवृत्ती</dt>
            <dd>v{APP_VERSION}</dd>
            <dt className="font-medium text-foreground">कॉपीराइट</dt>
            <dd>{COPYRIGHT_LINE}</dd>
          </dl>
        </Section>

        <Section icon={Copyright} title="कॉपीराइट व श्रेय">
          <p>{COPYRIGHT_LINE}</p>
          <p>
            {DEVELOPER_LINE} {RIGHTS_LINE}
          </p>
          <p className="pt-2 border-t border-border">
            <strong className="text-foreground">मालकीची स्पष्ट विभागणी:</strong>{" "}
            सॉफ्टवेअरची रचना, स्रोत संहिता व तांत्रिक अंमलबजावणी यांचे श्रेय व
            बौद्धिक संपदा {DEVELOPER} यांची आहे. मात्र समाज नोंदणी माहिती, सदस्य
            माहिती, छायाचित्रे, बोधचिन्ह (logo), लेखी मजकूर व संस्थात्मक सर्व
            आशय हे पूर्णतः {ORGANIZATION_MR} यांच्या मालकीचे आहेत. विकसक कंपनी
            या कोणत्याही समाज-आशयावर मालकी हक्क सांगत नाही.
          </p>
        </Section>

        <Section icon={Shield} title="गोपनीयता धोरण (Privacy Policy)">
          <p>
            नोंदणी, स्पर्धा सहभाग व प्रश्नमंजुषा यासाठी आवश्यक तेवढीच माहिती
            गोळा केली जाते. ही माहिती केवळ संस्थेच्या उपक्रमांसाठी वापरली जाते.
          </p>
          <p>
            सार्वजनिक पृष्ठांवर सहभागींची नावे व संपर्क क्रमांक दाखवले जात
            नाहीत — फक्त ओळख क्रमांक (ID) दिसतो. माहिती कोणत्याही
            जाहिरातदाराला किंवा तिसऱ्या पक्षाला विकली किंवा दिली जात नाही.
          </p>
          <p>
            माहिती काढून टाकण्याची विनंती संस्थेच्या अधिकृत ईमेलवर करता येते.
          </p>
        </Section>

        <Section icon={FileText} title="वापर अटी (Terms of Use)">
          <p>
            हे संकेतस्थळ {ORGANIZATION_MR} यांच्या सामाजिक उपक्रमांसाठी आहे. खोटी
            माहिती नोंदवणे, मतदान प्रणालीचा गैरवापर, प्रश्नमंजुषेत अप्रामाणिकपणा
            किंवा प्रणालीत अनधिकृत प्रवेश यास सक्त मनाई आहे.
          </p>
          <p>
            नियमभंग झाल्यास संबंधित नोंद रद्द करण्याचा अधिकार संस्थेकडे राखीव
            आहे. प्रशासकीय भाग केवळ अधिकृत वापरकर्त्यांसाठी मर्यादित आहे.
          </p>
        </Section>

        <Section icon={Database} title="माहिती वापर (Data Usage)">
          <p>
            माहिती सुरक्षित बॅकएंडवर साठवली जाते व प्रवेश नियम (RLS) द्वारे
            संरक्षित आहे. एकत्रित व नाव-रहित आकडेवारी अहवाल, आलेख व वार्षिक
            अभिलेखागारासाठी वापरली जाते.
          </p>
          <p>
            आर्थिक नोंदी (देणगी व खर्च) पारदर्शकतेसाठी सार्वजनिक स्वरूपात
            दाखवल्या जातात; वैयक्तिक संपर्क तपशील सार्वजनिक केले जात नाहीत.
          </p>
        </Section>

        <Section icon={Code2} title="तृतीय-पक्ष परवाने (Third-Party Licenses)">
          <p>
            हे सॉफ्टवेअर खालील मुक्त-स्रोत घटकांवर आधारित आहे, ज्यांचे परवाने
            त्यांच्या संबंधित मालकांकडे आहेत:
          </p>
          <ul className="grid grid-cols-2 gap-x-4 list-disc pl-5">
            {[
              "React (MIT)",
              "Vite (MIT)",
              "TypeScript (Apache-2.0)",
              "Tailwind CSS (MIT)",
              "shadcn/ui (MIT)",
              "Radix UI (MIT)",
              "Framer Motion (MIT)",
              "Recharts (MIT)",
              "lucide-react (ISC)",
              "Supabase JS (MIT)",
              "Google Fonts (OFL)",
            ].map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </Section>

        <Section icon={Scale} title="जबाबदारी मर्यादा">
          <p>
            प्रणाली "जशी आहे तशी" उपलब्ध करून दिली आहे. संस्थात्मक आशयाची
            अचूकता व जबाबदारी {ORGANIZATION_MR} यांची आहे; तांत्रिक देखभाल व
            सॉफ्टवेअर श्रेय {DEVELOPER} यांचे आहे.
          </p>
        </Section>
      </div>
    </Layout>
  );
};

export default Legal;
