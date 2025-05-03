import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CarDetailsDialog } from "./CarDetailsDialog";
import { Search, RefreshCw } from "lucide-react";

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  status: string;
  carId: string;
  location?: {
    id: number;
    name: string;
  };
}

interface CarSidebarProps {
  onSelect?: (carId: number) => void;
  selectedCarId?: number | null;
  showHeader?: boolean;
  maxHeight?: string;
  showFilters?: boolean;
}

export function CarSidebar({ 
  onSelect, 
  selectedCarId = null,
  showHeader = true,
  maxHeight = "600px",
  showFilters = true
}: CarSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  
  const { data: cars, isLoading, refetch } = useQuery({
    queryKey: ["/api/cars"],
  });
  
  const handleViewDetails = (carId: number) => {
    setSelectedCar(carId);
    setDetailsDialogOpen(true);
  };
  
  const handleSelect = (carId: number) => {
    if (onSelect) {
      onSelect(carId);
    }
  };
  
  const filteredCars = Array.isArray(cars) 
    ? cars.filter((car: Car) => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          car.make?.toLowerCase().includes(query) ||
          car.model?.toLowerCase().includes(query) ||
          car.carId?.toLowerCase().includes(query) ||
          car.status?.toLowerCase().includes(query) ||
          car.location?.name?.toLowerCase().includes(query) || 
          false
        );
      })
    : [];
  
  // Default image for cars without an image
  const defaultCarImage = "https://images.unsplash.com/photo-1550355291-bbee04a92027?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80&q=80";
  
  const getCarImageUrl = (car: any) => {
    return car.imageUrl || defaultCarImage;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "rented":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400";
    }
  };

  return (
    <>
      <Card className="shadow-sm h-full flex flex-col">
        {showHeader && (
          <CardHeader className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium flex items-center">
                <Icons.car className="mr-2 h-5 w-5" />
                Cars
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        )}
        
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
            <Input 
              placeholder="Search cars..." 
              className="pl-10 pr-4 py-2 w-full rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {showFilters && (
          <div className="px-4 py-2 border-b flex flex-wrap gap-2">
            <div className="space-x-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted"
                onClick={() => refetch()}
              >
                All Cars
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-500 text-green-600 dark:text-green-400"
              >
                Available
              </Badge>
              <Badge 
                variant="outline"
                className="cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-yellow-500 text-yellow-600 dark:text-yellow-400"  
              >
                Maintenance
              </Badge>
            </div>
          </div>
        )}
        
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full" style={{ maxHeight }}>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex p-3 animate-pulse">
                    <div className="h-12 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-md mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : filteredCars.length > 0 ? (
                filteredCars.map((car: Car) => (
                  <div 
                    key={car.id}
                    className={`flex p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors ${
                      selectedCarId === car.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                    }`}
                    onClick={() => handleSelect(car.id)}
                  >
                    <div className="h-12 w-12 flex-shrink-0 mr-3 relative">
                      <img 
                        src={getCarImageUrl(car)} 
                        alt={`${car.make} ${car.model}`} 
                        className="h-12 w-12 rounded-md object-cover" 
                      />
                      <div className="absolute -top-1 -right-1">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0 flex items-center justify-center h-5 font-medium ${getStatusColor(car.status)}`}
                        >
                          {car.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="text-sm font-medium truncate">
                          {car.make} {car.model}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 ml-1 -mr-1 -mt-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(car.id);
                          }}
                        >
                          <Icons.view className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 space-x-2">
                        <span>{car.year}</span>
                        <span>•</span>
                        <span className="truncate">{car.carId}</span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                        {car.location?.name || "Unknown location"}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                  <Icons.search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No cars found</p>
                  <p className="text-xs mt-1">Try adjusting your search</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Car Details Dialog */}
      <CarDetailsDialog
        carId={selectedCar as number}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}