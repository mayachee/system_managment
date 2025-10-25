import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import StatsCard from "@/components/Dashboard/StatsCard";
import RentalActivityChart from "@/components/Dashboard/RentalActivityChart";
import CarAvailabilityChart from "@/components/Dashboard/CarAvailabilityChart";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import PopularCars from "@/components/Dashboard/PopularCars";
import InsuranceOverview from "@/components/Dashboard/InsuranceOverview";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { 
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/dashboard/"],
    refetchInterval: 30000, // auto refresh every 30 seconds
  });

  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Overview of your car rental system
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the dashboard data. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : user?.role === "admin" ? (
            // Admin stats
            <>
              <StatsCard 
                title="Total Cars" 
                value={dashboardData?.stats?.cars || 0}
                icon="car" 
                change="+8%" 
                changeText="from last month" 
              />
              <StatsCard 
                title="Active Rentals" 
                value={dashboardData?.stats?.activeRentals || 0}
                icon="calendar" 
                change="+12%" 
                changeText="from last month" 
                variant="secondary" 
              />
              <StatsCard 
                title="Total Users" 
                value={dashboardData?.stats?.users || 0}
                icon="user" 
                change="+5%" 
                changeText="from last month" 
                variant="amber" 
              />
              <StatsCard 
                title="Locations" 
                value={dashboardData?.stats?.locations || 0}
                icon="location" 
                change="+2" 
                changeText="new locations" 
                variant="indigo" 
              />
            </>
          ) : (
            // Regular user stats
            <>
              <StatsCard 
                title="My Rentals" 
                value={dashboardData?.stats?.userRentals || 0}
                icon="calendar" 
                change="" 
                changeText="total bookings" 
              />
              <StatsCard 
                title="Active Rentals" 
                value={dashboardData?.stats?.activeUserRentals || 0}
                icon="car" 
                change="" 
                changeText="currently active" 
                variant="secondary" 
              />
              <StatsCard 
                title="Completed Rentals" 
                value={dashboardData?.stats?.completedUserRentals || 0}
                icon="check" 
                change="" 
                changeText="past bookings" 
                variant="amber" 
              />
              <StatsCard 
                title="Available Cars" 
                value={dashboardData?.stats?.availableCars || 0}
                icon="car" 
                change="" 
                changeText="ready to book" 
                variant="indigo" 
              />
            </>
          )}
        </div>
        
        {/* Charts section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Rentals Chart */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <RentalActivityChart data={dashboardData?.stats} isAdmin={user?.role === "admin"} />
            )}
          </div>
          
          {/* Car Availability */}
          <div>
            {isLoading ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <CarAvailabilityChart data={dashboardData?.stats} isAdmin={user?.role === "admin"} />
            )}
          </div>
        </div>
        
        {/* Insurance Overview Section */}
        <InsuranceOverview 
          isAdmin={user?.role === "admin"} 
          loading={isLoading} 
        />
        
        {/* Recent Activity & Popular Cars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <RecentActivity activities={dashboardData?.activity || []} />
            )}
          </div>
          
          {/* Popular Cars */}
          <div>
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <PopularCars cars={dashboardData?.popularCars || []} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
