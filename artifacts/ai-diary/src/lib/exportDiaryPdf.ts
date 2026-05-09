import { jsPDF } from "jspdf";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiaryEntry {
  id: number;
  title: string;
  summary?: string;
  mood?: string;
  moodScore?: number;
  energyLevel?: number;
  entryDate: string;
  triggers?: string[];
}

interface MoodTrend {
  date: string;
  moodScore?: number;
  mood?: string;
  source?: string;
}

interface EmotionPattern {
  mood: string;
  count: number;
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const BG      = [15,  14,  23]  as [number,number,number];
const CARD    = [24,  22,  37]  as [number,number,number];
const BORDER  = [40,  38,  60]  as [number,number,number];
const PRIMARY = [124, 58, 237]  as [number,number,number];
const TEXT    = [220, 216, 236] as [number,number,number];
const MUTED   = [120, 116, 145] as [number,number,number];
const WHITE   = [255, 255, 255] as [number,number,number];

const MOOD_COLORS: Record<string, [number,number,number]> = {
  happy:      [34,  197, 94],
  calm:       [59,  130, 246],
  energized:  [245, 158, 11],
  reflective: [168, 85,  247],
  grateful:   [20,  184, 166],
  sad:        [100, 116, 139],
  anxious:    [239, 68,  68],
  angry:      [220, 38,  38],
};

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", sad: "😢", anxious: "😰", calm: "😌",
  energized: "⚡", reflective: "🤔", grateful: "🙏", angry: "😤",
};

const PIE_PALETTE: [number,number,number][] = [
  [139, 92, 246], [236, 72, 153], [59, 130, 246],
  [34, 197, 94],  [245, 158, 11], [239, 68, 68], [148, 163, 184],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function rgb(doc: jsPDF, c: [number,number,number]) {
  doc.setFillColor(c[0], c[1], c[2]);
  doc.setDrawColor(c[0], c[1], c[2]);
  doc.setTextColor(c[0], c[1], c[2]);
}

function textColor(doc: jsPDF, c: [number,number,number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, c: [number,number,number], r = 0) {
  doc.setFillColor(c[0], c[1], c[2]);
  if (r > 0) doc.roundedRect(x, y, w, h, r, r, "F");
  else doc.rect(x, y, w, h, "F");
}

function formatDate(dateStr: string): { long: string; day: string } {
  const d = new Date(dateStr + "T12:00:00");
  return {
    long: d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    day:  d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
  };
}

function wrapText(doc: jsPDF, text: string, x: number, maxW: number, lineH: number, startY: number, maxY: number): number {
  const lines = doc.splitTextToSize(text, maxW);
  let y = startY;
  for (const line of lines) {
    if (y + lineH > maxY) break;
    doc.text(line, x, y);
    y += lineH;
  }
  return y;
}

function moodColor(mood?: string): [number,number,number] {
  return MOOD_COLORS[mood?.toLowerCase() ?? ""] ?? PRIMARY;
}

// ─── Page utilities ───────────────────────────────────────────────────────────
function newPage(doc: jsPDF, pageW: number, pageH: number) {
  doc.addPage();
  fillRect(doc, 0, 0, pageW, pageH, BG);
}

function pageHeader(doc: jsPDF, pageW: number, label: string) {
  // Subtle top stripe
  fillRect(doc, 0, 0, pageW, 8, [20, 18, 32]);
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, 3, 8, "F");
  textColor(doc, MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("AI DIARY", 8, 5.5);
  doc.text(label.toUpperCase(), pageW - 8, 5.5, { align: "right" });
}

function pageFooter(doc: jsPDF, pageW: number, pageH: number, pageNum: number, total: number) {
  const y = pageH - 6;
  textColor(doc, MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${pageNum} / ${total}`, pageW / 2, y, { align: "center" });
}

// ─── Cover page ───────────────────────────────────────────────────────────────
function buildCover(doc: jsPDF, pageW: number, pageH: number, userName: string, entries: DiaryEntry[], label?: string) {
  fillRect(doc, 0, 0, pageW, pageH, BG);

  // Purple gradient header band
  const bandH = pageH * 0.42;
  for (let i = 0; i < bandH; i++) {
    const t = i / bandH;
    const r = Math.round(79 + (124 - 79) * (1 - t));
    const g = Math.round(70 + (58 - 70) * (1 - t));
    const b = Math.round(229 + (237 - 229) * (1 - t));
    doc.setFillColor(r, g, b);
    doc.rect(0, i, pageW, 1.2, "F");
  }

  // Icon circle
  const cx = pageW / 2, icy = 52;
  doc.setFillColor(255, 255, 255, 0.15);
  doc.setFillColor(200, 170, 255);
  doc.circle(cx, icy, 14, "F");
  doc.setFillColor(255, 255, 255);
  // Book icon (simplified rectangles)
  doc.rect(cx - 6, icy - 7, 5.5, 14, "F");
  doc.setFillColor(200, 170, 255);
  doc.rect(cx - 5.5, icy - 6, 4.5, 12, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(cx + 0.5, icy - 7, 5.5, 14, "F");
  doc.setFillColor(200, 170, 255);
  doc.rect(cx + 1, icy - 6, 4.5, 12, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(cx - 0.5, icy - 7, 1, 14, "F");

  // Title
  textColor(doc, WHITE);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("AI Diary", cx, 85, { align: "center" });

  textColor(doc, [220, 200, 255]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Your Personal Emotional Journey", cx, 95, { align: "center" });

  if (label) {
    textColor(doc, [200, 170, 255]);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), cx, 105, { align: "center" });
  }

  // Stats strip
  const statsY = 115;
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));
  const first = sorted[0]?.entryDate;
  const last = sorted[sorted.length - 1]?.entryDate;
  const avgScore = entries.filter(e => e.moodScore != null).reduce((s, e) => s + (e.moodScore! * 10), 0) /
    (entries.filter(e => e.moodScore != null).length || 1);

  const stats = [
    { label: "Entries", value: String(entries.length) },
    { label: "Avg Mood", value: avgScore.toFixed(1) + "/10" },
    { label: "From", value: first ? new Date(first + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—" },
    { label: "To", value: last  ? new Date(last  + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—" },
  ];

  const colW = pageW / stats.length;
  stats.forEach((s, i) => {
    const x = i * colW + colW / 2;
    fillRect(doc, i * colW + 4, statsY - 8, colW - 8, 22, CARD, 4);
    textColor(doc, WHITE);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(s.value, x, statsY + 3, { align: "center" });
    textColor(doc, MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(s.label.toUpperCase(), x, statsY + 9, { align: "center" });
  });

  // User name
  textColor(doc, TEXT);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Prepared for ${userName}`, cx, 153, { align: "center" });
  textColor(doc, MUTED);
  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }), cx, 161, { align: "center" });

  // Divider
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.3);
  doc.line(20, 168, pageW - 20, 168);

  // Table of contents preview
  textColor(doc, MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("CONTENTS", 20, 178);
  const items = ["Daily Entries — mood · summary · triggers", "Mood Timeline — line chart", "Emotion Patterns — pie chart"];
  items.forEach((item, i) => {
    textColor(doc, TEXT);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.circle(22, 185 + i * 9, 1.2, "F");
    doc.text(item, 27, 185.5 + i * 9);
  });
}

// ─── Entry page ───────────────────────────────────────────────────────────────
function buildEntryPage(doc: jsPDF, pageW: number, pageH: number, entry: DiaryEntry, index: number) {
  const M = 14; // margin
  const contentW = pageW - M * 2;
  let y = 16;

  pageHeader(doc, pageW, `Entry ${index + 1}`);
  y = 16;

  // ── Date banner ──
  const { long, day } = formatDate(entry.entryDate);
  const mc = moodColor(entry.mood);
  fillRect(doc, M, y, contentW, 18, CARD, 3);
  // Left accent bar
  doc.setFillColor(mc[0], mc[1], mc[2]);
  doc.roundedRect(M, y, 3, 18, 1.5, 1.5, "F");

  textColor(doc, WHITE);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(long, M + 7, y + 7);

  textColor(doc, MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(day, M + 7, y + 13);
  y += 24;

  // ── Mood badge ──
  if (entry.mood) {
    const emoji = MOOD_EMOJIS[entry.mood] ?? "💭";
    const badgeW = 60, badgeH = 14;
    fillRect(doc, M, y, badgeW, badgeH, [mc[0], mc[1], mc[2]], 3);
    doc.setFillColor(mc[0], mc[1], mc[2]);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(M, y, badgeW, badgeH, 3, 3, "F");
    doc.setGState(doc.GState({ opacity: 1 }));
    fillRect(doc, M, y, badgeW, badgeH, [mc[0]*0.3, mc[1]*0.3, mc[2]*0.3] as [number,number,number], 3);
    doc.setFillColor(mc[0], mc[1], mc[2]);
    doc.roundedRect(M, y, badgeW, badgeH, 3, 3, "F");

    textColor(doc, WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${emoji}  ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}`, M + 4, y + 9.5);

    // Mood score bar
    if (entry.moodScore != null) {
      const score = entry.moodScore * 10;
      const barX = M + badgeW + 8;
      const barW = contentW - badgeW - 8;
      const barH = 5;
      const barY = y + (badgeH - barH) / 2;

      fillRect(doc, barX, barY, barW, barH, BORDER, 2.5);
      fillRect(doc, barX, barY, barW * (score / 10), barH, mc, 2.5);

      textColor(doc, WHITE);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${score.toFixed(1)}/10`, barX + barW + 3, barY + 4);

      textColor(doc, MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("Mood Score", barX, barY - 2);
    }
    y += badgeH + 10;
  }

  // ── Summary ──
  if (entry.summary) {
    fillRect(doc, M, y, contentW, 6, CARD, 3);
    // Label
    textColor(doc, PRIMARY);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY", M, y - 2);

    // Card
    const summaryLines = doc.splitTextToSize(entry.summary, contentW - 10);
    const cardH = Math.min(summaryLines.length * 5.5 + 10, 70);
    fillRect(doc, M, y, contentW, cardH, CARD, 3);

    textColor(doc, TEXT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let ty = y + 6;
    for (const line of summaryLines) {
      if (ty + 6 > y + cardH) break;
      doc.text(line, M + 5, ty);
      ty += 5.5;
    }
    y += cardH + 8;
  }

  // ── Triggers ──
  if (entry.triggers && entry.triggers.length > 0) {
    textColor(doc, PRIMARY);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.text("TRIGGERS", M, y);
    y += 4;

    const cols = 2;
    const colW2 = (contentW - 4) / cols;
    entry.triggers.forEach((trigger, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const tx = M + col * (colW2 + 4);
      const ty = y + row * 10;
      if (ty + 8 > pageH - 15) return;

      fillRect(doc, tx, ty, colW2, 8, [mc[0]*0.12, mc[1]*0.12, mc[2]*0.12] as [number,number,number], 2);
      doc.setFillColor(mc[0], mc[1], mc[2]);
      doc.circle(tx + 4, ty + 4, 1.2, "F");
      textColor(doc, TEXT);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const short = trigger.length > 30 ? trigger.slice(0, 28) + "…" : trigger;
      doc.text(short, tx + 7.5, ty + 5.2);
    });
    y += Math.ceil(entry.triggers.length / cols) * 10 + 4;
  }

  // ── Energy level ──
  if (entry.energyLevel != null) {
    if (y + 14 < pageH - 15) {
      textColor(doc, MUTED);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.text(`Energy Level: ${entry.energyLevel}/10`, M, y + 6);
      // Mini energy dots
      for (let d = 0; d < 10; d++) {
        const active = d < entry.energyLevel;
        doc.setFillColor(active ? PRIMARY[0] : BORDER[0], active ? PRIMARY[1] : BORDER[1], active ? PRIMARY[2] : BORDER[2]);
        doc.circle(M + 35 + d * 5.5, y + 4, 1.8, "F");
      }
    }
  }
}

// ─── Line chart page ──────────────────────────────────────────────────────────
function buildLineChart(doc: jsPDF, pageW: number, pageH: number, trends: MoodTrend[]) {
  const M = 16;
  pageHeader(doc, pageW, "Mood Timeline");

  textColor(doc, WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Mood Timeline", M, 22);
  textColor(doc, MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Your emotional journey over time (scored 0–10)", M, 29);

  const yAxisW = 14;
  const chartX = M + yAxisW;
  const chartY = 38;
  const chartW = pageW - M * 2 - yAxisW;
  const chartH = 88;
  const bottom  = chartY + chartH;

  // Background card
  fillRect(doc, chartX, chartY, chartW, chartH, CARD, 2);

  // Horizontal grid lines + Y labels (0, 2, 4, 6, 8, 10)
  for (let i = 0; i <= 5; i++) {
    const gy = chartY + chartH - (i / 5) * chartH;
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(chartX, gy, chartX + chartW, gy);
    textColor(doc, MUTED);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(String(i * 2), chartX - 2, gy + 2, { align: "right" });
  }

  // Filter valid data points, newest-first from API → reverse to chronological
  const data = trends
    .filter(t => t.moodScore != null)
    .slice(0, 30)
    .reverse();

  if (data.length === 0) {
    textColor(doc, MUTED);
    doc.setFontSize(9);
    doc.text("No mood data available yet.", chartX + chartW / 2, chartY + chartH / 2, { align: "center" });
    // Still draw the stats block with zeros
  } else {
    // Map data → pixel coordinates
    // moodScore is 0-1; high score → line near TOP (small y in PDF)
    // y = chartY + chartH - (score * chartH)
    const pts = data.map((t, i) => ({
      x: chartX + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW),
      y: chartY + chartH - (t.moodScore! * chartH),
      mood: t.mood,
      score: t.moodScore!,
      date: t.date,
    }));

    // ── Area fill: for each segment draw two triangles from line → chart bottom ──
    // This is correct regardless of score values (no strip/alpha confusion)
    const FILL: [number, number, number] = [55, 25, 110];
    doc.setFillColor(FILL[0], FILL[1], FILL[2]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i + 1];
      // Quad: p1 (line) → p2 (line) → p2 (bottom) → p1 (bottom)
      doc.triangle(p1.x, p1.y, p2.x, p2.y, p2.x, bottom, "F");
      doc.triangle(p1.x, p1.y, p2.x, bottom, p1.x, bottom, "F");
    }
    // Single-point fallback: draw a thin vertical bar
    if (pts.length === 1) {
      doc.setFillColor(FILL[0], FILL[1], FILL[2]);
      doc.rect(pts[0].x - 1, pts[0].y, 2, bottom - pts[0].y, "F");
    }

    // ── Line on top of fill ──
    doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.setLineWidth(1.8);
    for (let i = 0; i < pts.length - 1; i++) {
      doc.line(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y);
    }

    // ── Dots — outer mood-coloured ring, white centre ──
    const step = Math.max(1, Math.floor(data.length / 8));
    pts.forEach((pt, i) => {
      const mc = moodColor(pt.mood);
      // Outer dot (mood colour)
      doc.setFillColor(mc[0], mc[1], mc[2]);
      doc.circle(pt.x, pt.y, 2.8, "F");
      // Inner white fill
      doc.setFillColor(255, 255, 255);
      doc.circle(pt.x, pt.y, 1.2, "F");

      // Date label at regular intervals + last point
      if (i % step === 0 || i === pts.length - 1) {
        textColor(doc, MUTED);
        doc.setFontSize(5.5);
        doc.text(pt.date.slice(5), pt.x, bottom + 6, { align: "center" });
      }
    });

    // ── Stats cards below chart ──
    const statsY = bottom + 14;
    const scores = pts.map(p => p.score * 10);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const peak = Math.max(...scores);
    const low  = Math.min(...scores);
    const sw   = (pageW - M * 2) / 4;

    [
      { label: "Average", value: avg.toFixed(1)  },
      { label: "Peak",    value: peak.toFixed(1) },
      { label: "Lowest",  value: low.toFixed(1)  },
      { label: "Entries", value: String(data.length) },
    ].forEach((s, i) => {
      const sx = M + i * sw + sw / 2;
      fillRect(doc, M + i * sw + 2, statsY, sw - 4, 16, CARD, 3);
      textColor(doc, WHITE);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(s.value, sx, statsY + 9, { align: "center" });
      textColor(doc, MUTED);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(s.label.toUpperCase(), sx, statsY + 14, { align: "center" });
    });
  }

  // Y-axis label
  textColor(doc, MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Score", M - 2, chartY + chartH / 2, { angle: 90, align: "center" });
}

// ─── Pie chart page ───────────────────────────────────────────────────────────
function buildPieChart(doc: jsPDF, pageW: number, pageH: number, patterns: EmotionPattern[]) {
  const M = 16;
  pageHeader(doc, pageW, "Emotion Patterns");

  textColor(doc, WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Emotion Patterns", M, 22);
  textColor(doc, MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Distribution of moods across all your diary entries", M, 29);

  if (!patterns.length) {
    textColor(doc, MUTED);
    doc.setFontSize(9);
    doc.text("No mood data available.", pageW / 2, 80, { align: "center" });
    return;
  }

  const total = patterns.reduce((s, p) => s + p.count, 0);
  const cx = pageW / 2;
  const cy = 90;
  const r  = 42;

  // Draw pie slices
  let startAngle = -Math.PI / 2;
  patterns.forEach((p, i) => {
    const slice = (p.count / total) * 2 * Math.PI;
    const endAngle = startAngle + slice;
    const color = PIE_PALETTE[i % PIE_PALETTE.length];

    // Draw slice using many thin triangles
    const steps = Math.max(8, Math.ceil(slice * 20));
    doc.setFillColor(color[0], color[1], color[2]);
    for (let s = 0; s < steps; s++) {
      const a1 = startAngle + (s / steps) * slice;
      const a2 = startAngle + ((s + 1) / steps) * slice;
      const x1 = cx + Math.cos(a1) * r;
      const y1 = cy + Math.sin(a1) * r;
      const x2 = cx + Math.cos(a2) * r;
      const y2 = cy + Math.sin(a2) * r;
      // Triangle: center → x1,y1 → x2,y2
      doc.triangle(cx, cy, x1, y1, x2, y2, "F");
    }

    // Slice separator
    doc.setDrawColor(BG[0], BG[1], BG[2]);
    doc.setLineWidth(0.8);
    const lx = cx + Math.cos(startAngle) * r;
    const ly = cy + Math.sin(startAngle) * r;
    doc.line(cx, cy, lx, ly);

    // Label (only for slices > 8%)
    const pct = p.count / total;
    if (pct > 0.08) {
      const midAngle = startAngle + slice / 2;
      const labelR = r * 0.65;
      const lbx = cx + Math.cos(midAngle) * labelR;
      const lby = cy + Math.sin(midAngle) * labelR;
      textColor(doc, WHITE);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.text(`${Math.round(pct * 100)}%`, lbx, lby + 2, { align: "center" });
    }

    startAngle = endAngle;
  });

  // Centre donut hole
  fillRect(doc, cx - 14, cy - 14, 28, 28, BG);
  doc.setFillColor(BG[0], BG[1], BG[2]);
  doc.circle(cx, cy, 14, "F");
  textColor(doc, WHITE);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(String(total), cx, cy + 2, { align: "center" });
  textColor(doc, MUTED);
  doc.setFontSize(6);
  doc.text("entries", cx, cy + 7, { align: "center" });

  // Legend
  const legendY = cy + r + 14;
  const cols = 2;
  const colW = (pageW - M * 2) / cols;
  patterns.forEach((p, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const lx = M + col * colW;
    const ly = legendY + row * 12;
    if (ly + 10 > pageH - 14) return;

    const color = PIE_PALETTE[i % PIE_PALETTE.length];
    const emoji = MOOD_EMOJIS[p.mood] ?? "💭";
    const pct = ((p.count / total) * 100).toFixed(1);

    fillRect(doc, lx, ly, colW - 4, 10, CARD, 2);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(lx, ly, 3, 10, 1.5, 1.5, "F");

    textColor(doc, TEXT);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(`${emoji}  ${p.mood.charAt(0).toUpperCase() + p.mood.slice(1)}`, lx + 6, ly + 7);

    textColor(doc, MUTED);
    doc.setFontSize(7.5);
    doc.text(`${p.count}x · ${pct}%`, lx + colW - 8, ly + 7, { align: "right" });
  });
}

// ─── Main export function ─────────────────────────────────────────────────────
export async function exportDiaryPdf(
  userName: string,
  entries: DiaryEntry[],
  trends: MoodTrend[],
  patterns: EmotionPattern[],
  label?: string,
  filename?: string,
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Sort entries newest-first for display, but pass all to cover
  const sorted = [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate));

  // Total page count estimation (cover + entries + 2 chart pages)
  const totalPages = 1 + sorted.length + 2;

  // ── Cover ──
  buildCover(doc, pageW, pageH, userName, sorted, label);

  // ── Entry pages ──
  sorted.forEach((entry, idx) => {
    newPage(doc, pageW, pageH);
    buildEntryPage(doc, pageW, pageH, entry, idx);
    pageFooter(doc, pageW, pageH, idx + 2, totalPages);
  });

  // ── Line chart ──
  newPage(doc, pageW, pageH);
  buildLineChart(doc, pageW, pageH, trends);
  pageFooter(doc, pageW, pageH, sorted.length + 2, totalPages);

  // ── Pie chart ──
  newPage(doc, pageW, pageH);
  buildPieChart(doc, pageW, pageH, patterns);
  pageFooter(doc, pageW, pageH, totalPages, totalPages);

  // ── Save ──
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(filename ?? `ai-diary-report-${dateStr}.pdf`);
}
