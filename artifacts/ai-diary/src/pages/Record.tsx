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

export default function Record() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("loading");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [entryId, setEntryId] = useState<number | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  const createEntry = useCreateEntry();
  const { data: journalPrompt, refetch: refetchPrompt } = useJournalPrompt();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  const openCamera = useCallback(async () => {
    setStage("loading");
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (liveVideoRef.current) liveVideoRef.current.srcObject = stream;
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
      recognitionRef.current?.stop();
    };
  }, []);

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    finalTranscriptRef.current = "";
    setLiveTranscript("");
    setFinalTranscript("");

    recognition.onresult = (e: any) => {
      let interim = "";
      let final = finalTranscriptRef.current;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          final += e.results[i][0].transcript + " ";
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      finalTranscriptRef.current = final;
      setFinalTranscript(final);
      setLiveTranscript(interim);
    };

    recognition.onerror = () => {};
    recognition.onend = () => {
      // Auto-restart if still recording
      if (mediaRecorderRef.current?.state === "recording") {
        try { recognition.start(); } catch {}
      }
    };

    try { recognition.start(); } catch {}
    recognitionRef.current = recognition;
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordSeconds(0);
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setLiveTranscript("");

    let mimeType = "video/webm;codecs=vp8,opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = "";

    const mr = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      recognitionRef.current?.stop();
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      // Capture final transcript
      const captured = finalTranscriptRef.current.trim();
      setFinalTranscript(captured);
      if (liveVideoRef.current) liveVideoRef.current.srcObject = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
      setStage("preview");
    };
    mr.start(100);
    mediaRecorderRef.current = mr;
    setStage("recording");
    timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);

    // Start speech recognition in parallel
    startSpeechRecognition();
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
    setFinalTranscript("");
    setLiveTranscript("");
    setTitle("");
    setAnalysis(null);
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
      // Send browser transcript — backend skips Whisper if this is present
      if (finalTranscript) {
        formData.append("transcript", finalTranscript);
      }

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
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertCircle size={48} style={{ color: "hsl(var(--destructive))" }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "Playfair Display, serif" }}>Camera Access Required</h1>
        <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>
          Please allow camera and microphone access in your browser, then try again.
        </p>
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
      <div className="max-w-lg mx-auto py-10 space-y-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <CheckCircle2 size={64} className="mx-auto mb-4" style={{ color: "#22c55e" }} />
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Playfair Display, serif" }}>Entry Saved!</h1>
          <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>Your diary has been analysed by Aura</p>
        </motion.div>

        <div className="rounded-2xl border p-5 space-y-3"
          style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}>
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
          {(analysis.transcript || finalTranscript) && (
            <div className="border-t pt-3" style={{ borderColor: "hsl(240 12% 20%)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "hsl(240 8% 50%)" }}>Transcript</p>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 60%)" }}>
                {analysis.transcript || finalTranscript}
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
          {stage === "uploading" ? "Saving your entry…" : "Aura is analysing…"}
        </p>
        <p className="text-sm" style={{ color: "hsl(240 8% 55%)" }}>
          {stage === "analyzing" ? "Processing your mood and emotions with AI" : "Uploading your recording"}
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
          Record Entry
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(240 8% 55%)" }}>
          Capture your thoughts, feelings, and experiences.
        </p>
      </div>

      {/* ── Main Video Block ── */}
      <div className="relative rounded-2xl overflow-hidden w-full"
        style={{ aspectRatio: "16/9", background: "hsl(240 15% 8%)" }}>

        {/* Live camera feed */}
        <video
          ref={liveVideoRef}
          className="w-full h-full object-cover"
          style={{ display: isLive ? "block" : "none" }}
          autoPlay muted playsInline
        />

        {/* Recorded preview */}
        {stage === "preview" && previewUrl && (
          <video className="w-full h-full object-cover" src={previewUrl} controls autoPlay playsInline />
        )}

        {/* Loading spinner */}
        {stage === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs" style={{ color: "hsl(240 8% 50%)" }}>Starting camera…</p>
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

        {/* Live transcript overlay while recording */}
        {stage === "recording" && (finalTranscript || liveTranscript) && (
          <div
            className="absolute bottom-20 left-4 right-4 px-3 py-2 rounded-xl text-xs leading-relaxed"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "rgba(255,255,255,0.85)" }}
          >
            {finalTranscript}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{liveTranscript}</span>
          </div>
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

      {/* ── After recording: transcript preview + title + buttons ── */}
      <AnimatePresence>
        {stage === "preview" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">

            {/* Show transcript if captured */}
            {finalTranscript ? (
              <div className="rounded-xl border p-3" style={{ background: "hsl(240 15% 13%)", borderColor: "hsl(240 12% 20%)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Mic size={12} style={{ color: "hsl(var(--primary))" }} />
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "hsl(240 8% 50%)" }}>Transcript captured</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "hsl(240 8% 72%)" }}>{finalTranscript}</p>
              </div>
            ) : speechSupported ? (
              <div className="rounded-xl border p-3 flex items-center gap-2" style={{ borderColor: "hsl(240 12% 20%)", background: "hsl(240 15% 13%)" }}>
                <AlertCircle size={13} style={{ color: "#f59e0b" }} />
                <p className="text-xs" style={{ color: "hsl(240 8% 55%)" }}>No speech detected — Aura will still analyse your mood from the recording.</p>
              </div>
            ) : null}

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
