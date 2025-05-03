import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import MaintenanceForm from "@/components/Maintenance/MaintenanceForm";
import { ColumnDef } from "@tanstack/react-table";
import { PencilIcon, WrenchIcon, AlertCircleIcon } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function MaintenancePage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const { toast } = useToast();

  // Get all cars
  const { data: cars, isLoading: isLoadingCars } = useQuery({
    queryKey: ["/api/cars"],
  });

  // Get all maintenance records
  const { data: maintenance, isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["/api/car-maintenance"],
  });

  // Get upcoming maintenance
  const { data: upcomingMaintenance, isLoading: isLoadingUpcoming } = useQuery({
    queryKey: ["/api/car-maintenance/upcoming/30"],
  });

  // Function to get car details by ID
  const getCarById = (carId: number) => {
    return cars?.find((c) => c.id === carId) || { make: '', model: '', year: '', carId: '' };
  };

  // Define columns for the completed maintenance table
  const completedColumns: ColumnDef<any>[] = [
    {
      accessorKey: "carInfo",
      header: "Car",
      cell: ({ row }) => {
        const car = getCarById(row.original.carId);
        return (
          <div>
            {car?.make} {car?.model} ({car?.year}) - {car?.carId}
          </div>
        );
      },
    },
    {
      accessorKey: "maintenanceType",
      header: "Type",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "serviceDate",
      header: "Service Date",
      cell: ({ row }) => format(new Date(row.original.serviceDate), "MMM d, yyyy"),
    },
    {
      accessorKey: "nextServiceDate",
      header: "Next Service Date",
      cell: ({ row }) => row.original.nextServiceDate 
        ? format(new Date(row.original.nextServiceDate), "MMM d, yyyy")
        : "N/A",
    },
    {
      accessorKey: "cost",
      header: "Cost",
      cell: ({ row }) => row.original.cost ? `$${row.original.cost.toFixed(2)}` : "N/A",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.completed ? "success" : "default"}>
          {row.original.completed ? "Completed" : "In Progress"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedRecord(row.original);
              setIsEditDialogOpen(true);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // Define columns for the active maintenance table with the same structure
  const activeColumns = completedColumns;

  // Define columns for the upcoming maintenance table
  const upcomingColumns: ColumnDef<any>[] = [
    {
      accessorKey: "carInfo",
      header: "Car",
      cell: ({ row }) => {
        const car = getCarById(row.original.carId);
        return (
          <div>
            {car?.make} {car?.model} ({car?.year}) - {car?.carId}
          </div>
        );
      },
    },
    {
      accessorKey: "maintenanceType",
      header: "Type",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "nextServiceDate",
      header: "Next Service Date",
      cell: ({ row }) => format(new Date(row.original.nextServiceDate), "MMM d, yyyy"),
    },
    {
      accessorKey: "daysToDue",
      header: "Days Until Due",
      cell: ({ row }) => {
        const daysUntil = Math.ceil(
          (new Date(row.original.nextServiceDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        return (
          <div className="flex items-center">
            {daysUntil <= 7 && <AlertCircleIcon className="mr-2 h-4 w-4 text-red-500" />}
            {daysUntil} days
          </div>
        );
      },
    },
  ];

  // Filter maintenance data
  const completedMaintenance = maintenance?.filter((record: any) => record.completed) || [];
  const activeMaintenance = maintenance?.filter((record: any) => !record.completed) || [];

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Car Maintenance</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <WrenchIcon className="h-4 w-4" />
                Add Maintenance Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add Maintenance Record</DialogTitle>
                <DialogDescription>
                  Enter the details for the new maintenance record.
                </DialogDescription>
              </DialogHeader>
              <MaintenanceForm 
                cars={cars || []} 
                onSuccess={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <WrenchIcon className="h-4 w-4" />
              Active Maintenance
              <Badge variant="secondary">{activeMaintenance.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              Completed Maintenance
              <Badge variant="success">{completedMaintenance.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              <AlertCircleIcon className="h-4 w-4" />
              Upcoming Maintenance
              <Badge variant="secondary">{upcomingMaintenance?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Maintenance Records</CardTitle>
                <CardDescription>
                  Maintenance services that are currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMaintenance || isLoadingCars ? (
                  <div className="flex justify-center py-8">Loading...</div>
                ) : (
                  <DataTable
                    columns={activeColumns}
                    data={activeMaintenance}
                    searchColumn="description"
                    searchPlaceholder="Search by description..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Maintenance Records</CardTitle>
                <CardDescription>
                  Maintenance services that have been completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMaintenance || isLoadingCars ? (
                  <div className="flex justify-center py-8">Loading...</div>
                ) : (
                  <DataTable
                    columns={completedColumns}
                    data={completedMaintenance}
                    searchColumn="description"
                    searchPlaceholder="Search by description..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Maintenance</CardTitle>
                <CardDescription>
                  Scheduled maintenance due in the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUpcoming || isLoadingCars ? (
                  <div className="flex justify-center py-8">Loading...</div>
                ) : (
                  <DataTable
                    columns={upcomingColumns}
                    data={upcomingMaintenance || []}
                    searchColumn="description"
                    searchPlaceholder="Search by description..."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Record</DialogTitle>
            <DialogDescription>
              Update the details for this maintenance record.
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <MaintenanceForm
              cars={cars || []}
              initialData={selectedRecord}
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}