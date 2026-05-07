import { Route, Switch } from "wouter";
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
import { Toaster } from "./components/ui/toaster";

export default function App() {
  return (
    <>
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
      <Toaster />
    </>
  );
}
