import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, CarIcon, ClockIcon, UserIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const { 
    data: rentals, 
    isLoading: isLoadingRentals,
    error: rentalsError
  } = useQuery({
    queryKey: ["/api/rentals"],
  });
  
  const { 
    data: loginHistory, 
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: [`/api/users/${user?.id}/login-history`],
    enabled: !!user?.id,
  });
  
  const activeRentals = rentals?.filter(rental => rental.status === "active") || [];
  const completedRentals = rentals?.filter(rental => rental.status === "completed") || [];
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PP");
  };
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "PPp");
  };
  
  const isLoading = isLoadingRentals || isLoadingHistory;
  const hasError = rentalsError || historyError;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            View your account information and rental history
          </p>
        </div>
        
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading your profile data. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User profile card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl">
                    {user?.username ? getInitials(user.username) : "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{user?.username}</h2>
                <p className="text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                <Badge className="mt-2" variant={user?.role === "admin" ? "default" : "secondary"}>
                  {user?.role === "admin" ? "Administrator" : "User"}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Username:</span>
                  <span className="font-medium">{user?.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">Account Type:</span>
                  <span className="font-medium capitalize">{user?.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500 dark:text-neutral-400">User ID:</span>
                  <span className="font-medium">{user?.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Rental history and login activity */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="rentals" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="rentals">Rental History</TabsTrigger>
                <TabsTrigger value="activity">Login Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rentals" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Active Rentals</CardTitle>
                    <CardDescription>Your current car rentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRentals ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : activeRentals.length > 0 ? (
                      <div className="space-y-4">
                        {activeRentals.map((rental) => (
                          <div 
                            key={rental.id} 
                            className="flex items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700"
                          >
                            <div className="mr-4 h-12 w-12 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                              <CarIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {rental.car.make} {rental.car.model} ({rental.car.year})
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="flex items-center">
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                </span>
                                <span className="flex items-center">
                                  <Badge variant="outline">{rental.car.carId}</Badge>
                                </span>
                              </div>
                            </div>
                            <Badge className="ml-2">Active</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                        You don't have any active rentals.
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Completed Rentals</CardTitle>
                    <CardDescription>Your past car rentals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRentals ? (
                      <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    ) : completedRentals.length > 0 ? (
                      <div className="space-y-4">
                        {completedRentals.map((rental) => (
                          <div 
                            key={rental.id} 
                            className="flex items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700"
                          >
                            <div className="mr-4 h-12 w-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-400">
                              <CarIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {rental.car.make} {rental.car.model} ({rental.car.year})
                              </p>
                              <div className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                                <span className="flex items-center">
                                  <CalendarIcon className="mr-1 h-3 w-3" />
                                  {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                                </span>
                                <span className="flex items-center">
                                  <Badge variant="outline">{rental.car.carId}</Badge>
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">Completed</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                        You don't have any completed rentals.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Login History</CardTitle>
                    <CardDescription>Your recent account activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ) : loginHistory?.length > 0 ? (
                      <div className="space-y-4">
                        {loginHistory.map((record) => (
                          <div
                            key={record.id}
                            className="flex items-center p-3 rounded-lg border border-neutral-200 dark:border-neutral-700"
                          >
                            <div className="mr-4 h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                              <UserIcon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">Successful login</p>
                              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                                <ClockIcon className="mr-1 h-3 w-3" />
                                {formatDateTime(record.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                        No login history available.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
