import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import Landing from "@/pages/Landing";
import AssetOverview from "@/pages/AssetOverview";
import CashFlowPlanner from "@/pages/CashFlowPlanner";
import Ledger from "@/pages/Ledger";
import Investment from "@/pages/Investment";
import Settings from "@/pages/Settings";
import AccountManagement from "@/pages/AccountManagement";
import AccountForm from "@/pages/AccountForm";
import ConnectionTest from "@/pages/ConnectionTest";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  return (
    <>
      <Switch>
        <Route path="/" component={AssetOverview} />
        <Route path="/landing" component={Landing} />
        <Route path="/cash-flow" component={CashFlowPlanner} />
        <Route path="/ledger" component={Ledger} />
        <Route path="/investment" component={Investment} />
        <Route path="/settings" component={Settings} />
        <Route path="/account-management" component={AccountManagement} />
        <Route path="/account-management/add" component={AccountForm} />
        <Route path="/account-management/edit/:id" component={AccountForm} />
        <Route path="/test-connection" component={ConnectionTest} />
      </Switch>
      <BottomNav />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
