import { Route, Switch, useLocation } from "wouter";
import { useEffect, useRef, useState } from "react";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Record from "./pages/Record";
import Timeline from "./pages/Timeline";
import EntryDetail from "./pages/EntryDetail";
import Analytics from "./pages/Analytics";
import Calendar from "./pages/Calendar";
import Goals from "./pages/Goals";
import Gratitude from "./pages/Gratitude";
import Pixels from "./pages/Pixels";
import Habits from "./pages/Habits";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import SearchPage from "./pages/Search";
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import LockScreen from "./components/LockScreen";

const SESSION_UNLOCK_KEY = (email: string) => `ai_diary_unlocked_${email}`;

function ProtectedApp({ userEmail }: { userEmail: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [lockChecked, setLockChecked] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) setLocation("/login");
  }, [user, isLoading, setLocation]);

  // Check PIN lock status on mount
  useEffect(() => {
    if (!userEmail) return;
    const alreadyUnlocked = sessionStorage.getItem(SESSION_UNLOCK_KEY(userEmail));
    if (alreadyUnlocked) {
      setLockChecked(true);
      setLocked(false);
      return;
    }
    fetch("/api/pin")
      .then((r) => r.json())
      .then((data: { enabled: boolean }) => {
        if (data.enabled) {
          setLocked(true);
        }
        setLockChecked(true);
      })
      .catch(() => setLockChecked(true));
  }, [userEmail]);

  const handleUnlock = () => {
    sessionStorage.setItem(SESSION_UNLOCK_KEY(userEmail), "1");
    setLocked(false);
  };

  if (isLoading || !lockChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="w-8 h-8 rounded-full border-2 animate-spin"
          style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (!user) return null;

  if (locked) return <LockScreen onUnlock={handleUnlock} />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/record" component={Record} />
        <Route path="/timeline" component={Timeline} />
        <Route path="/entry/:id" component={EntryDetail} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/goals" component={Goals} />
        <Route path="/gratitude" component={Gratitude} />
        <Route path="/pixels" component={Pixels} />
        <Route path="/habits" component={Habits} />
        <Route path="/chat" component={Chat} />
        <Route path="/settings" component={Settings} />
        <Route path="/search" component={SearchPage} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const prevEmailRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && location === "/login") setLocation("/");
  }, [user, isLoading, location, setLocation]);

  // Clear query cache when user account changes so fresh data is always fetched
  useEffect(() => {
    if (isLoading) return;
    const currentEmail = user?.email ?? null;
    if (prevEmailRef.current !== currentEmail) {
      prevEmailRef.current = currentEmail;
      queryClient.clear();
    }
  }, [user?.email, isLoading, queryClient]);

  return (
    <>
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <ProtectedApp
            key={user?.email ?? "guest"}
            userEmail={user?.email ?? ""}
          />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
