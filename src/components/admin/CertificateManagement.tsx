import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Award, Printer, FileArchive } from "lucide-react";
import certificateTemplate from "@/assets/certificate-template.png";
import JSZip from "jszip";
import html2canvas from "html2canvas";

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
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

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

  const generateCertificateHTML = (winnerName: string, rank: string, category: string) => {
    const rankEnglish: Record<string, string> = {
      first: "1st",
      second: "2nd", 
      third: "3rd",
    };
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${winnerName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Tiro+Devanagari+Marathi:wght@400;500&display=swap');
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
            font-family: 'Tiro Devanagari Marathi', 'Noto Sans Devanagari', serif;
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
            left: 5%;
            top: 22%;
            width: 52%;
            height: 70%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 15px 25px;
            text-align: center;
          }
          .certificate-title {
            font-size: 38px;
            font-weight: 700;
            color: #1e3a5f;
            margin-bottom: 4px;
            letter-spacing: 2px;
          }
          .certificate-subtitle {
            font-size: 12px;
            color: #555;
            margin-bottom: 14px;
            letter-spacing: 3px;
            text-transform: uppercase;
          }
          .presented-to {
            font-size: 12px;
            color: #444;
            margin-bottom: 4px;
          }
          .winner-name {
            font-size: 30px;
            font-weight: 700;
            color: #1e3a5f;
            margin: 4px 0 12px 0;
            border-bottom: 2px solid #c9a227;
            padding-bottom: 4px;
            min-width: 200px;
            max-width: 90%;
            word-break: break-word;
          }
          .rank-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin: 10px 0;
          }
          .rank-line {
            width: 35px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #c9a227, transparent);
          }
          .rank-badge {
            font-size: 16px;
            font-weight: 700;
            color: #1e3a5f;
            background: linear-gradient(135deg, #f5e6c8 0%, #e8d9b0 50%, #dccb9a 100%);
            padding: 6px 22px;
            border-radius: 4px;
            border: 2px solid #c9a227;
            white-space: nowrap;
          }
          .category-text {
            font-size: 14px;
            color: #444;
            margin: 6px 0;
            font-weight: 500;
          }
          .program-name {
            font-size: 14px;
            font-weight: 600;
            color: #1e3a5f;
            margin: 6px 0 3px 0;
            max-width: 90%;
            word-break: break-word;
          }
          .program-date {
            font-size: 11px;
            color: #555;
          }
          .appreciation-text {
            font-size: 10px;
            color: #555;
            margin-top: 10px;
            font-style: italic;
          }
          @media print {
            html, body {
              width: 297mm;
              height: 210mm;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              overflow: hidden;
            }
            @page {
              size: A4 landscape;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="text-content">
            <div class="certificate-title">प्रमाणपत्र</div>
            <div class="certificate-subtitle">Certificate of Achievement</div>
            <div class="presented-to">हे प्रमाणपत्र याद्वारे प्रदान करण्यात येते</div>
            <div class="winner-name">${winnerName}</div>
            <div class="rank-container">
              <div class="rank-line"></div>
              <div class="rank-badge">${rankLabels[rank]} क्रमांक (${rankEnglish[rank]})</div>
              <div class="rank-line"></div>
            </div>
            <div class="category-text">वर्ग: ${category}</div>
            <div class="program-name">${selectedProgram?.name || ""}</div>
            <div class="program-date">दिनांक: ${selectedProgram?.date || ""}</div>
            <div class="appreciation-text">आपल्या उत्कृष्ट कामगिरीबद्दल हार्दिक अभिनंदन</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const printCertificate = (winnerName: string, rank: string, category: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("कृपया पॉप-अप ब्लॉकर बंद करा");
      return;
    }

    const certificateHtml = generateCertificateHTML(winnerName, rank, category) + `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 500);
        }
      </script>
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
      }, index * 1000);
    });

    toast.success(`${allWinners.length} प्रमाणपत्रे तयार होत आहेत`);
  };

  const downloadAllAsZip = async () => {
    if (allWinners.length === 0) {
      toast.error("कोणतेही विजेते नाहीत");
      return;
    }

    setIsGeneratingZip(true);
    toast.info("ZIP फाईल तयार होत आहे...");

    try {
      const zip = new JSZip();
      const certificatesFolder = zip.folder("certificates");

      for (let i = 0; i < allWinners.length; i++) {
        const winner = allWinners[i];
        
        // Create a temporary container
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-9999px";
        container.style.top = "0";
        container.style.width = "1123px"; // A4 landscape width at 96dpi
        container.style.height = "794px"; // A4 landscape height at 96dpi
        document.body.appendChild(container);

        // Create certificate element
        const certElement = document.createElement("div");
        certElement.style.width = "100%";
        certElement.style.height = "100%";
        certElement.style.position = "relative";
        certElement.style.backgroundImage = `url('${certificateTemplate}')`;
        certElement.style.backgroundSize = "cover";
        certElement.style.backgroundPosition = "center";
        certElement.style.fontFamily = "'Noto Sans Devanagari', sans-serif";

        const rankEnglish: Record<string, string> = { first: "1st", second: "2nd", third: "3rd" };
        
        certElement.innerHTML = `
          <div style="position: absolute; left: 5%; top: 25%; width: 52%; height: 68%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: 700; color: #1e3a5f; margin-bottom: 4px; letter-spacing: 2px;">प्रमाणपत्र</div>
            <div style="font-size: 10px; color: #555; margin-bottom: 12px; letter-spacing: 3px; text-transform: uppercase;">Certificate of Achievement</div>
            <div style="font-size: 10px; color: #444; margin-bottom: 4px;">हे प्रमाणपत्र याद्वारे प्रदान करण्यात येते</div>
            <div style="font-size: 24px; font-weight: 700; color: #1e3a5f; margin: 4px 0 10px 0; border-bottom: 2px solid #c9a227; padding-bottom: 4px; min-width: 180px; word-break: break-word; max-width: 90%;">${winner.name}</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin: 6px 0;">
              <div style="width: 20px; height: 2px; background: linear-gradient(90deg, transparent, #c9a227);"></div>
              <div style="font-size: 13px; font-weight: 700; color: #1e3a5f; background: linear-gradient(135deg, #f5e6c8 0%, #e8d9b0 50%, #dccb9a 100%); padding: 5px 16px; border-radius: 4px; border: 2px solid #c9a227; white-space: nowrap;">${rankLabels[winner.rank]} क्रमांक (${rankEnglish[winner.rank]})</div>
              <div style="width: 20px; height: 2px; background: linear-gradient(90deg, #c9a227, transparent);"></div>
            </div>
            <div style="font-size: 12px; color: #444; margin: 6px 0; font-weight: 500;">वर्ग: ${winner.category}</div>
            <div style="font-size: 12px; font-weight: 600; color: #1e3a5f; margin: 6px 0 2px 0; max-width: 90%; word-break: break-word;">${selectedProgram?.name || ""}</div>
            <div style="font-size: 9px; color: #555;">दिनांक: ${selectedProgram?.date || ""}</div>
            <div style="font-size: 8px; color: #555; margin-top: 8px; font-style: italic;">आपल्या उत्कृष्ट कामगिरीबद्दल हार्दिक अभिनंदन</div>
          </div>
        `;

        container.appendChild(certElement);

        // Wait for image to load
        await new Promise(resolve => setTimeout(resolve, 300));

        // Capture as canvas
        const canvas = await html2canvas(certElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });

        // Convert to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), "image/png", 1.0);
        });

        // Add to zip
        const fileName = `${winner.name}_${rankLabels[winner.rank]}_${winner.category}.png`;
        certificatesFolder?.file(fileName, blob);

        // Cleanup
        document.body.removeChild(container);
      }

      // Generate and download zip
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedProgram?.name || "certificates"}_प्रमाणपत्रे.zip`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success(`${allWinners.length} प्रमाणपत्रे ZIP मध्ये डाउनलोड झाली!`);
    } catch (error) {
      console.error("ZIP generation error:", error);
      toast.error("ZIP तयार करताना त्रुटी आली");
    } finally {
      setIsGeneratingZip(false);
    }
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">विजेते यादी</h3>
              {allWinners.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={downloadAllAsZip} 
                    variant="default"
                    className="gap-2"
                    disabled={isGeneratingZip}
                  >
                    <FileArchive className="h-4 w-4" />
                    {isGeneratingZip ? "तयार होत आहे..." : `ZIP डाउनलोड करा (${allWinners.length})`}
                  </Button>
                  <Button onClick={printAllCertificates} variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    सर्व प्रिंट करा
                  </Button>
                </div>
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
            <h4 className="text-sm font-medium mb-3">प्रमाणपत्र नमुना (Landscape A4)</h4>
            <div 
              ref={certificateRef}
              className="relative w-full max-w-3xl mx-auto border rounded-lg overflow-hidden shadow-lg"
              style={{ aspectRatio: "297/210" }}
            >
              <img
                src={certificateTemplate}
                alt="Certificate Template"
                className="w-full h-full object-cover"
              />
              <div className="absolute left-0 top-0 w-[57%] h-full flex items-center justify-center p-4">
                <div className="text-center space-y-0.5">
                  <p className="text-sm font-bold text-primary uppercase tracking-wider">प्रमाणपत्र</p>
                  <p className="text-[5px] text-muted-foreground tracking-widest">CERTIFICATE OF ACHIEVEMENT</p>
                  <p className="text-[5px] text-foreground mt-1">हे प्रमाणपत्र याद्वारे प्रदान करण्यात येते</p>
                  <p className="text-[10px] font-bold text-accent border-b border-accent pb-0.5 inline-block min-w-[80px] leading-tight">
                    {allWinners[0]?.name || "विजेत्याचे नाव"}
                  </p>
                  <div className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 px-2 py-0.5 rounded-full inline-block">
                    <p className="text-[6px] font-bold text-primary">
                      🏆 {rankLabels[allWinners[0]?.rank || "first"]} क्रमांक 🏆
                    </p>
                  </div>
                  <p className="text-[6px] leading-tight">वर्ग: {allWinners[0]?.category}</p>
                  <p className="text-[7px] font-semibold text-primary leading-tight">{selectedProgram?.name}</p>
                  <p className="text-[5px] text-muted-foreground">दिनांक: {selectedProgram?.date}</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              * हा फक्त नमुना आहे. प्रिंट/डाउनलोड केल्यावर A4 Landscape स्वरूपात प्रमाणपत्र तयार होईल.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificateManagement;
