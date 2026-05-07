import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "../hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi, I'm Aura 💜 I'm here to listen, support, and help you process whatever's on your mind. How are you feeling today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": localStorage.getItem("userEmail") || "demo@aivideodiary.app",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const reply = await res.json();
      setMessages([...newMessages, { role: "assistant", content: reply.content }]);
    } catch {
      toast({ title: "Failed to send message", variant: "destructive" });
      setMessages(newMessages.slice(0, -1));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Aura</h1>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>Your emotional support companion</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "#22c55e" }}>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Online
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 pr-1">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 mr-2 flex items-center justify-center mt-1"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Sparkles size={13} className="text-white" />
                </div>
              )}
              <div
                className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: msg.role === "user"
                    ? "hsl(var(--primary))"
                    : "hsl(var(--card))",
                  color: msg.role === "user" ? "white" : "hsl(var(--foreground))",
                  borderRadius: msg.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  border: msg.role === "assistant" ? "1px solid hsl(var(--border))" : "none",
                }}
                data-testid={`message-${msg.role}-${i}`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Sparkles size={13} className="text-white" />
            </div>
            <div className="rounded-2xl px-4 py-3 border" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: "hsl(var(--muted-foreground))" }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 mt-3 flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what's on your mind..."
          className="flex-1 px-4 py-3 rounded-2xl border text-sm outline-none"
          style={{
            background: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
          data-testid="input-chat"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-50"
          style={{ background: "hsl(var(--primary))" }}
          data-testid="button-send"
        >
          {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </motion.button>
      </div>
    </div>
  );
}
