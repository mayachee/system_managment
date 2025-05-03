import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLocalization } from '@/hooks/use-localization';
import { apiRequest } from '@/lib/queryClient';
import { DataTable } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import ComponentForm from './ComponentForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Status emoji mapping
const healthStatusEmojis: Record<string, string> = {
  excellent: '😀',
  good: '🙂',
  fair: '😐',
  poor: '🙁',
  critical: '😨'
};

export interface VehicleHealthComponent {
  id: number;
  carId: number;
  componentName: string;
  status: string;
  lastChecked: string;
  notes: string;
  alertLevel: number;
  updatedBy: number;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    status: string;
    carId: string;
  };
  updatedByUser?: {
    id: number;
    username: string;
  };
}

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  carId: string;
  status: string;
}

interface ManageComponentsProps {
  carId?: number; // Optional, if we want to filter components for a specific car
}

export function ManageComponents({ carId }: ManageComponentsProps) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<VehicleHealthComponent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [componentToDelete, setComponentToDelete] = useState<number | null>(null);
  
  // Fetch all cars for car selection in form
  const { data: cars = [] } = useQuery<Car[]>({ 
    queryKey: ['/api/cars'],
  });
  
  // Fetch components, filtered by car if carId is provided
  const { 
    data: components = [], 
    isLoading, 
    error 
  } = useQuery<VehicleHealthComponent[]>({ 
    queryKey: carId ? ['/api/vehicle-health/components', carId] : ['/api/vehicle-health/components'],
    queryFn: async () => {
      const url = carId 
        ? `/api/vehicle-health/components/${carId}`
        : '/api/vehicle-health/components';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }
      return response.json();
    }
  });
  
  // Delete component mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vehicle-health/components/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/components'] });
      if (carId) {
        queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/components', carId] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/critical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/needs-attention'] });
      
      toast({
        title: t("Component Deleted"),
        description: t("The component has been deleted successfully."),
        variant: "default",
      });
      setShowDeleteConfirm(false);
      setComponentToDelete(null);
    },
    onError: (error) => {
      console.error("Error deleting component:", error);
      toast({
        title: t("Deletion Failed"),
        description: t("Failed to delete the component. Please try again."),
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
    },
  });
  
  // Handle edit button click
  const handleEditComponent = (component: VehicleHealthComponent) => {
    setSelectedComponent(component);
    setIsFormOpen(true);
  };
  
  // Handle delete button click
  const handleDeleteComponent = (componentId: number) => {
    setComponentToDelete(componentId);
    setShowDeleteConfirm(true);
  };
  
  // Confirm deletion
  const confirmDelete = () => {
    if (componentToDelete) {
      deleteMutation.mutate(componentToDelete);
    }
  };
  
  // Close form modal
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedComponent(null);
  };
  
  // Form success handler
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedComponent(null);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
        <p className="text-red-700">{t("Failed to load vehicle components. Please try again.")}</p>
      </div>
    );
  }
  
  // Table columns configuration
  const columns = [
    {
      header: t("Component"),
      accessorKey: "componentName",
      cell: ({ row }: any) => {
        const status = row.original.status.toLowerCase();
        return (
          <div className="flex items-center">
            <span className="mr-2 text-lg">{healthStatusEmojis[status]}</span>
            <span>{row.original.componentName}</span>
          </div>
        );
      },
    },
    {
      header: t("Vehicle"),
      cell: ({ row }: any) => {
        const car = row.original.car;
        return car ? `${car.make} ${car.model} (${car.year})` : t("Unknown");
      },
    },
    {
      header: t("Status"),
      accessorKey: "status",
      cell: ({ row }: any) => {
        const status = row.original.status.toLowerCase();
        return (
          <Badge
            className={
              status === 'excellent' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              status === 'good' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
              status === 'fair' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
              status === 'poor' ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' :
              'bg-red-100 text-red-800 hover:bg-red-200'
            }
          >
            {t(status.charAt(0).toUpperCase() + status.slice(1))}
          </Badge>
        );
      },
    },
    {
      header: t("Alert Level"),
      accessorKey: "alertLevel",
      cell: ({ row }: any) => {
        const alertLevel = row.original.alertLevel;
        const alertBadgeClass = 
          alertLevel === 0 ? 'bg-gray-100 text-gray-800' :
          alertLevel === 1 ? 'bg-blue-100 text-blue-800' :
          alertLevel === 2 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800';
        
        return (
          <Badge className={alertBadgeClass}>
            {alertLevel === 0 ? t("None") : alertLevel}
          </Badge>
        );
      },
    },
    {
      header: t("Last Checked"),
      accessorKey: "lastChecked",
      cell: ({ row }: any) => {
        const date = new Date(row.original.lastChecked);
        return date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
    {
      header: t("Actions"),
      cell: ({ row }: any) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditComponent(row.original)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteComponent(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{t("Vehicle Health Components")}</h2>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("Add Component")}
        </Button>
      </div>
      
      {components.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">{t("No vehicle health components available.")}</p>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("Add Your First Component")}
          </Button>
        </div>
      ) : (
        <DataTable columns={columns} data={components} />
      )}
      
      {/* Add/Edit Component Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {selectedComponent ? t("Edit Component") : t("Add New Component")}
          </DialogTitle>
          <ComponentForm
            cars={cars}
            existingComponent={selectedComponent || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Delete Component")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Are you sure you want to delete this component? This action cannot be undone.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              {t("Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManageComponents;