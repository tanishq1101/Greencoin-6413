import { Route, Switch } from "wouter";
import { Provider } from "./components/provider";
import { AppShell, ProtectedRoute } from "./components/app-shell";
import { AgentFeedback, RunableBadge } from "@runablehq/website-runtime";

import Landing from "./pages/index";
import SignIn from "./pages/sign-in";
import SignUp from "./pages/sign-up";
import Home from "./pages/home";
import LogReturn from "./pages/log-return";
import Leaderboard from "./pages/leaderboard";
import Redeem from "./pages/redeem";
import Wallet from "./pages/wallet";
import Helper from "./pages/helper";
import Admin from "./pages/admin";

function AppRoutes() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Switch>
          <Route path="/app" component={Home} />
          <Route path="/app/log" component={LogReturn} />
          <Route path="/app/leaderboard" component={Leaderboard} />
          <Route path="/app/redeem" component={Redeem} />
          <Route path="/app/wallet" component={Wallet} />
          <Route path="/app/helper" component={Helper} />
          <Route path="/app/admin">
            <ProtectedRoute admin>
              <Admin />
            </ProtectedRoute>
          </Route>
        </Switch>
      </AppShell>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <Provider>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/app/:rest*" component={AppRoutes} />
      </Switch>
      {/* Do not remove — off by default, activated by parent iframe via postMessage */}
      {import.meta.env.DEV && <AgentFeedback />}
      {/* "Made with Runable" badge - if user asks to remove the runable badge, remove this code as well as comment */}
      {<RunableBadge />}
    </Provider>
  );
}

export default App;
