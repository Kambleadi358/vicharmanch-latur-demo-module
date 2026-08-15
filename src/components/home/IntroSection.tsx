import { motion } from "framer-motion";
import { Users, BookOpen, Heart, Award } from "lucide-react";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Users,
    title: "अध्यक्षविहीन",
    description: "कोणताही अध्यक्ष नाही, व्यक्तिपूजेच्या विरुद्ध",
  },
  {
    icon: BookOpen,
    title: "विचारकेंद्रित",
    description: "विचारप्रधान सामूहिक चळवळ",
  },
  {
    icon: Heart,
    title: "पारदर्शक",
    description: "संपूर्ण खाते माहितीमध्ये एक-एक रुपयाचा हिशोब",
  },
  {
    icon: Award,
    title: "संविधानवादी",
    description: "संविधान साक्षरता — समता, बंधुता, न्याय, स्वातंत्र्य",
  },
];


const IntroSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div>
              <span className="text-accent text-sm font-medium uppercase tracking-wider">
                परिचय
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                विचारमंच म्हणजे काय?
              </h2>
              <div className="decorative-line mt-4 mx-0" />
            </div>

            <p className="text-muted-foreground text-lg leading-relaxed">
              भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच, लातूर ही एक विचारकेंद्रित चळवळ आहे जी 
              मुख्यतः आंबेडकर जयंती च्या निमित्ताने विविध वैचारिक, बौद्धिक, सामाजिक व सांस्कृतिक 
              कार्यक्रमांचे आयोजन करते.
            </p>

            <p className="text-muted-foreground leading-relaxed">
              आमची चळवळ ही व्यक्तिपूजेच्या विरुद्ध आहे. येथे कोणताही अध्यक्ष नाही, कोणताही 
              एकमेव नेता नाही. फक्त विचार आहेत – समता, बंधुता, न्याय यांचे विचार.
            </p>

            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-accent font-medium hover:gap-4 transition-all"
            >
              अधिक जाणून घ्या
              <span>→</span>
            </Link>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-hover bg-card rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
