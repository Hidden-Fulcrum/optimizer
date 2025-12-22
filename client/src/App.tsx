import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import OptimizerV5 from "./pages/OptimizerV5";
import Scenarios from "./pages/Scenarios";
import ProductionLogs from "./pages/ProductionLogs";
import ProductionLogDetail from "./pages/ProductionLogDetail";
import Settings from "./pages/Settings";
import Inventory from "./pages/Inventory";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/optimizer">
        <ProtectedRoute>
          <OptimizerV5 />
        </ProtectedRoute>
      </Route>
      <Route path="/scenarios">
        <ProtectedRoute>
          <Scenarios />
        </ProtectedRoute>
      </Route>
      <Route path="/production-logs">
        <ProtectedRoute>
          <ProductionLogs />
        </ProtectedRoute>
      </Route>
      <Route path="/production-log/:id">
        <ProtectedRoute>
          <ProductionLogDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
