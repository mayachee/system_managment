import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import StatsCard from "@/components/Dashboard/StatsCard";
import RentalActivityChart from "@/components/Dashboard/RentalActivityChart";
import CarAvailabilityChart from "@/components/Dashboard/CarAvailabilityChart";
import RecentActivity from "@/components/Dashboard/RecentActivity";
import PopularCars from "@/components/Dashboard/PopularCars";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const { 
    data: activities, 
    isLoading: isLoadingActivities,
    error: activitiesError,
    refetch: refetchActivities
  } = useQuery({
    queryKey: ["/api/dashboard/activity"],
  });
  
  const { 
    data: popularCars, 
    isLoading: isLoadingPopularCars,
    error: popularCarsError,
    refetch: refetchPopularCars
  } = useQuery({
    queryKey: ["/api/dashboard/popular-cars"],
  });
  
  const isLoading = isLoadingStats || isLoadingActivities || isLoadingPopularCars;
  const hasError = statsError || activitiesError || popularCarsError;
  
  const handleRefresh = () => {
    refetchStats();
    refetchActivities();
    refetchPopularCars();
  };
  
  // Auto refresh on initial load to ensure we have the latest data
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/popular-cars"] });
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
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
        
        {hasError && (
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
          {isLoadingStats ? (
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
                value={stats?.cars || 0} 
                icon="car" 
                change="+8%" 
                changeText="from last month" 
              />
              <StatsCard 
                title="Active Rentals" 
                value={stats?.activeRentals || 0} 
                icon="calendar" 
                change="+12%" 
                changeText="from last month" 
                variant="secondary" 
              />
              <StatsCard 
                title="Total Users" 
                value={stats?.users || 0} 
                icon="user" 
                change="+5%" 
                changeText="from last month" 
                variant="amber" 
              />
              <StatsCard 
                title="Locations" 
                value={stats?.locations || 0} 
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
                value={stats?.userRentals || 0} 
                icon="calendar" 
                change="" 
                changeText="total bookings" 
              />
              <StatsCard 
                title="Active Rentals" 
                value={stats?.activeUserRentals || 0} 
                icon="car" 
                change="" 
                changeText="currently active" 
                variant="secondary" 
              />
              <StatsCard 
                title="Completed Rentals" 
                value={stats?.completedUserRentals || 0} 
                icon="check" 
                change="" 
                changeText="past bookings" 
                variant="amber" 
              />
              <StatsCard 
                title="Available Cars" 
                value={stats?.availableCars || 0} 
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
            {isLoadingStats ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <RentalActivityChart data={stats} isAdmin={user?.role === "admin"} />
            )}
          </div>
          
          {/* Car Availability */}
          <div>
            {isLoadingStats ? (
              <Skeleton className="h-80 w-full" />
            ) : (
              <CarAvailabilityChart data={stats} isAdmin={user?.role === "admin"} />
            )}
          </div>
        </div>
        
        {/* Recent Activity & Popular Cars */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            {isLoadingActivities ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <RecentActivity activities={activities || []} />
            )}
          </div>
          
          {/* Popular Cars */}
          <div>
            {isLoadingPopularCars ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <PopularCars cars={popularCars || []} />
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
