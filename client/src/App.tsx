import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Generator from "./pages/Generator";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Knowledge from "./pages/Knowledge";
import DMAssistant from "./pages/DMAssistant";
import DiscAnalyzer from "./pages/DiscAnalyzer";
import ForgotPassword from "./pages/ForgotPassword";
import ActivityPlanning from "./pages/ActivityPlanning";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/generator"} component={Generator} />
      <Route path={"/login"} component={Login} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/knowledge"} component={Knowledge} />
      <Route path={"/dm-assistant"} component={DMAssistant} />
      <Route path={"/disc-analyzer"} component={DiscAnalyzer} />
      <Route path={"/activity-planning"} component={ActivityPlanning} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
