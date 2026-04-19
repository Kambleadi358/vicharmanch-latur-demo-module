// Camera capture with torch (flashlight) support, async upload, multi-capture queue
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Zap, ZapOff, X, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onCaptured: (file: Blob, dataUrl: string) => Promise<void> | void;
  onClose: () => void;
};

const CameraCapture = ({ onCaptured, onClose }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [uploading, setUploading] = useState<number>(0); // count of pending uploads
  const [flash, setFlash] = useState(false);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    setError("");
    setReady(false);
    try {
      // Stop existing stream first
      streamRef.current?.getTracks().forEach((t) => t.stop());

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("तुमचा browser camera support करत नाही. Chrome/Safari वापरा.");
      }
      if (!window.isSecureContext) {
        throw new Error("Camera फक्त HTTPS वर चालतो.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Torch detection
      const track = stream.getVideoTracks()[0];
      const caps = (track.getCapabilities?.() ?? {}) as any;
      setTorchSupported(!!caps.torch);
      setTorchOn(false);
      setReady(true);
    } catch (e: any) {
      const msg =
        e?.name === "NotAllowedError"
          ? "Camera permission नाकारली. Browser settings मधून परवानगी द्या."
          : e?.name === "NotFoundError"
            ? "Camera सापडला नाही."
            : e?.message ?? "Camera सुरू करता आला नाही";
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera(facing);
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, startCamera]);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      toast.error("Flashlight उपलब्ध नाही");
    }
  };

  const capture = async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !ready) return;

    // Flash effect
    setFlash(true);
    setTimeout(() => setFlash(false), 120);

    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return;

    // Resize to max 1280px on longest side, keep aspect
    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    c.width = targetW;
    c.height = targetH;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(v, 0, 0, targetW, targetH);

    const blob: Blob | null = await new Promise((resolve) =>
      c.toBlob((b) => resolve(b), "image/webp", 0.82)
    );
    if (!blob) {
      toast.error("Image तयार होऊ शकली नाही");
      return;
    }
    const dataUrl = c.toDataURL("image/webp", 0.82);

    setUploading((n) => n + 1);
    try {
      await onCaptured(blob, dataUrl);
    } finally {
      setUploading((n) => Math.max(0, n - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between p-3 text-white bg-black/50">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-white">
          <X className="h-5 w-5" />
        </Button>
        <div className="text-sm font-medium">कॅमेरा</div>
        <div className="flex items-center gap-2">
          {uploading > 0 && (
            <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded">
              <Loader2 className="h-3 w-3 animate-spin" /> {uploading} upload
            </span>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-center text-white p-6">
            <p className="mb-4">{error}</p>
            <Button onClick={() => startCamera(facing)} variant="secondary">
              पुन्हा प्रयत्न करा
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover"
            />
            {flash && <div className="absolute inset-0 bg-white animate-pulse" />}
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-4 bg-black/70 flex items-center justify-around">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setFacing(facing === "environment" ? "user" : "environment")}
          className="text-white"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
        <button
          onClick={capture}
          disabled={!ready}
          className="h-16 w-16 rounded-full bg-white border-4 border-white/40 active:scale-95 transition-transform disabled:opacity-50"
          aria-label="Capture"
        >
          <Camera className="h-7 w-7 text-black mx-auto" />
        </button>
        <Button
          variant="ghost"
          size="lg"
          onClick={toggleTorch}
          disabled={!torchSupported}
          className="text-white disabled:opacity-30"
        >
          {torchOn ? <ZapOff className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
};

export default CameraCapture;
