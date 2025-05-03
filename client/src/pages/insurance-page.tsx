import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Shield, Car, User, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import AddInsuranceDialog from "@/components/Insurance/AddInsuranceDialog";

export default function InsurancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("car-insurance");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [insuranceType, setInsuranceType] = useState<"car" | "user">("car");
  
  // Function to open the dialog for adding a new insurance policy
  const handleAddNewPolicy = (type: "car" | "user") => {
    setInsuranceType(type);
    setAddDialogOpen(true);
  };

  // Define insurance types based on the schema
  interface CarInsuranceModel {
    id: number;
    carId: number;
    policyNumber: string;
    provider: string;
    coverageType: string;
    premium: number;
    startDate: string;
    endDate: string;
    deductible: number;
    coverageLimit: number;
    car?: {
      id: number;
      make: string;
      model: string;
      year: number;
      carId: string;
    };
  }

  interface UserInsuranceModel {
    id: number;
    userId: number;
    policyNumber: string;
    provider: string;
    coverageType: string;
    premium: number;
    startDate: string;
    endDate: string;
    liabilityCoverage: number;
    personalInjuryCoverage: number;
    user?: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  }

  const {
    data: carInsurances = [] as CarInsuranceModel[],
    isLoading: isLoadingCarInsurances,
    error: carInsurancesError
  } = useQuery<CarInsuranceModel[]>({
    queryKey: ["/api/car-insurances"],
    enabled: activeTab === "car-insurance"
  });

  const {
    data: userInsurances = [] as UserInsuranceModel[],
    isLoading: isLoadingUserInsurances,
    error: userInsurancesError
  } = useQuery<UserInsuranceModel[]>({
    queryKey: ["/api/user-insurances"],
    enabled: activeTab === "user-insurance"
  });

  useEffect(() => {
    if (carInsurancesError) {
      toast({
        title: "Error loading car insurances",
        description: "There was a problem fetching car insurance data.",
        variant: "destructive",
      });
    }
    
    if (userInsurancesError) {
      toast({
        title: "Error loading user insurances",
        description: "There was a problem fetching user insurance data.",
        variant: "destructive",
      });
    }
  }, [carInsurancesError, userInsurancesError, toast]);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Insurance Overview</h1>
          <p className="text-muted-foreground">
            Manage all your insurance policies for vehicles and users in one place.
          </p>
        </div>
        
        <Tabs defaultValue="car-insurance" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="car-insurance" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span>Car Insurance</span>
            </TabsTrigger>
            <TabsTrigger value="user-insurance" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>User Insurance</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Car Insurance Tab */}
          <TabsContent value="car-insurance">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Vehicle Insurance Policies</h2>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleAddNewPolicy("car")}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New Policy</span>
                </Button>
              </div>
              
              <Separator />
              
              {isLoadingCarInsurances ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : carInsurances.length === 0 ? (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No insurance policies found</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any vehicle insurance policies set up yet.
                    </p>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => handleAddNewPolicy("car")}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Your First Policy</span>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {carInsurances.map((insurance: CarInsuranceModel) => (
                    <Card key={insurance.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{insurance.policyNumber}</span>
                          <Shield className="h-5 w-5 text-primary" />
                        </CardTitle>
                        <CardDescription>
                          {insurance.car ? `${insurance.car.make} ${insurance.car.model}` : "Vehicle"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Coverage Type</span>
                            <span className="font-medium">{insurance.coverageType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Premium</span>
                            <span className="font-medium">${Number(insurance.premium).toFixed(2)}/month</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Deductible</span>
                            <span className="font-medium">${Number(insurance.deductible).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expires</span>
                            <span className="font-medium">
                              {new Date(insurance.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* User Insurance Tab */}
          <TabsContent value="user-insurance">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Personal Insurance Policies</h2>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => handleAddNewPolicy("user")}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add New Policy</span>
                </Button>
              </div>
              
              <Separator />
              
              {isLoadingUserInsurances ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userInsurances.length === 0 ? (
                <Card>
                  <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No personal insurance policies found</h3>
                    <p className="text-muted-foreground mb-4">
                      You don't have any personal insurance policies set up yet.
                    </p>
                    <Button 
                      className="flex items-center gap-2"
                      onClick={() => handleAddNewPolicy("user")}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span>Create Your First Policy</span>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {userInsurances.map((insurance: UserInsuranceModel) => (
                    <Card key={insurance.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{insurance.policyNumber}</span>
                          <Shield className="h-5 w-5 text-primary" />
                        </CardTitle>
                        <CardDescription>
                          {insurance.user ? insurance.user.username : "Personal"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Coverage Type</span>
                            <span className="font-medium">{insurance.coverageType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Premium</span>
                            <span className="font-medium">${Number(insurance.premium).toFixed(2)}/month</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Liability Coverage</span>
                            <span className="font-medium">${Number(insurance.liabilityCoverage).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expires</span>
                            <span className="font-medium">
                              {new Date(insurance.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full mt-4">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Add Insurance Dialog */}
        <AddInsuranceDialog 
          type={insuranceType} 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen} 
        />
      </div>
    </AppLayout>
  );
}