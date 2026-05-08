import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  StopCircle, Sparkles, AlertCircle, CheckCircle2,
  Lightbulb, RefreshCw, Loader2, RotateCcw
} from "lucide-react";
import { useCreateEntry, useJournalPrompt } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";

type Stage = "camera" | "recording" | "preview" | "uploading" | "analyzing" | "done" | "error" | "denied";

export default function Record() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("camera");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [entryId, setEntryId] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const createEntry = useCreateEntry();
  const { data: journalPrompt, refetch: refetchPrompt } = useJournalPrompt();

  // Auto-open camera on mount
  useEffect(() => {
    openCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStage("camera");
    } catch {
      setStage("denied");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordSeconds(0);
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setStage("preview");
      if (timerRef.current) clearInterval(timerRef.current);
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setStage("recording");
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const handleRecordButton = () => {
    if (stage === "camera") startRecording();
    else if (stage === "recording") stopRecording();
  };

  const reRecord = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setTitle("");
    setAnalysis(null);
    openCamera();
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;
    const entryTitle = title.trim() || `Reflection on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    setStage("uploading");
    try {
      const entry = await createEntry.mutateAsync({
        title: entryTitle,
        entryDate: new Date().toISOString().split("T")[0],
      });
      setEntryId(entry.id);
      setStage("analyzing");

      const formData = new FormData();
      formData.append("video", recordedBlob, "diary.webm");
      const analyzeRes = await fetch(`/api/diary/entries/${entry.id}/analyze`, {
        method: "POST",
        body: formData,
        headers: { "x-user-email": localStorage.getItem("userEmail") || "demo@aivideodiary.app" },
      });

      if (!analyzeRes.ok) throw new Error("Analysis failed");
      setAnalysis(await analyzeRes.json());
      setStage("done");
    } catch {
      setStage("error");
      toast({ title: "Analysis failed — please try again", variant: "destructive" });
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Camera denied ──
  if (stage === "denied") {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle size={48} style={{ color: "hsl(var(--destructive))" }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Camera Access Required</h1>
        <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>Please allow camera and microphone access in your browser, then try again.</p>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={openCamera}
          className="px-6 py-3 rounded-xl text-white font-medium" style={{ background: "hsl(var(--primary))" }}>
          Try Again
        </motion.button>
      </div>
    );
  }

  // ── Done ──
  if (stage === "done" && analysis) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Playfair Display, serif" }}>Entry Saved!</h1>
          <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>Your diary has been analysed by Aura</p>
        </motion.div>
        <div className="rounded-2xl border p-5 text-left space-y-3" style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Mood detected</p>
            <span className="text-sm font-semibold capitalize">{analysis.mood}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Mood score</p>
            <span className="text-sm font-semibold">{analysis.moodScore}/10</span>
          </div>
          {analysis.summary && (
            <p className="text-sm leading-relaxed border-t pt-3" style={{ borderColor: "hsl(240 12% 20%)", color: "hsl(240 8% 70%)" }}>
              {analysis.summary}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setLocation(`/entry/${entryId}`)}
            className="flex-1 py-3 rounded-xl text-white font-medium" style={{ background: "hsl(var(--primary))" }}>
            View Entry
          </button>
          <button onClick={reRecord}
            className="flex-1 py-3 rounded-xl border font-medium" style={{ borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 80%)" }}>
            Record Another
          </button>
        </div>
      </div>
    );
  }

  // ── Processing ──
  if (stage === "uploading" || stage === "analyzing") {
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-24 space-y-5">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Sparkles size={40} style={{ color: "hsl(var(--primary))" }} />
        </motion.div>
        <p className="text-lg font-semibold">{stage === "uploading" ? "Saving your entry…" : "Aura is listening…"}</p>
        <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>
          {stage === "analyzing" ? "Transcribing and analysing your mood with AI" : "Uploading your recording"}
        </p>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "hsl(240 12% 20%)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "hsl(var(--primary))" }}
            animate={{ width: ["0%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>Record Entry</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(240 8% 55%)" }}>Capture your thoughts, feelings, and experiences.</p>
      </div>

      {/* ── Main Video Block ── */}
      <div className="relative rounded-2xl overflow-hidden w-full" style={{ aspectRatio: "16/9", background: "hsl(240 15% 8%)" }}>

        {/* Live camera / playback video */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted={stage === "camera" || stage === "recording"}
          src={stage === "preview" ? (previewUrl || undefined) : undefined}
          controls={stage === "preview"}
          autoPlay={stage === "preview"}
          playsInline
        />

        {/* ── Prompt overlay (top) ── */}
        <AnimatePresence>
          {(stage === "camera" || stage === "recording") && journalPrompt?.prompt && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-4 left-4 right-4 flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
            >
              <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>Today's Prompt</p>
                <p className="text-sm leading-snug text-white">{journalPrompt.prompt}</p>
              </div>
              <button
                onClick={() => refetchPrompt()}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                title="New prompt"
              >
                <RefreshCw size={13} className="text-white/60" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── REC badge ── */}
        <AnimatePresence>
          {stage === "recording" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold"
              style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(6px)" }}
            >
              <motion.div
                className="w-2 h-2 rounded-full bg-white"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              {formatTime(recordSeconds)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Big Record / Stop button (bottom center) ── */}
        {(stage === "camera" || stage === "recording") && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={handleRecordButton}
              className="relative flex items-center justify-center"
              data-testid={stage === "recording" ? "button-stop" : "button-record"}
            >
              {/* Outer ring */}
              <div className="w-16 h-16 rounded-full border-4 border-white/80 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {stage === "recording" ? (
                    <motion.div
                      key="stop"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-7 h-7 rounded-md"
                      style={{ background: "#ef4444" }}
                    />
                  ) : (
                    <motion.div
                      key="record"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-11 h-11 rounded-full"
                      style={{ background: "#ef4444" }}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          </div>
        )}

        {/* ── Preview placeholder if no src yet ── */}
        {stage === "camera" && !streamRef.current && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
          </div>
        )}
      </div>

      {/* ── After recording: title + action buttons ── */}
      <AnimatePresence>
        {stage === "preview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Reflection on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{
                background: "hsl(240 15% 13%)",
                borderColor: "hsl(240 12% 22%)",
                color: "hsl(240 10% 90%)",
              }}
              data-testid="input-title"
            />
            <div className="flex gap-3">
              <button
                onClick={reRecord}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm font-medium"
                style={{ borderColor: "hsl(240 12% 22%)", color: "hsl(240 8% 60%)" }}
                data-testid="button-rerecord"
              >
                <RotateCcw size={14} />
                Re-record
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={analyzeRecording}
                className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--primary))" }}
                data-testid="button-analyze"
              >
                <Sparkles size={16} />
                Analyse with Aura
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error state ── */}
      {stage === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "hsl(0 72% 55% / 0.3)", background: "hsl(0 72% 55% / 0.08)" }}>
          <AlertCircle size={18} style={{ color: "hsl(0 72% 55%)" }} />
          <p className="text-sm flex-1">Analysis failed. Please try re-recording.</p>
          <button onClick={reRecord} className="text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>Try again</button>
        </div>
      )}
    </div>
  );
}
