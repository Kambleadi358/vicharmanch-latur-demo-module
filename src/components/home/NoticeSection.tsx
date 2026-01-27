import { motion } from "framer-motion";
import { Bell, Calendar, Clock } from "lucide-react";

const notices = [
  {
    id: 1,
    title: "आंबेडकर जयंती २०२५ तयारी बैठक",
    date: "१५ मार्च २०२५",
    description: "सर्व कार्यकर्त्यांसाठी महत्त्वाची बैठक. सायंकाळी ६ वाजता.",
    isNew: true,
  },
  {
    id: 2,
    title: "प्रश्नमंजुषा नोंदणी सुरू",
    date: "१ मार्च २०२५",
    description: "छोटा गट, मोठा गट आणि खुला गट यासाठी नोंदणी सुरू झाली आहे.",
    isNew: true,
  },
  {
    id: 3,
    title: "वार्षिक अहवाल प्रकाशित",
    date: "२० फेब्रुवारी २०२५",
    description: "२०२४ वर्षाचा संपूर्ण खाते अहवाल वेबसाइटवर उपलब्ध.",
    isNew: false,
  },
];

const NoticeSection = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 text-accent mb-4">
            <Bell className="animate-bounce" size={24} />
            <span className="text-sm font-medium uppercase tracking-wider">सूचना फलक</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            ताज्या सूचना व अपडेट्स
          </h2>
          <div className="decorative-line mt-4" />
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`card-hover bg-card rounded-xl p-6 border-2 ${
                notice.isNew ? "border-accent pulse-border" : "border-border"
              }`}
            >
              {notice.isNew && (
                <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full mb-4">
                  नवीन
                </span>
              )}
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {notice.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {notice.date}
                </span>
              </div>
              
              <p className="text-muted-foreground text-sm">
                {notice.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NoticeSection;
