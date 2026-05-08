import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { Search, X, Tag, Hash } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { getMoodInfo } from "../lib/mood-utils";
import { useDiaryEntries } from "../hooks/useApi";

const BASE = "/api";

interface DiaryEntry {
  id: number;
  title: string;
  entryDate: string;
  mood: string | null;
  moodScore: number | null;
  summary: string | null;
  transcript: string | null;
  tags: string[];
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded px-0.5" style={{ background: "hsl(var(--primary) / 0.3)", color: "hsl(var(--primary))" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function WordCloud({ entries }: { entries: DiaryEntry[] }) {
  const STOPWORDS = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","is","was","i","my","me","it","that","this","so","we","you","they","he","she","be","are","were","have","had","has","not","do","did","from","by","as","about","just","can","will","up","when","what","how","all","been","no","more","out","if","there","your","his","her","its","our","their","than","who","him","them","would","could","should","into","like","some","one","time","very","too","also","get","go","got","said","even","now","then","back","after","before","two","new","way","each","know","need","feel","felt","day","days","really","much","still","over","only","been","other","because","most","also","any","such","well","make","made","think","thought","around","things","good","great"]);

  const wordFreq: Record<string, number> = {};
  entries.forEach((e) => {
    const text = [e.transcript, e.summary].filter(Boolean).join(" ");
    const words = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
    words.forEach((w) => {
      if (w.length > 3 && !STOPWORDS.has(w)) {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 50);
  if (!sorted.length) return null;

  const max = sorted[0][1];
  const min = sorted[sorted.length - 1][1];

  return (
    <div className="glass p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-4">
        <Hash className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
        <h3 className="font-semibold text-foreground">Word Cloud</h3>
        <span className="text-xs text-muted-foreground">from all transcripts</span>
      </div>
      <div className="flex flex-wrap gap-2 justify-center leading-loose">
        {sorted.map(([word, count]) => {
          const norm = max === min ? 0.5 : (count - min) / (max - min);
          const size = 0.75 + norm * 1.5;
          const opacity = 0.4 + norm * 0.6;
          const hues = [260, 280, 300, 200, 220, 240];
          const hue = hues[word.charCodeAt(0) % hues.length];
          return (
            <span
              key={word}
              style={{ fontSize: `${size}rem`, opacity, color: `hsl(${hue}, 70%, 70%)` }}
              className="cursor-default transition-all hover:opacity-100 font-medium"
              title={`"${word}" — ${count} times`}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiaryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allEntries = [] } = useDiaryEntries();

  const allTags = [...new Set(allEntries.flatMap((e) => (e as any).tags || []))] as string[];

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`${BASE}/diary/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const lower = q.toLowerCase();
        const filtered = allEntries.filter((e) =>
          e.title?.toLowerCase().includes(lower) ||
          (e as any).summary?.toLowerCase().includes(lower) ||
          (e as any).transcript?.toLowerCase().includes(lower)
        );
        setResults(filtered as DiaryEntry[]);
      }
      setSearched(true);
    } finally {
      setSearching(false);
    }
  }, [allEntries]);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const handleTagClick = (tag: string) => {
    setActiveTag(tag === activeTag ? null : tag);
    setQuery(tag === activeTag ? "" : tag);
    inputRef.current?.focus();
  };

  const displayResults = activeTag
    ? allEntries.filter((e) => ((e as any).tags || []).includes(activeTag)) as DiaryEntry[]
    : results;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="font-display text-4xl font-bold text-foreground">Search</h1>
        <p className="text-muted-foreground mt-1">Find anything across your diary entries.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActiveTag(null); }}
          placeholder="Search titles, transcripts, summaries, tags..."
          className="w-full border border-border rounded-2xl pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground focus:outline-none text-base transition-colors bg-input"
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); setSearched(false); setActiveTag(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
              style={{
                background: activeTag === tag ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: activeTag === tag ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
              }}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {searching && (
          <div className="text-center py-8 text-muted-foreground text-sm flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
            Searching...
          </div>
        )}

        {!searching && searched && displayResults.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No entries found for "{query}"</p>
          </div>
        )}

        {!searching && !searched && !activeTag && !query && allEntries.length > 0 && (
          <WordCloud entries={allEntries as DiaryEntry[]} />
        )}

        <AnimatePresence>
          {!searching && displayResults.map((entry) => {
            const info = getMoodInfo(entry.mood);
            const snippet = entry.summary || entry.transcript || "";
            const truncated = snippet.length > 180 ? snippet.slice(0, 180) + "…" : snippet;

            return (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Link href={`/entry/${entry.id}`}>
                  <div
                    className="glass p-5 rounded-2xl cursor-pointer transition-all group border border-transparent hover:border-border"
                    style={{ background: "hsl(var(--card) / 0.5)" }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{info.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {highlight(entry.title, query)}
                          </h3>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {format(new Date(entry.entryDate + "T00:00:00"), "MMM d, yyyy")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 capitalize">{entry.mood}</p>
                        {truncated && (
                          <p className="text-sm mt-2 leading-relaxed text-foreground/70">
                            {highlight(truncated, query)}
                          </p>
                        )}
                        {((entry as any).tags || []).length > 0 && (
                          <div className="flex gap-1.5 mt-3 flex-wrap">
                            {((entry as any).tags as string[]).map((tag) => (
                              <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                                <Tag className="w-2.5 h-2.5" />{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {!searching && (searched || activeTag) && displayResults.length > 0 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            {displayResults.length} result{displayResults.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
