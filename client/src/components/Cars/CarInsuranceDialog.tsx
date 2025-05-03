import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CarInsuranceDialogProps {
  carId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CarInsurance {
  id: number;
  carId: number;
  policyNumber: string;
  provider: string;
  coverageType: string;
  startDate: string;
  endDate: string;
  premium: number;
  deductible: number;
  isActive: boolean;
}

export function CarInsuranceDialog({ 
  carId, 
  open, 
  onOpenChange 
}: CarInsuranceDialogProps) {
  // Query car details
  const { data: car } = useQuery({
    queryKey: ["/api/cars", carId],
    enabled: !!carId && open,
  });

  // Query insurance information
  const { 
    data: insurances,
    isLoading,
    error
  } = useQuery<CarInsurance[]>({
    queryKey: ["/api/car-insurances"],
    enabled: open,
  });

  // Filter insurances for this specific car
  const carInsurances = insurances?.filter(insurance => insurance.carId === carId) || [];

  // Current date for checking if insurance is active
  const currentDate = new Date();

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Car Insurance Information
          </DialogTitle>
          <DialogDescription>
            {car ? `Insurance details for ${car.make} ${car.model} (${car.carId})` : 'Loading car details...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error loading the insurance information. Please try again.
            </AlertDescription>
          </Alert>
        ) : carInsurances.length > 0 ? (
          <div className="space-y-6">
            {carInsurances.map((insurance) => {
              // Check if the insurance is currently active based on dates
              const startDate = new Date(insurance.startDate);
              const endDate = new Date(insurance.endDate);
              const isDateActive = currentDate >= startDate && currentDate <= endDate;
              const isActive = insurance.isActive && isDateActive;

              return (
                <div 
                  key={insurance.id} 
                  className="border rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{insurance.provider}</h3>
                      <p className="text-neutral-500 dark:text-neutral-400">
                        Policy #: {insurance.policyNumber}
                      </p>
                    </div>
                    <Badge variant={isActive ? "outline" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium">Coverage Type</p>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {insurance.coverageType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Premium</p>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(insurance.premium)} / year
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Deductible</p>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {formatCurrency(insurance.deductible)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Coverage Period</p>
                      <p className="text-neutral-700 dark:text-neutral-300">
                        {formatDate(insurance.startDate)} - {formatDate(insurance.endDate)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-neutral-400" />
            <h3 className="mt-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">No insurance found</h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              This car doesn't have any insurance policies registered.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}