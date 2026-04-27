import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import POSPage from "./pages/POSPage";
import CustomerPage from "./pages/CustomerPage";
import InventoryPage from "./pages/InventoryPage";
import GRNPage from "./pages/GRNPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import InsuranceClaimsPage from "./pages/InsuranceClaimsPage";
import FinanceReportingPage from "./pages/FinanceReportingPage";
import TransferRequestPage from "./pages/TransferRequestPage";
import UsersPage from "./pages/UsersPage";
import ReportsAnalyticsPage from "./pages/ReportsAnalyticsPage";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/dashboard"} component={DashboardPage} />
      <Route path={"/pos"} component={POSPage} />
      <Route path={"/customers"} component={CustomerPage} />
      <Route path={"/inventory"} component={InventoryPage} />
      <Route path={"/grn"} component={GRNPage} />
      <Route path={"/prescriptions"} component={PrescriptionPage} />
      <Route path={"/insurance-claims"} component={InsuranceClaimsPage} />
      <Route path={"/finance"} component={FinanceReportingPage} />
      <Route path={"/transfers"} component={TransferRequestPage} />
      <Route path={"/users"} component={UsersPage} />
      <Route path={"/reports"} component={ReportsAnalyticsPage} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
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
