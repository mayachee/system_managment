import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Car, Calendar, MapPin, Gauge, Info, Shield, Wrench, FileText, Camera } from "lucide-react";
import { CarPhotosGallery } from "./CarPhotosGallery";
import { CarPhotoUploader } from "./CarPhotoUploader";
import { queryClient } from "@/lib/queryClient";

// Define the car type based on our database schema
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  status: string;
  carId: string;
  img?: string; // URL for the primary car image
  location?: {
    id: number;
    name: string;
    address: string;
  };
}

interface CarFeatures {
  id: number;
  carId: number;
  fuelType: string;
  transmission: string;
  seating: number;
  doors: number;
  mpg: number;
  trunkSpace: number;
  hasGPS: boolean;
  hasBluetoothAudio: boolean;
  hasSunroof: boolean;
  hasLeatherSeats: boolean;
  hasBackupCamera: boolean;
  features: Record<string, any>;
  additionalImages: string[];
}

interface CarInsurance {
  id: number;
  carId: number;
  policyNumber: string;
  provider: string;
  coverageType: string;
  premium: string;
  startDate: string;
  endDate: string;
  deductible: string;
  coverageLimit: string;
}

interface CarMaintenance {
  id: number;
  carId: number;
  maintenanceType: string;
  description: string;
  cost: string;
  serviceDate: string;
  nextServiceDate: string;
  serviceProvider: string;
  mileage: number;
  completed: boolean;
  notes: string;
  documents: string[];
}

interface VehicleHealth {
  id: number;
  carId: number;
  overallHealth: string;
  lastUpdated: string;
  alerts: number;
  mileage: number;
  nextMaintenanceDue: string;
  healthScore: number;
  recommendations: Record<string, any>[];
  historyData: Record<string, any>;
}

interface CarDetailsDialogProps {
  carId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CarDetailsDialog({ carId, open, onOpenChange }: CarDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch car details
  const { 
    data: car, 
    isLoading: isLoadingCar,
    error: carError 
  } = useQuery<Car>({
    queryKey: ["/api/cars", carId],
    enabled: open && !!carId,
  });

  // Fetch car features
  const { 
    data: carFeatures, 
    isLoading: isLoadingFeatures 
  } = useQuery<CarFeatures>({
    queryKey: ["/api/cars", carId, "features"],
    enabled: open && !!carId && (activeTab === "features" || activeTab === "photos"),
  });

  // Fetch car insurance
  const { 
    data: carInsurance, 
    isLoading: isLoadingInsurance 
  } = useQuery<CarInsurance>({
    queryKey: ["/api/cars", carId, "insurance"],
    enabled: open && !!carId && activeTab === "insurance",
  });

  // Fetch car maintenance records
  const { 
    data: maintenanceRecords = [], 
    isLoading: isLoadingMaintenance 
  } = useQuery<CarMaintenance[]>({
    queryKey: ["/api/cars", carId, "maintenance"],
    enabled: open && !!carId && activeTab === "maintenance",
  });

  // Fetch vehicle health info
  const { 
    data: vehicleHealth, 
    isLoading: isLoadingHealth 
  } = useQuery<VehicleHealth>({
    queryKey: ["/api/cars", carId, "health"],
    enabled: open && !!carId && activeTab === "health",
  });

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Get status badge color based on status
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20";
      case "rented":
        return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20";
      case "maintenance":
        return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20";
    }
  };

  // Get health status color
  const getHealthColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "excellent":
        return "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20";
      case "good":
        return "bg-lime-500/10 text-lime-600 hover:bg-lime-500/20 border-lime-500/20";
      case "fair":
        return "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20";
      case "poor":
        return "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-500/20";
      case "critical":
        return "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20 border-slate-500/20";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden p-0">
        {isLoadingCar ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !car ? (
          <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
            <Info className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Car Not Found</h3>
            <p className="text-muted-foreground">
              The requested vehicle information could not be found.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <Car className="h-6 w-6 text-primary" />
                    {car.make} {car.model} ({car.year})
                  </DialogTitle>
                  <DialogDescription className="flex gap-3 mt-2">
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">ID:</span>
                      <span className="font-medium text-sm">{car.carId}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground text-sm">Status:</span>
                      <Badge className={getStatusColor(car.status)}>{car.status}</Badge>
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6">
                <TabsList className="w-full justify-start space-x-2 border-b rounded-none h-12 p-0 bg-transparent">
                  <TabsTrigger 
                    value="overview" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="features" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Features
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insurance" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Insurance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="maintenance" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Maintenance
                  </TabsTrigger>
                  <TabsTrigger 
                    value="health" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Health
                  </TabsTrigger>
                  <TabsTrigger 
                    value="photos" 
                    className="rounded-b-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                  >
                    Photos
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="p-6 max-h-[calc(90vh-180px)]">
                <TabsContent value="overview" className="mt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Car className="h-5 w-5 mr-2 text-primary" />
                          Vehicle Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Make</p>
                            <p className="font-medium">{car.make}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Model</p>
                            <p className="font-medium">{car.model}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Year</p>
                            <p className="font-medium">{car.year}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge className={getStatusColor(car.status)}>{car.status}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <MapPin className="h-5 w-5 mr-2 text-primary" />
                          Location Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {car.location ? (
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Branch</p>
                              <p className="font-medium">{car.location.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Address</p>
                              <p className="font-medium">{car.location.address}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Location information not available</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="features" className="mt-2">
                  {isLoadingFeatures ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !carFeatures ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 p-6 text-center">
                        <Info className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Features Not Available</h3>
                        <p className="text-muted-foreground">
                          Detailed feature information for this vehicle is not available.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Car className="h-5 w-5 mr-2 text-primary" />
                            Vehicle Specifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Fuel Type</p>
                              <p className="font-medium">{carFeatures.fuelType}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Transmission</p>
                              <p className="font-medium">{carFeatures.transmission}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Seating</p>
                              <p className="font-medium">{carFeatures.seating} passengers</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Doors</p>
                              <p className="font-medium">{carFeatures.doors}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">MPG</p>
                              <p className="font-medium">{carFeatures.mpg || "Not specified"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Trunk Space</p>
                              <p className="font-medium">{carFeatures.trunkSpace ? `${carFeatures.trunkSpace} cubic ft` : "Not specified"}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Info className="h-5 w-5 mr-2 text-primary" />
                            Features & Amenities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${carFeatures.hasGPS ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>GPS Navigation</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${carFeatures.hasBluetoothAudio ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Bluetooth Audio</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${carFeatures.hasSunroof ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Sunroof</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${carFeatures.hasLeatherSeats ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Leather Seats</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${carFeatures.hasBackupCamera ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span>Backup Camera</span>
                              </div>
                            </div>
                            
                            {carFeatures.features && Object.keys(carFeatures.features).length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-2">Additional Features</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(carFeatures.features).map(([key, value]) => (
                                    <Badge key={key} variant="outline">{key}: {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="insurance" className="mt-2">
                  {isLoadingInsurance ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !carInsurance ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 p-6 text-center">
                        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Insurance Coverage</h3>
                        <p className="text-muted-foreground mb-4">
                          This vehicle does not have an active insurance policy.
                        </p>
                        <Button variant="outline">Add Insurance Policy</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-lg">
                          <Shield className="h-5 w-5 mr-2 text-primary" />
                          Insurance Policy Details
                        </CardTitle>
                        <CardDescription>
                          Policy {carInsurance.policyNumber} from {carInsurance.provider}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Coverage Type</p>
                            <p className="font-medium">{carInsurance.coverageType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Monthly Premium</p>
                            <p className="font-medium">${carInsurance.premium}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Coverage Period</p>
                            <p className="font-medium">{formatDate(carInsurance.startDate)} - {formatDate(carInsurance.endDate)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Deductible</p>
                            <p className="font-medium">${carInsurance.deductible}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Coverage Limit</p>
                            <p className="font-medium">${carInsurance.coverageLimit}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="maintenance" className="mt-2">
                  {isLoadingMaintenance ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : maintenanceRecords.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 p-6 text-center">
                        <Wrench className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Maintenance Records</h3>
                        <p className="text-muted-foreground mb-4">
                          No maintenance records are available for this vehicle.
                        </p>
                        <Button variant="outline">Schedule Maintenance</Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium flex items-center">
                          <Wrench className="h-5 w-5 mr-2 text-primary" />
                          Maintenance History
                        </h3>
                        <Button variant="outline" size="sm">
                          Schedule Maintenance
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {maintenanceRecords.map((record) => (
                          <Card key={record.id}>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{record.maintenanceType}</CardTitle>
                                  <CardDescription>{formatDate(record.serviceDate)}</CardDescription>
                                </div>
                                <Badge 
                                  variant={record.completed ? "default" : "outline"}
                                >
                                  {record.completed ? "Completed" : "Scheduled"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pb-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Service Provider:</span>
                                  <span className="ml-1">{record.serviceProvider || "N/A"}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Cost:</span>
                                  <span className="ml-1">${record.cost}</span>
                                </div>
                                {record.mileage && (
                                  <div>
                                    <span className="text-muted-foreground">Mileage:</span>
                                    <span className="ml-1">{record.mileage} miles</span>
                                  </div>
                                )}
                                {record.nextServiceDate && (
                                  <div>
                                    <span className="text-muted-foreground">Next Service:</span>
                                    <span className="ml-1">{formatDate(record.nextServiceDate)}</span>
                                  </div>
                                )}
                              </div>
                              {record.description && (
                                <div className="mt-2">
                                  <span className="text-muted-foreground text-sm">Description:</span>
                                  <p className="text-sm mt-1">{record.description}</p>
                                </div>
                              )}
                            </CardContent>
                            {record.documents && record.documents.length > 0 && (
                              <CardFooter className="border-t pt-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {record.documents.length} document{record.documents.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="health" className="mt-2">
                  {isLoadingHealth ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !vehicleHealth ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center h-64 p-6 text-center">
                        <Gauge className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Health Data Not Available</h3>
                        <p className="text-muted-foreground mb-4">
                          Vehicle health monitoring data is not available for this vehicle.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Gauge className="h-5 w-5 mr-2 text-primary" />
                            Vehicle Health Overview
                          </CardTitle>
                          <CardDescription>
                            Last updated: {formatDate(vehicleHealth.lastUpdated)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <div>
                              <p className="text-sm text-muted-foreground">Overall Health</p>
                              <Badge className={getHealthColor(vehicleHealth.overallHealth)}>
                                {vehicleHealth.overallHealth}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Health Score</p>
                              <p className="font-medium">{vehicleHealth.healthScore}/100</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Current Mileage</p>
                              <p className="font-medium">{vehicleHealth.mileage || "N/A"} miles</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Active Alerts</p>
                              <p className="font-medium">
                                <Badge variant={vehicleHealth.alerts > 0 ? "destructive" : "outline"}>
                                  {vehicleHealth.alerts}
                                </Badge>
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm text-muted-foreground">Next Maintenance Due</p>
                              <p className="font-medium">
                                {vehicleHealth.nextMaintenanceDue 
                                  ? formatDate(vehicleHealth.nextMaintenanceDue) 
                                  : "Not scheduled"}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {vehicleHealth.recommendations && vehicleHealth.recommendations.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center text-lg">
                              <Wrench className="h-5 w-5 mr-2 text-primary" />
                              Recommendations
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {vehicleHealth.recommendations.map((rec, index) => (
                              <div key={index} className="p-3 border rounded-md">
                                <div className="flex items-start gap-2">
                                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                    rec.priority === "high" ? "bg-red-500" : 
                                    rec.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                                  }`} />
                                  <div>
                                    <p className="font-medium text-sm">{rec.title}</p>
                                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="photos" className="mt-2">
                  {isLoadingFeatures ? (
                    <div className="flex justify-center items-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {/* Photo Gallery */}
                      <CarPhotosGallery 
                        carId={car?.id || 0}
                        mainImage={car?.img} 
                        additionalImages={carFeatures?.additionalImages} 
                        onAddPhotos={() => setActiveTab("photos")}
                      />
                      
                      {/* Photo Upload Form */}
                      <CarPhotoUploader 
                        carId={car?.id} 
                        onComplete={() => {
                          // Invalidate car and features queries when upload completes
                          queryClient.invalidateQueries({ 
                            queryKey: ["/api/cars", carId]
                          });
                          queryClient.invalidateQueries({ 
                            queryKey: ["/api/cars", carId, "features"]  
                          });
                        }}
                      />
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
                      
            <DialogFooter className="px-6 py-4 bg-muted/40 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}