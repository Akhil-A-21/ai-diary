import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
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
import { Toaster } from "./components/ui/toaster";
import { useAuth } from "./context/AuthContext";

function ProtectedApp() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "hsl(var(--primary))", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!user) return null;

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
      </Switch>
    </Layout>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user && location === "/login") {
      setLocation("/");
    }
  }, [user, isLoading, location, setLocation]);

  return (
    <>
      <Switch>
        <Route path="/login" component={Login} />
        <Route>
          <ProtectedApp />
        </Route>
      </Switch>
      <Toaster />
    </>
  );
}
