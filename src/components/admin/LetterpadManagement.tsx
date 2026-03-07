import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer, RotateCcw } from "lucide-react";
import letterpadBg from "@/assets/letterpad-template.png";

const LABEL_COLOR = "#0EA5E9"; // Sky blue for labels

const LetterpadManagement = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const [serialCounter, setSerialCounter] = useState(1);

  const [letterData, setLetterData] = useState({
    date: new Date().toLocaleDateString("mr-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    receiverLine1: "",
    receiverLine2: "",
    receiverLine3: "",
    subject: "",
    body: "",
  });

  const referenceId = `VM-${currentYear}-${String(serialCounter).padStart(3, "0")}`;

  const handleReset = () => {
    setSerialCounter((prev) => prev + 1);
    setLetterData({
      date: new Date().toLocaleDateString("mr-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      receiverLine1: "",
      receiverLine2: "",
      receiverLine3: "",
      subject: "",
      body: "",
    });
  };

  const receiverLines = [
    letterData.receiverLine1,
    letterData.receiverLine2,
    letterData.receiverLine3,
  ].filter((l) => l.trim());

  const bodyParagraphs = letterData.body
    .split("\n")
    .filter((p) => p.trim());

  const handlePrint = () => {
    if (!letterData.receiverLine1.trim()) {
      toast({ title: "त्रुटी", description: "प्राप्तकर्ता आवश्यक आहे", variant: "destructive" });
      return;
    }
    if (!letterData.subject.trim()) {
      toast({ title: "त्रुटी", description: "विषय आवश्यक आहे", variant: "destructive" });
      return;
    }
    if (!letterData.body.trim()) {
      toast({ title: "त्रुटी", description: "मुख्य मजकूर आवश्यक आहे", variant: "destructive" });
      return;
    }

    const receiverHTML = receiverLines
      .map((l) => `<div style="font-size:13px;line-height:1.6;color:#1a1a1a;">${l}</div>`)
      .join("");

    const bodyHTML = bodyParagraphs
      .map(
        (p) =>
          `<p style="margin:0 0 6px 0;text-align:justify;text-indent:30px;font-size:12.5px;line-height:1.75;color:#1a1a1a;">${p}</p>`
      )
      .join("");

    const printHTML = `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="UTF-8">
<title>पत्र - ${referenceId}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:A4 portrait;margin:0;}
body{font-family:'Noto Sans Devanagari',sans-serif;background:white;}
.page{width:210mm;height:297mm;position:relative;overflow:hidden;background:white;}
.bg-img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;z-index:0;}
.overlay{position:absolute;top:0;left:0;width:100%;height:100%;z-index:1;}
.label{font-weight:700;color:${LABEL_COLOR};}
.date-area{position:absolute;top:17.5%;right:6%;font-size:13px;}
.receiver-area{position:absolute;top:20%;left:7%;width:60%;}
.subject-area{position:absolute;top:${20 + 3 + receiverLines.length * 2.5 + 1}%;left:7%;right:6%;font-size:13px;}
.body-area{position:absolute;top:${20 + 3 + receiverLines.length * 2.5 + 5}%;left:7%;right:6%;bottom:22%;overflow:hidden;}
.ref-area{position:absolute;bottom:22%;left:7%;font-size:11px;}
@media print{body{background:white;}.page{margin:0;}}
@media screen{.page{box-shadow:0 4px 20px rgba(0,0,0,0.15);margin:20px auto;}body{background:#e8e8e8;padding:10px;}}
</style>
</head>
<body>
<div class="page">
<img src="${letterpadBg}" class="bg-img" />
<div class="overlay">
<div class="date-area"><span class="label">दिनांक : </span>${letterData.date}</div>
<div class="receiver-area">
<div class="label" style="font-size:13px;margin-bottom:2px;">प्रति,</div>
${receiverHTML}
</div>
<div class="subject-area">
<span class="label">विषय : </span><span style="font-weight:700;color:#1a1a1a;">${letterData.subject}</span>
</div>
<div class="body-area">
<div class="label" style="font-size:13px;margin-bottom:6px;">महोदय,</div>
${bodyHTML}
</div>
<div class="ref-area"><span class="label">${referenceId}</span></div>
</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},600);};</script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (w) {
      w.document.write(printHTML);
      w.document.close();
      toast({ title: "यशस्वी", description: "पत्र तयार - प्रिंट करा" });
    }
  };

  // Compute dynamic positions for preview (scaled to preview container)
  const previewScale = 0.48; // scale factor for preview

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              नवीन पत्र तयार करा
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">संदर्भ क्रमांक (Auto)</Label>
                <Input value={referenceId} disabled className="bg-muted font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">दिनांक (Auto)</Label>
                <Input value={letterData.date} disabled className="bg-muted text-sm" />
              </div>
            </div>

            {/* Receiver */}
            <div className="space-y-2">
              <Label>प्रति (प्राप्तकर्ता) - जास्तीत जास्त ३ ओळी</Label>
              <Input
                value={letterData.receiverLine1}
                onChange={(e) => setLetterData({ ...letterData, receiverLine1: e.target.value })}
                placeholder="ओळ १ - नाव / पद"
                maxLength={80}
              />
              <Input
                value={letterData.receiverLine2}
                onChange={(e) => setLetterData({ ...letterData, receiverLine2: e.target.value })}
                placeholder="ओळ २ - संस्था / विभाग (ऐच्छिक)"
                maxLength={80}
              />
              <Input
                value={letterData.receiverLine3}
                onChange={(e) => setLetterData({ ...letterData, receiverLine3: e.target.value })}
                placeholder="ओळ ३ - पत्ता (ऐच्छिक)"
                maxLength={80}
              />
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <Label>विषय (एक ओळ)</Label>
              <Input
                value={letterData.subject}
                onChange={(e) => setLetterData({ ...letterData, subject: e.target.value })}
                placeholder="पत्राचा विषय लिहा"
                maxLength={120}
              />
            </div>

            {/* Body */}
            <div className="space-y-1">
              <Label>मुख्य मजकूर</Label>
              <Textarea
                value={letterData.body}
                onChange={(e) => setLetterData({ ...letterData, body: e.target.value })}
                placeholder="पत्राचा मुख्य मजकूर येथे लिहा..."
                rows={8}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">{letterData.body.length}/2000</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                प्रिंट करा
              </Button>
              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                नवीन पत्र
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">पत्र पूर्वावलोकन (Live Preview)</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div
              className="relative mx-auto bg-white border border-border rounded shadow-sm overflow-hidden"
              style={{
                width: "100%",
                maxWidth: "400px",
                aspectRatio: "210 / 297",
              }}
            >
              {/* Background template */}
              <img
                src={letterpadBg}
                alt="Letterpad"
                className="absolute inset-0 w-full h-full object-contain"
                style={{ zIndex: 0 }}
              />

              {/* Overlay text */}
              <div className="absolute inset-0" style={{ zIndex: 1, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {/* Date - top right below header */}
                <div
                  className="absolute text-right"
                  style={{ top: "17.5%", right: "6%", fontSize: "clamp(6px, 1.4vw, 10px)" }}
                >
                  <span style={{ color: LABEL_COLOR, fontWeight: 700 }}>दिनांक : </span>
                  <span className="text-foreground">{letterData.date}</span>
                </div>

                {/* Receiver - left side */}
                <div
                  className="absolute"
                  style={{ top: "20%", left: "7%", width: "60%", fontSize: "clamp(6px, 1.4vw, 10px)" }}
                >
                  <div style={{ color: LABEL_COLOR, fontWeight: 700, marginBottom: "2px" }}>प्रति,</div>
                  {receiverLines.map((line, i) => (
                    <div key={i} style={{ lineHeight: 1.5, color: "#1a1a1a" }}>{line}</div>
                  ))}
                </div>

                {/* Subject */}
                <div
                  className="absolute"
                  style={{
                    top: `${20 + 3 + receiverLines.length * 2.5 + 1}%`,
                    left: "7%",
                    right: "6%",
                    fontSize: "clamp(6px, 1.4vw, 10px)",
                  }}
                >
                  <span style={{ color: LABEL_COLOR, fontWeight: 700 }}>विषय : </span>
                  <span style={{ fontWeight: 700, color: "#1a1a1a" }}>{letterData.subject}</span>
                </div>

                {/* Mahooday + Body */}
                <div
                  className="absolute overflow-hidden"
                  style={{
                    top: `${20 + 3 + receiverLines.length * 2.5 + 5}%`,
                    left: "7%",
                    right: "6%",
                    bottom: "28%",
                    fontSize: "clamp(5px, 1.2vw, 9px)",
                    lineHeight: 1.7,
                  }}
                >
                  <div style={{ color: LABEL_COLOR, fontWeight: 700, marginBottom: "4px" }}>महोदय,</div>
                  {bodyParagraphs.map((p, i) => (
                    <p key={i} style={{ margin: "0 0 3px 0", textIndent: "20px", textAlign: "justify", color: "#1a1a1a" }}>
                      {p}
                    </p>
                  ))}
                </div>

                {/* Reference ID - bottom left */}
                <div
                  className="absolute"
                  style={{ bottom: "22%", left: "7%", fontSize: "clamp(5px, 1.1vw, 8px)", color: LABEL_COLOR, fontWeight: 700 }}
                >
                  {referenceId}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LetterpadManagement;
