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
        // Fetch user profile from Google
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: "hsl(var(--primary))" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: "hsl(var(--accent))" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-3xl border p-8 space-y-8"
          style={{
            background: "hsl(240 15% 11%)",
            borderColor: "hsl(240 12% 20%)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Sparkles size={32} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                AI Diary
              </h1>
              <p className="text-sm mt-1" style={{ color: "hsl(240 8% 55%)" }}>
                Your daily companion
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" style={{ borderColor: "hsl(240 12% 20%)" }} />

          {/* Sign in area */}
          <div className="space-y-4">
            <p
              className="text-center text-sm font-medium"
              style={{ color: "hsl(240 8% 70%)" }}
            >
              Sign in to access your personal diary
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleGoogleLogin()}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-5 rounded-xl font-medium text-sm transition-all"
              style={{
                background: "hsl(240 15% 17%)",
                border: "1px solid hsl(240 12% 26%)",
                color: "hsl(240 10% 90%)",
              }}
            >
              {/* Google logo SVG */}
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
          <div className="flex items-start gap-3 rounded-xl p-3" style={{ background: "hsl(240 15% 15%)" }}>
            <Shield size={14} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-xs leading-relaxed" style={{ color: "hsl(240 8% 55%)" }}>
              Your diary is completely private. Each account has its own encrypted space — nobody else can see your entries.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Lock size={11} style={{ color: "hsl(240 8% 40%)" }} />
            <p className="text-xs" style={{ color: "hsl(240 8% 40%)" }}>
              Secured by Google OAuth
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
