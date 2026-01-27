import { motion } from "framer-motion";

const stats = [
  { value: "६८+", label: "वर्षांची परंपरा" },
  { value: "५००+", label: "कार्यकर्ते" },
  { value: "२५+", label: "वार्षिक कार्यक्रम" },
  { value: "१००%", label: "पारदर्शकता" },
];

const StatsSection = () => {
  return (
    <section className="py-16 hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-bold text-accent mb-2">
                {stat.value}
              </div>
              <div className="text-primary-foreground/70 text-sm md:text-base">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
