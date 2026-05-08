import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { Sparkles, Shield, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "../hooks/use-toast";

export default function Login() {
  const { login } = useAuth();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        if (!profileRes.ok) throw new Error("Failed to fetch profile");
        const profile = await profileRes.json();

        login({
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          token: tokenResponse.access_token,
        });

        toast({ title: `Welcome back, ${profile.name.split(" ")[0]}!` });
      } catch {
        toast({ title: "Sign-in failed. Please try again.", variant: "destructive" });
      }
    },
    onError: () => {
      toast({ title: "Google sign-in was cancelled or failed.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div
          className="absolute w-[700px] h-[700px] -top-64 -left-64 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--orb-a) / 0.55), transparent 65%)", filter: "blur(70px)" }}
        />
        <div
          className="absolute w-[600px] h-[600px] -bottom-48 -right-48 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--orb-b) / 0.48), transparent 65%)", filter: "blur(75px)" }}
        />
        <div
          className="absolute w-[450px] h-[450px] top-1/3 right-1/4 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--orb-c) / 0.32), transparent 65%)", filter: "blur(80px)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* ── Glass card ── */}
        <div className="glass-elevated rounded-3xl p-8 space-y-7">

          {/* Logo */}
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: "backOut" }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                boxShadow: "0 8px 32px hsl(var(--primary) / 0.35)",
              }}
            >
              <Sparkles size={30} className="text-white drop-shadow" />
            </motion.div>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">AI Diary</h1>
              <p className="text-sm mt-1 text-muted-foreground">Your daily companion</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ background: "hsl(var(--border) / 0.5)" }} />

          {/* Sign in */}
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              Sign in to access your personal diary
            </p>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleGoogleLogin()}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: "hsl(var(--card) / 0.7)",
                border: "1px solid hsl(var(--border) / 0.7)",
                color: "hsl(var(--foreground))",
                backdropFilter: "blur(20px)",
                boxShadow: "0 2px 12px hsl(var(--background) / 0.15), inset 0 1px 0 hsl(0 0% 100% / 0.1)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
              Continue with Google
            </motion.button>
          </div>

          {/* Privacy note */}
          <div
            className="flex items-start gap-3 rounded-2xl p-3.5"
            style={{
              background: "hsl(var(--primary) / 0.06)",
              border: "1px solid hsl(var(--primary) / 0.12)",
            }}
          >
            <Shield size={13} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your diary is completely private. Each account has its own encrypted space — nobody else can see your entries.
            </p>
          </div>

          <div className="flex items-center justify-center gap-1.5">
            <Lock size={10} className="text-muted-foreground/50" />
            <p className="text-[11px] text-muted-foreground/50">Secured by Google OAuth</p>
          </div>
        </div>

        {/* Subtle reflection line below card */}
        <div
          className="absolute -bottom-px left-8 right-8 h-px rounded-full opacity-40"
          style={{ background: "linear-gradient(to right, transparent, hsl(var(--primary) / 0.4), transparent)" }}
        />
      </motion.div>
    </div>
  );
}
