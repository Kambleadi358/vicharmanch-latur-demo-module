import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer, RotateCcw } from "lucide-react";
import vicharManchLogo from "@/assets/vicharmanch-logo.jpeg";

const LetterpadManagement = () => {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  
  const [letterData, setLetterData] = useState({
    date: new Date().toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" }),
    receiverLine1: "",
    receiverLine2: "",
    receiverLine3: "",
    subject: "",
    body: "",
    referenceId: `VM-${currentYear}-001`,
  });

  const [serialCounter, setSerialCounter] = useState(1);

  const generateReferenceId = () => {
    const serial = String(serialCounter).padStart(3, "0");
    return `VM-${currentYear}-${serial}`;
  };

  useEffect(() => {
    setLetterData(prev => ({ ...prev, referenceId: generateReferenceId() }));
  }, [serialCounter]);

  const handleReset = () => {
    setSerialCounter(prev => prev + 1);
    setLetterData({
      date: new Date().toLocaleDateString("mr-IN", { day: "numeric", month: "long", year: "numeric" }),
      receiverLine1: "",
      receiverLine2: "",
      receiverLine3: "",
      subject: "",
      body: "",
      referenceId: `VM-${currentYear}-${String(serialCounter + 1).padStart(3, "0")}`,
    });
  };

  const handlePrint = () => {
    if (!letterData.receiverLine1.trim()) {
      toast({ title: "त्रुटी", description: "प्रति (प्राप्तकर्ता) आवश्यक आहे", variant: "destructive" });
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

    const receiverLines = [letterData.receiverLine1, letterData.receiverLine2, letterData.receiverLine3]
      .filter(l => l.trim())
      .map(l => `<div style="font-size: 14px; line-height: 1.6;">${l}</div>`)
      .join("");

    // Format body: preserve line breaks as paragraphs
    const bodyParagraphs = letterData.body
      .split("\n")
      .filter(p => p.trim())
      .map(p => `<p style="margin: 0 0 8px 0; text-align: justify; text-indent: 40px; font-size: 13px; line-height: 1.8;">${p}</p>`)
      .join("");

    const letterHTML = `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="UTF-8">
<title>पत्र - ${letterData.referenceId}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page {
    size: A4 portrait;
    margin: 0;
  }
  
  body {
    font-family: 'Noto Sans Devanagari', sans-serif;
    background: white;
    color: #1a1a1a;
  }
  
  .page {
    width: 210mm;
    height: 297mm;
    margin: 0 auto;
    position: relative;
    overflow: hidden;
    background: white;
  }
  
  /* ===== HEADER (RED ZONE - DO NOT MODIFY) ===== */
  .header {
    padding: 20px 30px 15px 30px;
    border-bottom: 2px solid #1e3a5f;
    display: flex;
    align-items: center;
    gap: 20px;
  }
  
  .header-logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #d4a017;
    flex-shrink: 0;
  }
  
  .header-text {
    flex: 1;
  }
  
  .header-title {
    font-size: 26px;
    font-weight: 800;
    color: #1e3a5f;
    line-height: 1.3;
  }
  
  .header-address {
    font-size: 13px;
    color: #444;
    margin-top: 4px;
  }
  
  /* ===== CONTENT AREA ===== */
  .content-area {
    padding: 0 35px;
    height: calc(297mm - 130px - 140px);
    overflow: hidden;
  }
  
  /* Orange Zone: Date */
  .date-line {
    text-align: right;
    padding: 18px 0 12px 0;
    font-size: 13px;
    color: #333;
  }
  
  /* Green Zone: Receiver */
  .receiver-block {
    padding: 8px 0 14px 0;
  }
  
  .receiver-label {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 4px;
  }
  
  /* Sky Blue Zone: Subject */
  .subject-line {
    padding: 10px 0;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 16px;
  }
  
  .subject-label {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    display: inline;
  }
  
  .subject-text {
    font-size: 14px;
    font-weight: 700;
    color: #1e3a5f;
    display: inline;
    margin-left: 6px;
  }
  
  /* Dark Blue Zone: Body */
  .body-content {
    padding: 4px 0;
    overflow: hidden;
    max-height: calc(297mm - 130px - 140px - 180px);
  }
  
  /* Pink Zone: Reference ID */
  .reference-id {
    position: absolute;
    bottom: 155px;
    left: 35px;
    font-size: 11px;
    color: #666;
    font-weight: 500;
  }
  
  /* ===== FOOTER (BLACK & YELLOW ZONE - DO NOT MODIFY) ===== */
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 140px;
    padding: 0 35px;
  }
  
  .footer-main {
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    padding-top: 5px;
  }
  
  .stamp-section {
    text-align: center;
  }
  
  .stamp-img {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    object-fit: cover;
    opacity: 0.7;
  }
  
  .footer-org-name {
    font-size: 12px;
    font-weight: 700;
    color: #1e3a5f;
    margin-top: 2px;
  }
  
  .footer-address {
    font-size: 10px;
    color: #555;
    line-height: 1.3;
  }
  
  .footer-tagline {
    font-size: 10px;
    color: #1e3a5f;
    font-weight: 600;
    margin-top: 2px;
  }
  
  .footer-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: #f5f5f0;
    border-top: 1px solid #ddd;
    padding: 8px 35px;
    display: flex;
    justify-content: center;
    gap: 30px;
    font-size: 10px;
    color: #555;
  }
  
  .footer-bar-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  @media print {
    body { background: white; }
    .page { margin: 0; box-shadow: none; }
  }
  
  @media screen {
    .page {
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      margin: 20px auto;
    }
    body { background: #e8e8e8; padding: 10px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER (RED ZONE) -->
  <div class="header">
    <img src="${vicharManchLogo}" class="header-logo" alt="Logo" />
    <div class="header-text">
      <div class="header-title">भारतरत्न डॉ. बाबासाहेब आंबेडकर<br/>विचारमंच</div>
      <div class="header-address">बौद्ध नगर, डॉ. बाबासाहेब आंबेडकर चौक, लातूर - 413512</div>
    </div>
  </div>

  <!-- CONTENT AREA -->
  <div class="content-area">
    
    <!-- Orange Zone: Date -->
    <div class="date-line">
      दिनांक: ${letterData.date}
    </div>
    
    <!-- Green Zone: Receiver -->
    <div class="receiver-block">
      <div class="receiver-label">प्रति,</div>
      ${receiverLines}
    </div>
    
    <!-- Sky Blue Zone: Subject -->
    <div class="subject-line">
      <span class="subject-label">विषय :</span>
      <span class="subject-text">${letterData.subject}</span>
    </div>
    
    <!-- Dark Blue Zone: Body -->
    <div class="body-content">
      ${bodyParagraphs}
    </div>
  </div>
  
  <!-- Pink Zone: Reference ID -->
  <div class="reference-id">${letterData.referenceId}</div>

  <!-- FOOTER (BLACK & YELLOW ZONE) -->
  <div class="footer">
    <div class="footer-main">
      <div class="stamp-section">
        <img src="${vicharManchLogo}" class="stamp-img" alt="Stamp" />
        <div class="footer-org-name">भारतरत्न डॉ. बाबासाहेब आंबेडकर विचारमंच</div>
        <div class="footer-address">बौद्ध नगर, लातूर<br/>413512</div>
        <div class="footer-tagline">विचारमंच व्यवस्थापन प्रणाली</div>
      </div>
    </div>
    <div class="footer-bar">
      <span class="footer-bar-item">📷 dr.Ambedkar_vicharmanch</span>
      <span class="footer-bar-item">✉ vicharmanch1956@gmail.com</span>
      <span class="footer-bar-item">🌐 vicharmanch.vercel.app</span>
    </div>
  </div>

</div>

<script>
  // Auto-trigger print on load
  window.onload = function() {
    setTimeout(function() { window.print(); }, 500);
  };
</script>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(letterHTML);
      printWindow.document.close();
      toast({ title: "यशस्वी", description: "पत्र तयार केले - प्रिंट करा" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            नवीन पत्र तयार करा
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Reference ID & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>संदर्भ क्रमांक (Reference ID)</Label>
              <Input
                value={letterData.referenceId}
                onChange={(e) => setLetterData({ ...letterData, referenceId: e.target.value })}
                placeholder="VM-2026-001"
              />
              <p className="text-xs text-muted-foreground">Format: VM-[Year]-[Serial]</p>
            </div>
            <div className="space-y-2">
              <Label>दिनांक</Label>
              <Input
                value={letterData.date}
                onChange={(e) => setLetterData({ ...letterData, date: e.target.value })}
                placeholder="दिनांक प्रविष्ट करा"
              />
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
          <div className="space-y-2">
            <Label>विषय (एक ओळ)</Label>
            <Input
              value={letterData.subject}
              onChange={(e) => setLetterData({ ...letterData, subject: e.target.value })}
              placeholder="पत्राचा विषय लिहा"
              maxLength={120}
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <Label>मुख्य मजकूर</Label>
            <Textarea
              value={letterData.body}
              onChange={(e) => setLetterData({ ...letterData, body: e.target.value })}
              placeholder="पत्राचा मुख्य मजकूर येथे लिहा...&#10;&#10;नवीन परिच्छेदासाठी Enter दाबा."
              rows={10}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{letterData.body.length}/2000 अक्षरे</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              पत्र तयार करा व प्रिंट करा
            </Button>
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              नवीन पत्र
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LetterpadManagement;
