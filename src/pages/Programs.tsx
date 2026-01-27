import { motion } from "framer-motion";
import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Lightbulb, Music, Calendar, Clock, MapPin } from "lucide-react";

const programCategories = [
  {
    icon: BookOpen,
    title: "बौद्धिक कार्यक्रम",
    color: "bg-blue-500",
    programs: [
      { name: "प्रश्नमंजुषा स्पर्धा", description: "डॉ. आंबेडकरांच्या जीवनावर आधारित" },
      { name: "वक्तृत्व स्पर्धा", description: "विविध विषयांवर विचार मांडणी" },
      { name: "निबंध स्पर्धा", description: "सामाजिक विषयांवर लेखन" },
    ],
  },
  {
    icon: Users,
    title: "सामाजिक कार्यक्रम",
    color: "bg-green-500",
    programs: [
      { name: "रक्तदान शिबीर", description: "वर्षातून एकदा रक्तदान" },
      { name: "आरोग्य शिबीर", description: "मोफत आरोग्य तपासणी" },
      { name: "वृक्षारोपण", description: "पर्यावरण जागृती" },
    ],
  },
  {
    icon: Lightbulb,
    title: "वैचारिक कार्यक्रम",
    color: "bg-amber-500",
    programs: [
      { name: "व्याख्यानमाला", description: "विचारवंतांची व्याख्याने" },
      { name: "पुस्तक वाचन", description: "आंबेडकरी साहित्य वाचन" },
      { name: "चर्चासत्र", description: "विविध विषयांवर चर्चा" },
    ],
  },
  {
    icon: Music,
    title: "सांस्कृतिक कार्यक्रम",
    color: "bg-purple-500",
    programs: [
      { name: "भिमगीत स्पर्धा", description: "आंबेडकरी गीतांचे गायन" },
      { name: "नृत्य स्पर्धा", description: "पारंपारिक व आधुनिक नृत्य" },
      { name: "नाटक", description: "सामाजिक विषयांवर नाटके" },
    ],
  },
];

const upcomingEvents = [
  {
    title: "आंबेडकर जयंती २०२५",
    date: "१४ एप्रिल २०२५",
    time: "सकाळी ६:०० वाजता",
    location: "डॉ. आंबेडकर चौक, लातूर",
  },
  {
    title: "प्रश्नमंजुषा स्पर्धा",
    date: "१३ एप्रिल २०२५",
    time: "दुपारी २:०० वाजता",
    location: "विचारमंच हॉल",
  },
];

const Programs = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              कार्यक्रम
            </h1>
            <p className="text-xl text-primary-foreground/70 max-w-3xl mx-auto">
              वैचारिक, बौद्धिक, सामाजिक व सांस्कृतिक उपक्रम
            </p>
          </motion.div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-accent/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              आगामी
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              पुढील कार्यक्रम
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="card-hover bg-card rounded-xl p-6 border-l-4 border-accent"
              >
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {event.title}
                </h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-accent" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-accent" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-accent" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Categories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-accent text-sm font-medium uppercase tracking-wider">
              विभाग
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
              कार्यक्रमांचे प्रकार
            </h2>
            <div className="decorative-line mt-4" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {programCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card-hover bg-card rounded-xl overflow-hidden border border-border"
              >
                <div className={`${category.color} p-6 flex items-center gap-4`}>
                  <category.icon className="text-white" size={32} />
                  <h3 className="text-xl font-semibold text-white">
                    {category.title}
                  </h3>
                </div>
                <div className="p-6">
                  <ul className="space-y-4">
                    {category.programs.map((program) => (
                      <li key={program.name} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-foreground">
                            {program.name}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {program.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Programs;
