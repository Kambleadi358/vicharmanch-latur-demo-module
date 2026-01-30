import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Calendar, FileText, ScrollText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [meetingMinutes, setMeetingMinutes] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("id, title, description, date, is_new, notice_type")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data) {
        setNotices(data.filter(n => n.notice_type === "notice"));
        setMeetingMinutes(data.filter(n => n.notice_type === "meeting_minutes"));
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

  if (notices.length === 0 && meetingMinutes.length === 0) {
    return null;
  }

  const NoticeCard = ({ notice, index }: { notice: Notice; index: number }) => (
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
        {notice.notice_type === "meeting_minutes" ? (
          <ScrollText className="text-primary mt-1" size={18} />
        ) : (
          <FileText className="text-accent mt-1" size={18} />
        )}
        <h3 className="text-lg font-semibold text-foreground">
          {notice.title}
        </h3>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 ml-7">
        <span className="flex items-center gap-1">
          <Calendar size={14} />
          {notice.date}
        </span>
      </div>
      
      <p className="text-muted-foreground text-sm ml-7">
        {notice.description}
      </p>
    </motion.div>
  );

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

        <Tabs defaultValue="notices" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="notices" className="flex items-center gap-2">
              <FileText size={16} />
              सूचना ({notices.length})
            </TabsTrigger>
            <TabsTrigger value="minutes" className="flex items-center gap-2">
              <ScrollText size={16} />
              इतिवृत्त ({meetingMinutes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notices">
            {notices.length === 0 ? (
              <p className="text-center text-muted-foreground">सध्या कोणतीही सूचना नाही</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notices.map((notice, index) => (
                  <NoticeCard key={notice.id} notice={notice} index={index} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="minutes">
            {meetingMinutes.length === 0 ? (
              <p className="text-center text-muted-foreground">सध्या कोणतेही इतिवृत्त नाही</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetingMinutes.map((notice, index) => (
                  <NoticeCard key={notice.id} notice={notice} index={index} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export default NoticeSection;
