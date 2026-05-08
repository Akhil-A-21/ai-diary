import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, AlertCircle, CheckCircle2,
  Lightbulb, RefreshCw, Loader2, RotateCcw, Mic
} from "lucide-react";
import { useCreateEntry, useJournalPrompt } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";

type Stage = "loading" | "camera" | "recording" | "preview" | "uploading" | "analyzing" | "done" | "error" | "denied";

const LANGUAGES = [
  { code: "en",    label: "English" },
  { code: "ml",    label: "മലയാളം" },
  { code: "hi",    label: "हिन्दी" },
  { code: "ta",    label: "தமிழ்" },
  { code: "te",    label: "తెలుగు" },
  { code: "kn",    label: "ಕನ್ನಡ" },
  { code: "bn",    label: "বাংলা" },
  { code: "mr",    label: "मराठी" },
  { code: "ur",    label: "اردو" },
];

export default function Record() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("loading");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [entryId, setEntryId] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [selectedLang, setSelectedLang] = useState("en");
  const [audioOnly, setAudioOnly] = useState(false);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createEntry = useCreateEntry();
  const { data: journalPrompt, refetch: refetchPrompt } = useJournalPrompt();

  const openCamera = useCallback(async () => {
    setStage("loading");
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
      setAudioOnly(false);
      setStage("camera");
      return;
    } catch {}
    // Fallback: audio-only (camera blocked but mic allowed)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      streamRef.current = stream;
      setAudioOnly(true);
      setStage("camera");
    } catch {
      setStage("denied");
    }
  }, []);

  useEffect(() => {
    openCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordSeconds(0);

    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setStage("preview");
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    setStage("recording");
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  }, []);

  const handleRecordButton = () => {
    if (stage === "camera") startRecording();
    else if (stage === "recording") stopRecording();
  };

  const reRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    setTitle("");
    setAnalysis(null);
    setAudioOnly(false);
    openCamera();
  };

  const analyzeRecording = async () => {
    if (!recordedBlob) return;
    const entryTitle = title.trim() ||
      `Reflection on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

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
      // Send the ISO 639-1 language code so Whisper can transcribe accurately
      formData.append("lang", selectedLang);

      const analyzeRes = await fetch(`/api/diary/entries/${entry.id}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!analyzeRes.ok) throw new Error("Analysis failed");
      setAnalysis(await analyzeRes.json());
      setStage("done");
    } catch {
      setStage("error");
      toast({ title: "Analysis failed — please try again", variant: "destructive" });
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Camera denied ──
  if (stage === "denied") {
    const isInIframe = window.self !== window.top;
    return (
      <div className="max-w-lg mx-auto flex flex-col items-center justify-center py-16 text-center space-y-5">
        <AlertCircle size={52} style={{ color: "hsl(var(--destructive))" }} />
        <div>
          <h1 className="font-display text-2xl font-bold mb-2 text-white">Camera Access Required</h1>
          {isInIframe ? (
            <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 60%)" }}>
              The preview panel can't access your camera.<br />
              Open the app in a <strong style={{ color: "hsl(240 10% 85%)" }}>new tab</strong> and allow camera access there.
            </p>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 60%)" }}>
              Click the camera icon in your browser's address bar and allow access, then try again.
            </p>
          )}
        </div>

        {isInIframe ? (
          <motion.a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium no-underline"
            style={{ background: "hsl(var(--primary))" }}
          >
            Open in New Tab
          </motion.a>
        ) : (
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={openCamera}
            className="px-6 py-3 rounded-xl text-white font-medium" style={{ background: "hsl(var(--primary))" }}>
            Try Again
          </motion.button>
        )}

        <div className="rounded-xl border p-4 text-left w-full space-y-2"
          style={{ borderColor: "hsl(240 12% 20%)", background: "hsl(240 15% 11%)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>How to allow camera access</p>
          <ol className="text-xs space-y-1.5 list-decimal list-inside" style={{ color: "hsl(240 8% 65%)" }}>
            <li>Open the app link in a new browser tab</li>
            <li>Click the 🔒 lock icon in the address bar</li>
            <li>Set <strong style={{ color: "hsl(240 10% 80%)" }}>Camera</strong> and <strong style={{ color: "hsl(240 10% 80%)" }}>Microphone</strong> to Allow</li>
            <li>Refresh the page and go to Record</li>
          </ol>
        </div>
      </div>
    );
  }

  // ── Done ──
  if (stage === "done" && analysis) {
    return (
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h1 className="font-display text-3xl font-bold mb-1 text-white">Entry Saved!</h1>
          <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>Your diary has been transcribed and analysed by Aura</p>
        </motion.div>

        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Mood</p>
            <span className="text-sm font-semibold capitalize">{analysis.mood}</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Mood score</p>
            <span className="text-sm font-semibold">{analysis.moodScore}/10</span>
          </div>
          {analysis.energyLevel && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Energy</p>
              <span className="text-sm font-semibold">{analysis.energyLevel}/10</span>
            </div>
          )}
          {analysis.summary && (
            <div className="border-t pt-3" style={{ borderColor: "hsl(240 12% 20%)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(240 8% 50%)" }}>AI Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 75%)" }}>
                {analysis.summary}
              </p>
            </div>
          )}
          {analysis.transcript && (
            <div className="border-t pt-3" style={{ borderColor: "hsl(240 12% 20%)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(240 8% 50%)" }}>Transcript</p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 60%)" }}>
                {analysis.transcript}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setLocation(`/entry/${entryId}`)}
            className="flex-1 py-3 rounded-xl text-white font-medium"
            style={{ background: "hsl(var(--primary))" }}>
            View Entry
          </button>
          <button onClick={reRecord}
            className="flex-1 py-3 rounded-xl border font-medium"
            style={{ borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 80%)" }}>
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
        <p className="text-lg font-semibold">
          {stage === "uploading" ? "Saving your entry…" : "Aura is transcribing & analysing…"}
        </p>
        <p className="text-sm text-center" style={{ color: "hsl(240 8% 55%)" }}>
          {stage === "analyzing"
            ? "Whisper is converting your speech to text, then GPT is reading your emotions"
            : "Uploading your recording securely"}
        </p>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: "hsl(240 12% 20%)" }}>
          <motion.div className="h-full rounded-full" style={{ background: "hsl(var(--primary))" }}
            animate={{ width: ["0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
        </div>
      </div>
    );
  }

  const isLive = stage === "camera" || stage === "recording";

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-white">
            Record Entry
          </h1>
          <p className="text-sm mt-1" style={{ color: "hsl(240 8% 55%)" }}>
            Speak freely — Aura will transcribe and analyse your entry with AI.
          </p>
        </div>
        {stage !== "recording" && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>
              Language
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="text-sm px-3 py-1.5 rounded-lg border outline-none cursor-pointer"
              style={{
                background: "hsl(240 15% 13%)",
                borderColor: "hsl(240 12% 22%)",
                color: "hsl(240 10% 85%)",
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Main Video / Audio Block ── */}
      <div className="relative rounded-2xl overflow-hidden w-full"
        style={{ aspectRatio: "16/9", background: "hsl(240 15% 8%)" }}>

        {/* Live camera feed */}
        <video
          ref={liveVideoRef}
          className="w-full h-full object-cover"
          style={{ display: (isLive && !audioOnly) ? "block" : "none" }}
          autoPlay muted playsInline
        />

        {/* Audio-only visualiser */}
        {isLive && audioOnly && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="flex items-end gap-1 h-16">
              {[...Array(9)].map((_, i) => (
                <motion.div key={i}
                  className="w-2 rounded-full"
                  style={{ background: "hsl(var(--primary))" }}
                  animate={{ height: stage === "recording" ? ["12px","40px","8px","36px","16px"][i % 5] : "8px" }}
                  transition={{ duration: 0.5 + i * 0.07, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                />
              ))}
            </div>
            <p className="text-sm font-medium" style={{ color: "hsl(240 8% 65%)" }}>
              {stage === "recording" ? "Recording audio…" : "Audio mode — camera unavailable"}
            </p>
          </div>
        )}

        {/* Recorded audio-only preview */}
        {stage === "preview" && audioOnly && recordedBlob && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8">
            <Mic size={40} style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm" style={{ color: "hsl(240 8% 65%)" }}>Audio recording ready</p>
            <audio src={previewUrl ?? undefined} controls className="w-full" style={{ filter: "invert(0.85) hue-rotate(220deg)" }} />
          </div>
        )}

        {/* Recorded video preview */}
        {stage === "preview" && previewUrl && !audioOnly && (
          <video className="w-full h-full object-cover" src={previewUrl} controls autoPlay playsInline />
        )}

        {/* Loading spinner */}
        {stage === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs" style={{ color: "hsl(240 8% 50%)" }}>Starting…</p>
          </div>
        )}

        {/* Prompt overlay */}
        {isLive && journalPrompt?.prompt && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 right-4 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
          >
            <Lightbulb size={14} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#f59e0b" }}>Today's Prompt</p>
              <p className="text-sm leading-snug text-white">{journalPrompt.prompt}</p>
            </div>
            <button onClick={() => refetchPrompt()} className="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors">
              <RefreshCw size={13} className="text-white/60" />
            </button>
          </motion.div>
        )}

        {/* REC badge */}
        {stage === "recording" && (
          <div
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.85)", backdropFilter: "blur(6px)" }}
          >
            <motion.div className="w-2 h-2 rounded-full bg-white"
              animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            {formatTime(recordSeconds)}
          </div>
        )}

        {/* Record / Stop button */}
        {isLive && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
              onClick={handleRecordButton}
              className="flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full border-4 border-white/80 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {stage === "recording" ? (
                    <motion.div key="stop"
                      initial={{ scale: 0, borderRadius: "50%" }} animate={{ scale: 1, borderRadius: "4px" }} exit={{ scale: 0 }}
                      className="w-7 h-7" style={{ background: "#ef4444" }} />
                  ) : (
                    <motion.div key="record"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="w-11 h-11 rounded-full" style={{ background: "#ef4444" }} />
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          </div>
        )}
      </div>

      {/* ── After recording: title + action buttons ── */}
      <AnimatePresence>
        {stage === "preview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            {/* Info pill */}
            <div className="glass rounded-xl px-4 py-3 flex items-center gap-2.5">
              <Sparkles size={14} style={{ color: "hsl(var(--primary))" }} />
              <p className="text-xs" style={{ color: "hsl(240 8% 65%)" }}>
                Whisper will transcribe your speech, then GPT will analyse your mood and generate a summary.
              </p>
            </div>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Reflection on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
              style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 22%)", color: "hsl(240 10% 90%)" }}
            />
            <div className="flex gap-3">
              <button
                onClick={reRecord}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl border text-sm font-medium"
                style={{ borderColor: "hsl(240 12% 22%)", color: "hsl(240 8% 60%)" }}
              >
                <RotateCcw size={14} />
                Re-record
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={analyzeRecording}
                className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--primary))" }}
              >
                <Sparkles size={16} />
                Analyse with Aura
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {stage === "error" && (
        <div className="flex items-center gap-3 p-4 rounded-xl border"
          style={{ borderColor: "hsl(0 72% 55% / 0.3)", background: "hsl(0 72% 55% / 0.08)" }}>
          <AlertCircle size={18} style={{ color: "hsl(0 72% 55%)" }} />
          <p className="text-sm flex-1">Analysis failed. Please try re-recording.</p>
          <button onClick={reRecord} className="text-sm font-medium" style={{ color: "hsl(var(--primary))" }}>Try again</button>
        </div>
      )}
    </div>
  );
}
