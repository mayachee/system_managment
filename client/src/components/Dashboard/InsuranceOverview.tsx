import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CarInsuranceCard from "@/components/Insurance/CarInsuranceCard";
import UserInsuranceCard from "@/components/Insurance/UserInsuranceCard";
import { CarInsurance, UserInsurance } from "@shared/schema";

interface InsuranceOverviewProps {
  isAdmin: boolean;
  loading?: boolean;
}

interface CarInsuranceWithCar extends CarInsurance {
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    carId: string;
  };
}

interface UserInsuranceWithUser extends UserInsurance {
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export default function InsuranceOverview({ isAdmin, loading = false }: InsuranceOverviewProps) {
  const { data: carInsurances = [], isLoading: isLoadingCarInsurances } = useQuery<CarInsuranceWithCar[]>({
    queryKey: ["/api/car-insurances"],
    enabled: isAdmin, // Only fetch if admin
  });

  const { data: userInsurances = [], isLoading: isLoadingUserInsurances } = useQuery<UserInsuranceWithUser[]>({
    queryKey: ["/api/user-insurances"],
    enabled: isAdmin, // Only fetch if admin
  });

  const isLoading = loading || isLoadingCarInsurances || isLoadingUserInsurances;

  // Calculate insurance stats
  const totalCarPolicies = carInsurances.length;
  const totalUserPolicies = userInsurances.length;

  const activeCarPolicies = carInsurances.filter(
    (policy: any) => new Date(policy.endDate) > new Date()
  ).length;

  const activeUserPolicies = userInsurances.filter(
    (policy: any) => new Date(policy.endDate) > new Date()
  ).length;

  // Calculate premium values
  const totalCarPremiums = carInsurances.reduce(
    (sum: number, policy: any) => sum + (policy.premium || 0),
    0
  );

  const totalUserPremiums = userInsurances.reduce(
    (sum: number, policy: any) => sum + (policy.premium || 0),
    0
  );

  // If not admin, show a simplified view
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Insurance Overview</CardTitle>
          <CardDescription>Insurance data is only visible to admins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Shield className="h-16 w-16 opacity-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Insurance Overview</CardTitle>
          <CardDescription>Loading insurance data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Insurance Overview
        </CardTitle>
        <CardDescription>
          {totalCarPolicies + totalUserPolicies} total insurance policies
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Car Insurance</p>
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2">
                <CardTitle className="text-sm font-medium">Policies</CardTitle>
                <p className="text-2xl font-bold">{totalCarPolicies}</p>
                <CardDescription className="text-xs">
                  {activeCarPolicies} active
                </CardDescription>
              </Card>
              <Card className="p-2">
                <CardTitle className="text-sm font-medium">Premiums</CardTitle>
                <p className="text-2xl font-bold">{formatCurrency(totalCarPremiums)}</p>
                <CardDescription className="text-xs">
                  Avg: {formatCurrency(totalCarPolicies ? totalCarPremiums / totalCarPolicies : 0)}
                </CardDescription>
              </Card>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">User Insurance</p>
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-2">
                <CardTitle className="text-sm font-medium">Policies</CardTitle>
                <p className="text-2xl font-bold">{totalUserPolicies}</p>
                <CardDescription className="text-xs">
                  {activeUserPolicies} active
                </CardDescription>
              </Card>
              <Card className="p-2">
                <CardTitle className="text-sm font-medium">Premiums</CardTitle>
                <p className="text-2xl font-bold">{formatCurrency(totalUserPremiums)}</p>
                <CardDescription className="text-xs">
                  Avg: {formatCurrency(totalUserPolicies ? totalUserPremiums / totalUserPolicies : 0)}
                </CardDescription>
              </Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="car" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="car">Car Insurance</TabsTrigger>
            <TabsTrigger value="user">User Insurance</TabsTrigger>
          </TabsList>
          <TabsContent value="car" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carInsurances.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No car insurance policies found
                </p>
              ) : (
                carInsurances.slice(0, 4).map((insurance: any) => (
                  <CarInsuranceCard key={insurance.id} insurance={insurance} isAdmin={false} />
                ))
              )}
            </div>
          </TabsContent>
          <TabsContent value="user" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userInsurances.length === 0 ? (
                <p className="col-span-full text-center text-muted-foreground py-8">
                  No user insurance policies found
                </p>
              ) : (
                userInsurances.slice(0, 4).map((insurance: any) => (
                  <UserInsuranceCard key={insurance.id} insurance={insurance} isAdmin={false} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}