import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { BookOpen, Users, Music, Calendar, Clock, MapPin, Trophy, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const programCategories = [
  {
    icon: BookOpen,
    title: "बौद्धिक कार्यक्रम",
    color: "bg-blue-500",
    programs: [
      { name: "प्रश्नमंजुषा", description: "बौद्धिक ज्ञानावर आधारित स्पर्धा" },
      { name: "वक्तृत्व", description: "विविध विषयांवर विचार मांडणी" },
      { name: "भाषण", description: "प्रेरणादायी व वैचारिक भाषणे" },
      { name: "निबंध", description: "सामाजिक विषयांवर लेखन स्पर्धा" },
      { name: "सुंदर हस्ताक्षर", description: "सुवाच्य व सुंदर लेखन स्पर्धा" },
      { name: "संविधान वाचन", description: "भारतीय संविधानाचे वाचन" },
    ],
  },
  {
    icon: Users,
    title: "सामाजिक कार्यक्रम",
    color: "bg-green-500",
    programs: [
      { name: "अवयव दान शिबीर", description: "अवयव दानाची जागृती व नोंदणी" },
      { name: "योग आणि ध्यान", description: "शारीरिक व मानसिक आरोग्यासाठी" },
      { name: "सामाजिक उपक्रम", description: "विविध सामाजिक जागृती उपक्रम" },
    ],
  },
  {
    icon: Music,
    title: "सांस्कृतिक कार्यक्रम",
    color: "bg-purple-500",
    programs: [
      { name: "गीतगायन", description: "आंबेडकरी व बौद्ध गीतांचे गायन" },
      { name: "नृत्य", description: "पारंपारिक व आधुनिक नृत्य स्पर्धा" },
      { name: "काव्यवाचन", description: "कविता वाचन व सादरीकरण" },
      { name: "संगीत खुर्ची", description: "मनोरंजनात्मक खेळ" },
      { name: "लिंबू चमचा", description: "पारंपारिक खेळ स्पर्धा" },
      { name: "वेशभूषा", description: "महापुरुषांची वेशभूषा स्पर्धा" },
      { name: "पाककला", description: "पाककला स्पर्धा" },
      { name: "रांगोळी", description: "रांगोळी कला स्पर्धा" },
    ],
  },
];

interface Program {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string | null;
  status: string;
  description: string | null;
}

interface ProgramWinner {
  id: string;
  program_id: string;
  category: string;
  first_place: string | null;
  second_place: string | null;
  third_place: string | null;
}

const Programs = () => {
  // Fetch programs from database
  const { data: dbPrograms, isLoading } = useQuery({
    queryKey: ["public-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("is_visible", true)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  const upcomingPrograms = dbPrograms?.filter((p) => p.status === "upcoming") || [];
  const completedPrograms = dbPrograms?.filter((p) => p.status === "completed") || [];

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

      {/* Upcoming Events from Database */}
      {upcomingPrograms.length > 0 && (
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
              {upcomingPrograms.map((program, index) => (
                <motion.div
                  key={program.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="card-hover bg-card rounded-xl p-6 border-l-4 border-accent"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xl font-semibold text-foreground mb-4">
                      {program.name}
                    </h3>
                    <Badge className="bg-accent text-accent-foreground">आगामी</Badge>
                  </div>
                  {program.description && (
                    <p className="text-muted-foreground mb-4">{program.description}</p>
                  )}
                  <div className="space-y-2 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-accent" />
                      <span>{program.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-accent" />
                      <span>{program.time}</span>
                    </div>
                    {program.location && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-accent" />
                        <span>{program.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Completed Events with Winners */}
      {completedPrograms.length > 0 && (
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="text-accent text-sm font-medium uppercase tracking-wider">
                पूर्ण झालेले
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
                मागील कार्यक्रम
              </h2>
              <div className="decorative-line mt-4" />
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedPrograms.map((program, index) => (
                <ProgramCard key={program.id} program={program} index={index} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading state */}
      {isLoading && (
        <section className="py-16 bg-accent/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-muted-foreground">कार्यक्रम लोड होत आहेत...</p>
          </div>
        </section>
      )}

      {/* Program Categories */}
      <section className="py-20 bg-muted/30">
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

// Separate component for program card with winners
const ProgramCard = ({ program, index }: { program: Program; index: number }) => {
  const { data: winners } = useQuery({
    queryKey: ["program-winners", program.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_winners")
        .select("*")
        .eq("program_id", program.id);
      if (error) throw error;
      return data as ProgramWinner[];
    },
  });

  const hasWinners = winners && winners.some(
    (w) => w.first_place || w.second_place || w.third_place
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="card-hover bg-card rounded-xl p-6 border border-border"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{program.name}</h3>
        <CheckCircle size={20} className="text-green-500" />
      </div>
      <div className="space-y-2 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-accent" />
          <span>{program.date}</span>
        </div>
        {program.location && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-accent" />
            <span>{program.location}</span>
          </div>
        )}
      </div>

      {hasWinners && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Trophy className="mr-2 h-4 w-4 text-accent" />
              विजेते पहा
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                {program.name} - विजेते
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {winners?.map((winner) => (
                (winner.first_place || winner.second_place || winner.third_place) && (
                  <div key={winner.id} className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-semibold text-accent mb-3">{winner.category}</h4>
                    <div className="space-y-2 text-sm">
                      {winner.first_place && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥇</span>
                          <span className="font-medium">प्रथम:</span>
                          <span>{winner.first_place}</span>
                        </div>
                      )}
                      {winner.second_place && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥈</span>
                          <span className="font-medium">द्वितीय:</span>
                          <span>{winner.second_place}</span>
                        </div>
                      )}
                      {winner.third_place && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🥉</span>
                          <span className="font-medium">तृतीय:</span>
                          <span>{winner.third_place}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
};

export default Programs;
