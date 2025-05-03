import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { CarInsuranceDialog } from "./CarInsuranceDialog";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  locationId: number;
  status: string;
  carId: string;
  location?: {
    id: number;
    name: string;
    address: string;
  };
}

interface CarsListProps {
  cars: Car[];
  isAdmin: boolean;
  onEdit: (carId: number) => void;
  onDelete: (carId: number) => void;
}

export default function CarsList({ cars, isAdmin, onEdit, onDelete }: CarsListProps) {
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [insuranceDialogOpen, setInsuranceDialogOpen] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  
  const handleViewInsurance = (carId: number) => {
    setSelectedCarId(carId);
    setInsuranceDialogOpen(true);
  };
  
  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(new Set(cars.map(car => car.location?.name || "Unknown")));
  
  // Get unique makes for filter dropdown
  const uniqueMakes = Array.from(new Set(cars.map(car => car.make)));
  
  const filteredCars = cars.filter(car => {
    const matchesLocation = locationFilter === "all" || car.location?.name === locationFilter;
    const matchesStatus = statusFilter === "all" || car.status === statusFilter;
    const matchesMake = makeFilter === "all" || car.make === makeFilter;
    
    return matchesLocation && matchesStatus && matchesMake;
  });
  
  // Default image for cars without an image
  const defaultCarImage = "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80";
  
  const getCarImageUrl = (car: any) => {
    return car.imageUrl || defaultCarImage;
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "outline" as const;
      case "rented":
        return "destructive" as const;
      case "maintenance":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <>
      <Card className="shadow-sm">
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-4">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="location-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Location
              </label>
              <Select
                value={locationFilter}
                onValueChange={setLocationFilter}
              >
                <SelectTrigger id="location-filter" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto">
              <label htmlFor="make-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Make
              </label>
              <Select
                value={makeFilter}
                onValueChange={setMakeFilter}
              >
                <SelectTrigger id="make-filter" className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Makes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Makes</SelectItem>
                  {uniqueMakes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Car</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.length > 0 ? (
                  filteredCars.map((car, index) => (
                    <TableRow key={car.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img 
                              src={getCarImageUrl(index)} 
                              alt={`${car.make} ${car.model}`} 
                              className="h-10 w-10 rounded-md object-cover" 
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {car.make} {car.model}
                            </div>
                            <div className="text-sm text-neutral-500 dark:text-neutral-400">
                              {car.carId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {car.year} Model
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {car.make === "Toyota" || car.make === "Honda" ? "Sedan" : 
                           car.make === "Tesla" ? "Electric" : "SUV"}, 
                          {car.make === "Chevrolet" && car.model === "Corvette" ? " Manual" : " Automatic"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {car.location?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                          {car.location?.address || "Unknown address"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusBadgeVariant(car.status)}>
                            {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                          </Badge>
                          {car.status === "available" && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs px-2 py-0 h-7 bg-primary hover:bg-primary/90 text-white hover:text-white border-primary"
                              onClick={() => window.location.href = `/rentals/new?carId=${car.id}`}
                            >
                              <Icons.calendar className="mr-1 h-3 w-3" />
                              Book
                            </Button>
                          )}
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-xs px-2 py-0 h-7 border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                            onClick={() => handleViewInsurance(car.id)}
                          >
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Insurance
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Icons.more className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="flex items-center" 
                              onClick={(e) => {
                                e.preventDefault();
                                window.open(`/cars/${car.id}`, '_blank');
                              }}
                            >
                              <Icons.view className="mr-2 h-4 w-4" />
                              <span>View details</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              className="flex items-center" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewInsurance(car.id);
                              }}
                            >
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              <span>View insurance</span>
                            </DropdownMenuItem>
                            
                            {car.status === "available" && (
                              <DropdownMenuItem 
                                className="flex items-center text-primary focus:text-primary" 
                                onClick={(e) => {
                                  e.preventDefault();
                                  window.location.href = `/rentals/new?carId=${car.id}`;
                                }}
                              >
                                <Icons.calendar className="mr-2 h-4 w-4" />
                                <span>Book this car</span>
                              </DropdownMenuItem>
                            )}
                            
                            {isAdmin && (
                              <>
                                <DropdownMenuItem 
                                  className="flex items-center" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onEdit(car.id);
                                  }}
                                >
                                  <Icons.edit className="mr-2 h-4 w-4" />
                                  <span>Edit car</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center text-destructive focus:text-destructive" 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    onDelete(car.id);
                                  }}
                                >
                                  <Icons.delete className="mr-2 h-4 w-4" />
                                  <span>Delete car</span>
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                      No cars found. {isAdmin && "Add a new car to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {filteredCars.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredCars.length}</span> of{" "}
                    <span className="font-medium">{cars.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button variant="outline" size="icon" className="rounded-l-md">
                      <Icons.chevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline">1</Button>
                    <Button variant="outline" className="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                      2
                    </Button>
                    <Button variant="outline">3</Button>
                    <Button variant="outline" size="icon" className="rounded-r-md">
                      <Icons.chevronRight className="h-4 w-4" />
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Car Insurance Dialog */}
      <CarInsuranceDialog
        carId={selectedCarId}
        open={insuranceDialogOpen}
        onOpenChange={setInsuranceDialogOpen}
      />
    </>
  );
}