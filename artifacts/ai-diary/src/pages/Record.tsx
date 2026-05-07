import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Video, StopCircle, Upload, Loader2, CheckCircle2, Sparkles, AlertCircle, Mic } from "lucide-react";
import { useCreateEntry, useJournalPrompt } from "../hooks/useApi";
import { toast } from "../hooks/use-toast";

type Stage = "prompt" | "recording" | "uploading" | "analyzing" | "done" | "error";

export default function Record() {
  const [, setLocation] = useLocation();
  const [stage, setStage] = useState<Stage>("prompt");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [entryId, setEntryId] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const createEntry = useCreateEntry();
  const { data: journalPrompt } = useJournalPrompt();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStage("recording");
    } catch (err) {
      toast({ title: "Camera access denied", description: "Please allow camera and microphone access.", variant: "destructive" });
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp8,opus" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreview(url);
      if (videoRef.current) videoRef.current.srcObject = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const analyzeRecording = async () => {
    if (!recordedBlob || !title.trim()) {
      toast({ title: "Missing title", description: "Please enter a title for your entry.", variant: "destructive" });
      return;
    }

    setStage("uploading");
    try {
      // Create entry first
      const entry = await createEntry.mutateAsync({
        title,
        entryDate: new Date().toISOString().split("T")[0],
      });
      setEntryId(entry.id);

      setStage("analyzing");

      // Upload video and analyze
      const formData = new FormData();
      formData.append("video", recordedBlob, "diary.webm");
      const analyzeRes = await fetch(`/api/diary/entries/${entry.id}/analyze`, {
        method: "POST",
        body: formData,
        headers: { "x-user-email": localStorage.getItem("userEmail") || "demo@aivideodiary.app" },
      });

      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const result = await analyzeRes.json();
      setAnalysis(result);
      setStage("done");
    } catch (err) {
      setStage("error");
      toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Record Your Diary</h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Speak freely. Aura will listen and reflect.</p>
      </div>

      {/* Journal Prompt */}
      {journalPrompt?.prompt && (
        <div className="rounded-xl p-4 border" style={{ background: "hsl(var(--secondary))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={13} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Today's Prompt</span>
          </div>
          <p className="text-sm leading-relaxed">{journalPrompt.prompt}</p>
        </div>
      )}

      {/* Title Input */}
      <div>
        <label className="text-sm font-medium mb-1.5 block">Entry Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="How was your day?"
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
          style={{
            background: "hsl(var(--input))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
          data-testid="input-title"
        />
      </div>

      {/* Camera / Video Area */}
      <div
        className="rounded-2xl overflow-hidden relative aspect-video"
        style={{ background: "hsl(var(--muted))" }}
      >
        {stage === "prompt" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Video size={28} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Click below to start your video diary</p>
          </div>
        )}

        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${stage === "prompt" || stage === "uploading" || stage === "analyzing" || stage === "done" ? "hidden" : ""}`}
          muted={isRecording}
          src={stage !== "recording" ? (preview || undefined) : undefined}
          controls={!isRecording && !!preview}
          autoPlay={!isRecording && !!preview}
        />

        {stage === "recording" && !isRecording && !preview && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>Camera ready. Press Record.</p>
          </div>
        )}

        {(stage === "uploading" || stage === "analyzing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-medium">{stage === "uploading" ? "Creating entry..." : "Analyzing with AI..."}</p>
          </div>
        )}

        {stage === "done" && analysis && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            <CheckCircle2 size={40} style={{ color: "#22c55e" }} />
            <p className="text-lg font-semibold">Entry Analyzed!</p>
            <div className="text-center space-y-1">
              <p className="text-sm"><span className="font-medium">Mood:</span> {analysis.mood} ({analysis.moodScore}/10)</p>
              <p className="text-sm"><span className="font-medium">Energy:</span> {analysis.energyLevel}/10</p>
            </div>
            <p className="text-sm text-center leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{analysis.summary}</p>
          </div>
        )}

        {stage === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <AlertCircle size={32} style={{ color: "hsl(var(--destructive))" }} />
            <p className="text-sm">Something went wrong. Try again.</p>
          </div>
        )}

        {isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 rounded-full text-white text-xs" style={{ background: "#ef4444" }}>
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            REC
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {stage === "prompt" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startCamera}
            className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
            style={{ background: "hsl(var(--primary))" }}
            data-testid="button-start-camera"
          >
            <Video size={18} />
            Open Camera
          </motion.button>
        )}

        {stage === "recording" && !isRecording && !recordedBlob && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={startRecording}
            className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
            style={{ background: "#ef4444" }}
            data-testid="button-record"
          >
            <Mic size={18} />
            Start Recording
          </motion.button>
        )}

        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={stopRecording}
            className="flex-1 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
            style={{ background: "#6b7280" }}
            data-testid="button-stop"
          >
            <StopCircle size={18} />
            Stop Recording
          </motion.button>
        )}

        {recordedBlob && stage !== "done" && stage !== "uploading" && stage !== "analyzing" && (
          <>
            <button
              onClick={() => { setRecordedBlob(null); setPreview(null); setStage("recording"); }}
              className="px-5 py-3 rounded-xl border text-sm font-medium"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            >
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
              <Sparkles size={18} />
              Analyze with AI
            </motion.button>
          </>
        )}

        {stage === "done" && (
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setLocation(`/entry/${entryId}`)}
              className="flex-1 py-3 rounded-xl text-white font-medium"
              style={{ background: "hsl(var(--primary))" }}
            >
              View Entry
            </button>
            <button
              onClick={() => setLocation("/timeline")}
              className="flex-1 py-3 rounded-xl border font-medium"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              Timeline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
