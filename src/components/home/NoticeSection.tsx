import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  title: string;
  description: string | null;
  date: string;
  is_new: boolean | null;
  notice_type: string;
}

const NoticeSection = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, description, date, is_new, notice_type")
        .eq("is_visible", true)
        .eq("notice_type", "notice")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) {
        setNotices(data);
      }
      setIsLoading(false);
    };

    fetchNotices();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse flex flex-col items-center gap-4">
              <div className="h-8 w-48 bg-muted rounded"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (notices.length === 0) return null;

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
                notice.is_new ? "border-accent pulse-border" : "border-border"
              }`}
            >
              {notice.is_new && (
                <span className="inline-block px-3 py-1 bg-accent text-accent-foreground text-xs font-semibold rounded-full mb-4">
                  नवीन
                </span>
              )}
              <div className="flex items-start gap-3 mb-2">
                <FileText className="text-accent mt-1" size={18} />
                <h3 className="text-lg font-semibold text-foreground">{notice.title}</h3>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 ml-7">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {notice.date}
                </span>
              </div>
              <p className="text-muted-foreground text-sm ml-7">{notice.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NoticeSection;
