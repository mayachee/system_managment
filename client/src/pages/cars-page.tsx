import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import CarsList from "@/components/Cars/CarsList";
import CarForm from "@/components/Cars/CarForm";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { InsertCar } from "@shared/schema";

export default function CarsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  
  const isAdmin = user?.role === "admin";
  
  const { 
    data: cars, 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/cars"],
  });
  
  const createCarMutation = useMutation({
    mutationFn: async (carData: InsertCar) => {
      const res = await apiRequest("POST", "/api/cars", carData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      setIsDialogOpen(false);
    },
  });
  
  const updateCarMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCar> }) => {
      const res = await apiRequest("PUT", `/api/cars/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      setIsDialogOpen(false);
      setSelectedCarId(null);
    },
  });
  
  const deleteCarMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cars/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
    },
  });
  
  const handleAddNew = () => {
    setSelectedCarId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (carId: number) => {
    setSelectedCarId(carId);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (carId: number) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      deleteCarMutation.mutate(carId);
    }
  };
  
  const handleFormSubmit = (data: InsertCar) => {
    if (selectedCarId) {
      updateCarMutation.mutate({ id: selectedCarId, data });
    } else {
      createCarMutation.mutate(data);
    }
  };
  
  const filteredCars = cars?.filter(car => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      car.make.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.carId.toLowerCase().includes(query) ||
      car.status.toLowerCase().includes(query) ||
      car.location?.name.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Cars</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your fleet of rental cars
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input 
                placeholder="Search cars..." 
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isAdmin && (
              <Button onClick={handleAddNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add Car
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the cars data. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <CarsList 
            cars={filteredCars || []} 
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>
      
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCarId ? "Edit Car" : "Add New Car"}
            </DialogTitle>
            <DialogDescription>
              {selectedCarId 
                ? "Update the car details below" 
                : "Fill in the car details below to add a new car to your fleet"
              }
            </DialogDescription>
          </DialogHeader>
          
          <CarForm 
            onSubmit={handleFormSubmit}
            carId={selectedCarId}
            isSubmitting={createCarMutation.isPending || updateCarMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
