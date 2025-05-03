import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import CarsPage from "@/pages/cars-page";
import RentalsPage from "@/pages/rentals-page";
import LocationsPage from "@/pages/locations-page";
import UsersPage from "@/pages/users-page";
import ProfilePage from "@/pages/profile-page";
import SettingsPage from "@/pages/settings-page";
import InsurancePage from "@/pages/insurance-page";
import MaintenancePage from "@/pages/maintenance-page";
import LoyaltyProgramPage from "@/pages/loyalty-program-page";
import VehicleHealthPage from "@/pages/vehicle-health-page";
import { ThemeSuggestion } from "@/components/ThemeSuggestion";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";
import { LocalizationProvider } from "./hooks/use-localization";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/cars" component={CarsPage} />
      <ProtectedRoute path="/rentals" component={RentalsPage} />
      <ProtectedRoute path="/insurance" component={InsurancePage} />
      <ProtectedRoute path="/locations" component={LocationsPage} />
      <ProtectedRoute path="/maintenance" component={MaintenancePage} />
      <ProtectedRoute path="/vehicle-health" component={VehicleHealthPage} />
      <ProtectedRoute path="/loyalty" component={LoyaltyProgramPage} />
      <ProtectedRoute path="/users" component={UsersPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <LocalizationProvider>
            <AuthProvider>
              <Toaster />
              <ThemeSuggestion /> 
              <Router />
            </AuthProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
