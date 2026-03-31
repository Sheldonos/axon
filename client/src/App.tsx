import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import TermSheets from "./pages/TermSheets";
import TermSheetBuilder from "./pages/TermSheetBuilder";
import RiskAnalysis from "./pages/RiskAnalysis";
import Counterparties from "./pages/Counterparties";
import TradeExecution from "./pages/TradeExecution";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/term-sheets" component={TermSheets} />
      <Route path="/term-sheets/new" component={TermSheetBuilder} />
      <Route path="/term-sheets/:id/risk" component={RiskAnalysis} />
      <Route path="/counterparties" component={Counterparties} />
      <Route path="/trades" component={Dashboard} />
      <Route path="/trades/:id" component={TradeExecution} />
      <Route path="/login" component={Login} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
