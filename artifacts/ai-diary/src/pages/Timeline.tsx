import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Search, Plus, Trash2, Calendar, Tag } from "lucide-react";
import { useDiaryEntries, useDeleteEntry } from "../hooks/useApi";
import { getMoodEmoji, getMoodColor, formatDate } from "../lib/utils";
import { toast } from "../hooks/use-toast";

export default function Timeline() {
  const [search, setSearch] = useState("");
  const { data: entries = [], isLoading } = useDiaryEntries(search || undefined);
  const deleteEntry = useDeleteEntry();

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteEntry.mutateAsync(id);
      toast({ title: "Entry deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Timeline</h1>
          <p className="text-sm mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>All your diary entries</p>
        </div>
        <Link href="/record">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: "hsl(var(--primary))" }}
            data-testid="button-new-entry"
          >
            <Plus size={15} />
            New
          </motion.button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "hsl(var(--muted-foreground))" }} />
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
          style={{ background: "hsl(var(--input))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
          data-testid="input-search"
        />
      </div>

      {/* Entries */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "hsl(var(--muted))" }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📹</p>
          <p className="font-medium">No entries yet</p>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>Start recording your video diary</p>
          <Link href="/record">
            <button className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-medium" style={{ background: "hsl(var(--primary))" }}>
              Record First Entry
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/entry/${entry.id}`}>
                <div
                  className="rounded-2xl p-4 border cursor-pointer hover:shadow-md transition-all group"
                  style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                  data-testid={`card-entry-${entry.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: getMoodColor(entry.mood) + "20" }}
                      >
                        {getMoodEmoji(entry.mood)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{entry.title}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                            <Calendar size={11} />
                            {formatDate(entry.entryDate)}
                          </span>
                          {entry.mood && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                              style={{ background: getMoodColor(entry.mood) + "20", color: getMoodColor(entry.mood) }}
                            >
                              {entry.mood}
                            </span>
                          )}
                        </div>
                        {entry.summary && (
                          <p className="text-xs mt-1.5 line-clamp-2 leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {entry.summary}
                          </p>
                        )}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Tag size={10} style={{ color: "hsl(var(--muted-foreground))" }} />
                            {entry.tags.map((tag) => (
                              <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-50"
                      style={{ color: "hsl(var(--muted-foreground))" }}
                      data-testid={`button-delete-${entry.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
