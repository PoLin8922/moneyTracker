import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import AssetOverview from "@/pages/AssetOverview";
import CashFlowPlanner from "@/pages/CashFlowPlanner";
import Ledger from "@/pages/Ledger";
import Investment from "@/pages/Investment";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AssetOverview} />
      <Route path="/cash-flow" component={CashFlowPlanner} />
      <Route path="/ledger" component={Ledger} />
      <Route path="/investment" component={Investment} />
      <Route path="/settings" component={Settings} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
