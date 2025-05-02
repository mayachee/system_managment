import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import RentalsList from "@/components/Rentals/RentalsList";
import RentalForm from "@/components/Rentals/RentalForm";
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
import { InsertRental } from "@shared/schema";

export default function RentalsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRentalId, setSelectedRentalId] = useState<number | null>(null);
  
  const isAdmin = user?.role === "admin";
  
  const { 
    data: rentals, 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/rentals"],
  });
  
  const createRentalMutation = useMutation({
    mutationFn: async (rentalData: InsertRental) => {
      const res = await apiRequest("POST", "/api/rentals", rentalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
    },
  });
  
  const updateRentalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertRental> }) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      setSelectedRentalId(null);
    },
  });
  
  const deleteRentalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rentals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
  
  const handleAddNew = () => {
    setSelectedRentalId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (rentalId: number) => {
    setSelectedRentalId(rentalId);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (rentalId: number) => {
    if (window.confirm("Are you sure you want to delete this rental?")) {
      deleteRentalMutation.mutate(rentalId);
    }
  };
  
  const completeRentalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/rentals/${id}`, { status: "completed" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });
  
  const handleCompleteRental = (rentalId: number) => {
    if (window.confirm("Mark this rental as completed?")) {
      completeRentalMutation.mutate(rentalId);
    }
  };
  
  const handleFormSubmit = (data: InsertRental) => {
    if (selectedRentalId) {
      updateRentalMutation.mutate({ id: selectedRentalId, data });
    } else {
      createRentalMutation.mutate(data);
    }
  };
  
  const filteredRentals = rentals?.filter(rental => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      rental.car?.make.toLowerCase().includes(query) ||
      rental.car?.model.toLowerCase().includes(query) ||
      rental.car?.carId.toLowerCase().includes(query) ||
      rental.user?.username.toLowerCase().includes(query) ||
      rental.status.toLowerCase().includes(query)
    );
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Rentals</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage car rentals and bookings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input 
                placeholder="Search rentals..." 
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Rental
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the rentals data. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <RentalsList 
            rentals={filteredRentals || []} 
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onComplete={handleCompleteRental}
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
              {selectedRentalId ? "Edit Rental" : "New Rental Booking"}
            </DialogTitle>
            <DialogDescription>
              {selectedRentalId 
                ? "Update the rental details below" 
                : "Fill in the details below to book a new car rental"
              }
            </DialogDescription>
          </DialogHeader>
          
          <RentalForm 
            onSubmit={handleFormSubmit}
            rentalId={selectedRentalId}
            isSubmitting={createRentalMutation.isPending || updateRentalMutation.isPending}
            isAdmin={isAdmin}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
