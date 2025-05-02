import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import LocationsList from "@/components/Locations/LocationsList";
import LocationForm from "@/components/Locations/LocationForm";
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
import { InsertLocation } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function LocationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  const isAdmin = user?.role === "admin";
  
  const { 
    data: locations, 
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/locations"],
  });
  
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: InsertLocation) => {
      const res = await apiRequest("POST", "/api/locations", locationData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Location created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateLocationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertLocation> }) => {
      const res = await apiRequest("PUT", `/api/locations/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setIsDialogOpen(false);
      setSelectedLocationId(null);
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Location deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddNew = () => {
    setSelectedLocationId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (locationId: number) => {
    setSelectedLocationId(locationId);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (locationId: number) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      deleteLocationMutation.mutate(locationId);
    }
  };
  
  const handleFormSubmit = (data: InsertLocation) => {
    if (selectedLocationId) {
      updateLocationMutation.mutate({ id: selectedLocationId, data });
    } else {
      createLocationMutation.mutate(data);
    }
  };
  
  const filteredLocations = locations?.filter(location => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      location.name.toLowerCase().includes(query) ||
      location.address.toLowerCase().includes(query)
    );
  });

  // Non-admin users should not access this page
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. Only administrators can manage locations.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">Locations</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage your rental locations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input 
                placeholder="Search locations..." 
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was an error loading the locations data. Please try refreshing.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <LocationsList 
            locations={filteredLocations || []} 
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
              {selectedLocationId ? "Edit Location" : "Add New Location"}
            </DialogTitle>
            <DialogDescription>
              {selectedLocationId 
                ? "Update the location details below" 
                : "Fill in the location details below to add a new rental location"
              }
            </DialogDescription>
          </DialogHeader>
          
          <LocationForm 
            onSubmit={handleFormSubmit}
            locationId={selectedLocationId}
            isSubmitting={createLocationMutation.isPending || updateLocationMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
