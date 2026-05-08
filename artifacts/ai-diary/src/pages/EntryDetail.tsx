import { useRoute, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Download, Zap, Tag, AlertCircle, FileText, ChevronRight } from "lucide-react";
import { useDiaryEntry } from "../hooks/useApi";
import { getMoodEmoji, getMoodColor, formatDate } from "../lib/utils";

export default function EntryDetail() {
  const [, params] = useRoute("/entry/:id");
  const [, setLocation] = useLocation();
  const id = parseInt(params?.id || "0");
  const { data: entry, isLoading } = useDiaryEntry(id);

  const handlePdfExport = () => {
    window.open(`/api/diary/entries/${id}/pdf`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 rounded animate-pulse" style={{ background: "hsl(var(--muted))" }} />
        <div className="h-64 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="text-center py-16">
        <AlertCircle size={40} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="font-medium">Entry not found</p>
        <button onClick={() => setLocation("/timeline")} className="mt-3 text-sm" style={{ color: "hsl(var(--primary))" }}>
          Back to Timeline
        </button>
      </div>
    );
  }

  const moodColor = getMoodColor(entry.mood);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setLocation("/timeline")}
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "hsl(var(--muted-foreground))" }}
          data-testid="button-back"
        >
          <ArrowLeft size={15} />
          Timeline
        </button>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePdfExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
            data-testid="button-export-pdf"
          >
            <Download size={13} />
            PDF
          </motion.button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="font-display text-3xl font-bold leading-snug text-white">{entry.title}</h1>
        <p className="text-sm mt-1 text-muted-foreground">{formatDate(entry.entryDate as string)}</p>
      </div>

      {/* Mood + Stats */}
      {entry.mood && (
        <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: moodColor + "15", border: `1px solid ${moodColor}30` }}>
          <span className="text-4xl">{getMoodEmoji(entry.mood)}</span>
          <div className="flex-1">
            <p className="font-semibold capitalize" style={{ color: moodColor }}>{entry.mood}</p>
            <div className="flex items-center gap-4 mt-1">
              {entry.moodScore !== undefined && entry.moodScore !== null && (
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Mood Score</p>
                  <p className="text-sm font-medium">{entry.moodScore}/10</p>
                </div>
              )}
              {entry.energyLevel !== undefined && entry.energyLevel !== null && (
                <div>
                  <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Energy</p>
                  <p className="text-sm font-medium">{entry.energyLevel}/10</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video */}
      {entry.videoUrl && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <video src={entry.videoUrl} controls className="w-full" data-testid="video-player" />
        </div>
      )}

      {/* Summary */}
      {entry.summary && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} style={{ color: "hsl(var(--primary))" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>AI Summary</span>
          </div>
          <p className="text-sm leading-relaxed">{entry.summary}</p>
        </div>
      )}

      {/* Transcript */}
      {entry.transcript && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Transcript</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>{entry.transcript}</p>
        </div>
      )}

      {/* Triggers */}
      {entry.triggers && entry.triggers.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} style={{ color: "#f59e0b" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "hsl(var(--muted-foreground))" }}>Emotional Triggers</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.triggers.map((t) => (
              <span key={t} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "#f59e0b20", color: "#f59e0b" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={13} style={{ color: "hsl(var(--muted-foreground))" }} />
          {entry.tags.map((t) => (
            <span key={t} className="text-xs px-3 py-1.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
