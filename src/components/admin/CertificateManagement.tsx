import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Award, Printer } from "lucide-react";
import certificateTemplate from "@/assets/certificate-template.png";

interface Program {
  id: string;
  name: string;
  date: string;
  status: string;
}

interface ProgramWinner {
  id: string;
  program_id: string;
  category: string;
  first_place: string | null;
  second_place: string | null;
  third_place: string | null;
}

const rankLabels: Record<string, string> = {
  first: "प्रथम",
  second: "द्वितीय",
  third: "तृतीय",
};

const CertificateManagement = () => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch completed programs
  const { data: programs } = useQuery({
    queryKey: ["completed-programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("status", "completed")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Program[];
    },
  });

  // Fetch winners for selected program
  const { data: winners, isLoading: winnersLoading } = useQuery({
    queryKey: ["program-winners-cert", selectedProgramId],
    queryFn: async () => {
      if (!selectedProgramId) return [];
      const { data, error } = await supabase
        .from("program_winners")
        .select("*")
        .eq("program_id", selectedProgramId);
      if (error) throw error;
      return data as ProgramWinner[];
    },
    enabled: !!selectedProgramId,
  });

  const selectedProgram = programs?.find((p) => p.id === selectedProgramId);

  // Generate all winners list with their rank and category
  const allWinners = winners?.flatMap((w) => {
    const winnersList = [];
    if (w.first_place) {
      winnersList.push({ name: w.first_place, rank: "first", category: w.category });
    }
    if (w.second_place) {
      winnersList.push({ name: w.second_place, rank: "second", category: w.category });
    }
    if (w.third_place) {
      winnersList.push({ name: w.third_place, rank: "third", category: w.category });
    }
    return winnersList;
  }) || [];

  const printCertificate = (winnerName: string, rank: string, category: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("कृपया पॉप-अप ब्लॉकर बंद करा");
      return;
    }

    const certificateHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>प्रमाणपत्र - ${winnerName}</title>
        <style>
          @page { 
            size: A4 landscape; 
            margin: 0; 
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Noto Sans Devanagari', 'Mangal', sans-serif;
            width: 297mm;
            height: 210mm;
            position: relative;
            background: #fff;
          }
          .certificate-container {
            width: 100%;
            height: 100%;
            position: relative;
            background-image: url('${certificateTemplate}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }
          .text-content {
            position: absolute;
            left: 40px;
            top: 50%;
            transform: translateY(-50%);
            width: 45%;
            text-align: center;
            padding: 20px;
          }
          .certificate-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 15px;
          }
          .certificate-subtitle {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
          }
          .winner-name {
            font-size: 32px;
            font-weight: bold;
            color: #b8860b;
            margin: 20px 0;
            border-bottom: 2px solid #b8860b;
            padding-bottom: 10px;
          }
          .rank-badge {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 15px 0;
          }
          .category-text {
            font-size: 18px;
            color: #444;
            margin: 10px 0;
          }
          .program-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
            margin: 15px 0;
          }
          .program-date {
            font-size: 14px;
            color: #666;
            margin-top: 15px;
          }
          .appreciation-text {
            font-size: 14px;
            color: #333;
            margin: 15px 0;
            line-height: 1.6;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="text-content">
            <div class="certificate-title">🏆 प्रमाणपत्र 🏆</div>
            <div class="certificate-subtitle">Certificate of Achievement</div>
            <div class="appreciation-text">
              हे प्रमाणपत्र याद्वारे प्रदान करण्यात येते की
            </div>
            <div class="winner-name">${winnerName}</div>
            <div class="rank-badge">🎖️ ${rankLabels[rank]} क्रमांक 🎖️</div>
            <div class="category-text">वर्ग: ${category}</div>
            <div class="program-name">${selectedProgram?.name || ""}</div>
            <div class="program-date">दिनांक: ${selectedProgram?.date || ""}</div>
            <div class="appreciation-text" style="margin-top: 25px;">
              आपल्या उत्कृष्ट कामगिरीबद्दल हार्दिक अभिनंदन!
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(certificateHtml);
    printWindow.document.close();
  };

  const printAllCertificates = () => {
    if (allWinners.length === 0) {
      toast.error("कोणतेही विजेते नाहीत");
      return;
    }

    allWinners.forEach((winner, index) => {
      setTimeout(() => {
        printCertificate(winner.name, winner.rank, winner.category);
      }, index * 1000); // Stagger prints to avoid browser blocking
    });

    toast.success(`${allWinners.length} प्रमाणपत्रे तयार होत आहेत`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          प्रमाणपत्र व्यवस्थापन
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Program Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">कार्यक्रम निवडा (पूर्ण झालेले)</label>
          <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="कार्यक्रम निवडा..." />
            </SelectTrigger>
            <SelectContent>
              {programs?.map((program) => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name} - {program.date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Winners List */}
        {selectedProgramId && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">विजेते यादी</h3>
              {allWinners.length > 0 && (
                <Button onClick={printAllCertificates} className="gap-2">
                  <Printer className="h-4 w-4" />
                  सर्व प्रमाणपत्रे प्रिंट करा ({allWinners.length})
                </Button>
              )}
            </div>

            {winnersLoading ? (
              <p className="text-muted-foreground">लोड होत आहे...</p>
            ) : allWinners.length === 0 ? (
              <p className="text-muted-foreground">या कार्यक्रमासाठी अद्याप विजेते घोषित केलेले नाहीत</p>
            ) : (
              <div className="grid gap-3">
                {allWinners.map((winner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {winner.rank === "first" && "🥇"}
                        {winner.rank === "second" && "🥈"}
                        {winner.rank === "third" && "🥉"}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{winner.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{winner.category}</Badge>
                          <span>•</span>
                          <span>{rankLabels[winner.rank]} क्रमांक</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printCertificate(winner.name, winner.rank, winner.category)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      प्रमाणपत्र
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Certificate Preview */}
        {selectedProgramId && allWinners.length > 0 && (
          <div className="mt-6 p-4 border rounded-lg bg-muted/20">
            <h4 className="text-sm font-medium mb-3">प्रमाणपत्र नमुना</h4>
            <div className="relative w-full aspect-[297/210] max-w-2xl mx-auto border rounded-lg overflow-hidden shadow-lg">
              <img
                src={certificateTemplate}
                alt="Certificate Template"
                className="w-full h-full object-cover"
              />
              <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center p-8">
                <div className="text-center space-y-2">
                  <p className="text-xs text-primary font-bold">🏆 प्रमाणपत्र 🏆</p>
                  <p className="text-[10px] text-muted-foreground">Certificate of Achievement</p>
                  <p className="text-sm font-bold text-accent border-b border-accent pb-1">
                    {allWinners[0]?.name || "विजेत्याचे नाव"}
                  </p>
                  <p className="text-xs font-semibold text-primary">
                    🎖️ {rankLabels[allWinners[0]?.rank || "first"]} क्रमांक 🎖️
                  </p>
                  <p className="text-[10px]">वर्ग: {allWinners[0]?.category}</p>
                  <p className="text-xs font-medium">{selectedProgram?.name}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * हा फक्त नमुना आहे. प्रिंट केल्यावर A4 Landscape स्वरूपात प्रमाणपत्र तयार होईल.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateManagement;
