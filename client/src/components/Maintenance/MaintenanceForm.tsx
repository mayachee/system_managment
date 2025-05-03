import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { insertCarMaintenanceSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Extend the schema with more validation rules if needed
const maintenanceFormSchema = insertCarMaintenanceSchema.extend({
  // Add client-side validation
  serviceDate: z.date({
    required_error: "Service date is required",
  }),
  nextServiceDate: z.date().optional(),
  cost: z.coerce.number().min(0, "Cost cannot be negative").default(0),
});

// Define maintenance types
const MAINTENANCE_TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Service",
  "Battery Replacement",
  "Air Filter Replacement",
  "Fluid Check/Top-off",
  "Engine Tune-up",
  "Transmission Service",
  "Wheel Alignment",
  "Spark Plug Replacement",
  "Engine Rebuild",
  "Transmission Repair",
  "Major Repairs",
  "Other"
];

type CarMaintenance = z.infer<typeof maintenanceFormSchema>;

interface MaintenanceFormProps {
  cars: any[];
  initialData?: CarMaintenance;
  onSuccess?: () => void;
}

export default function MaintenanceForm({ cars, initialData, onSuccess }: MaintenanceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Default form values
  const defaultValues: Partial<CarMaintenance> = {
    carId: initialData?.carId || (cars && cars.length > 0 ? cars[0].id : 1),
    maintenanceType: initialData?.maintenanceType || MAINTENANCE_TYPES[0],
    description: initialData?.description || "",
    serviceDate: initialData?.serviceDate || new Date(),
    nextServiceDate: initialData?.nextServiceDate,
    cost: initialData?.cost || 0,
    notes: initialData?.notes || "",
    completed: initialData?.completed || false,
    serviceProvider: initialData?.serviceProvider || "",
    mileage: initialData?.mileage || 0,
  };
  
  const form = useForm<CarMaintenance>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues,
  });

  async function onSubmit(data: z.infer<typeof maintenanceFormSchema>) {
    setIsSubmitting(true);
    
    try {
      // Convert Date objects to ISO strings for API
      const formattedData = {
        ...data,
        serviceDate: data.serviceDate.toISOString(),
        nextServiceDate: data.nextServiceDate ? data.nextServiceDate.toISOString() : undefined,
      };
      
      // If we have initial data, it's an update
      if (initialData?.id) {
        await apiRequest("PATCH", `/api/car-maintenance/${initialData.id}`, formattedData);
        toast({
          title: "Maintenance record updated",
          description: "The maintenance record has been updated successfully.",
        });
      } else {
        // Otherwise it's a new record
        await apiRequest("POST", "/api/car-maintenance", formattedData);
        toast({
          title: "Maintenance record created",
          description: "The maintenance record has been created successfully.",
        });
      }
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/car-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cars"] });
      
      // Reset form if it's a new record
      if (!initialData) {
        form.reset(defaultValues);
      }
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting maintenance form:", error);
      toast({
        title: "Error",
        description: "There was an error saving the maintenance record. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Car Selection */}
        <FormField
          control={form.control}
          name="carId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Car</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value ? field.value.toString() : (cars && cars.length > 0 ? cars[0].id.toString() : "1")}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a car" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id.toString()}>
                      {car.make} {car.model} ({car.year}) - {car.carId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Maintenance Type */}
        <FormField
          control={form.control}
          name="maintenanceType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || MAINTENANCE_TYPES[0]}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select maintenance type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MAINTENANCE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of maintenance" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service Date */}
        <FormField
          control={form.control}
          name="serviceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Service Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Next Service Date (Optional) */}
        <FormField
          control={form.control}
          name="nextServiceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Next Service Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cost */}
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter cost"
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Service Provider */}
        <FormField
          control={form.control}
          name="serviceProvider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Provider (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Name of mechanic or service provider" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Mileage */}
        <FormField
          control={form.control}
          name="mileage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mileage (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Current vehicle mileage" 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseInt(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Additional notes about the maintenance"
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Completed Status */}
        <FormField
          control={form.control}
          name="completed"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Completed</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Mark this maintenance record as completed
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : initialData ? "Update Record" : "Create Record"}
        </Button>
      </form>
    </Form>
  );
}