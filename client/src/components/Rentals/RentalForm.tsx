import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

const rentalSchema = z.object({
  carId: z.coerce.number().int().min(1, "Car is required"),
  userId: z.coerce.number().int().min(1, "User is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
  status: z.enum(["active", "completed", "cancelled"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
}).refine((data) => {
  return data.endDate > data.startDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

type RentalFormValues = z.infer<typeof rentalSchema>;

interface RentalFormProps {
  onSubmit: (data: RentalFormValues) => void;
  rentalId: number | null;
  isSubmitting: boolean;
  isAdmin: boolean;
}

export default function RentalForm({ onSubmit, rentalId, isSubmitting, isAdmin }: RentalFormProps) {
  const { user } = useAuth();
  
  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema),
    defaultValues: {
      carId: undefined,
      userId: user?.id || undefined,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 3)),
      status: "active",
    },
  });
  
  const selectedCarId = form.watch("carId");
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  
  // Fetch cars for dropdown
  const { 
    data: cars, 
    isLoading: isLoadingCars,
    error: carsError
  } = useQuery({
    queryKey: ["/api/cars"],
  });
  
  // Fetch users for dropdown (admin only)
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    error: usersError
  } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });
  
  // Fetch rental data if editing
  const { 
    data: rental, 
    isLoading: isLoadingRental,
    error: rentalError
  } = useQuery({
    queryKey: [`/api/rentals/${rentalId}`],
    enabled: !!rentalId,
  });
  
  // Check car availability when dates change
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    refetch: checkAvailability,
    error: availabilityError
  } = useQuery({
    queryKey: [`/api/cars/${selectedCarId}/availability`, { startDate, endDate }],
    enabled: !!selectedCarId && !!startDate && !!endDate && startDate < endDate,
  });
  
  // Set form values when rental data is loaded
  useEffect(() => {
    if (rental) {
      form.reset({
        carId: rental.carId,
        userId: rental.userId,
        startDate: new Date(rental.startDate),
        endDate: new Date(rental.endDate),
        status: rental.status as "active" | "completed" | "cancelled",
      });
    }
  }, [rental, form]);
  
  const isLoading = isLoadingCars || (isAdmin && isLoadingUsers) || (rentalId && isLoadingRental);
  const error = carsError || usersError || rentalError || availabilityError;
  
  const handleSubmit = (data: RentalFormValues) => {
    onSubmit(data);
  };
  
  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load data"}
          </AlertDescription>
        </Alert>
      )}
      
      {selectedCarId && startDate && endDate && startDate < endDate && !isCheckingAvailability && (
        availabilityData?.available === false ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This car is not available for the selected dates. Please choose different dates or another car.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4 border-green-200 text-green-800 dark:text-green-400 dark:border-green-900">
            <Icons.check className="h-4 w-4" />
            <AlertDescription>
              Car is available for the selected dates!
            </AlertDescription>
          </Alert>
        )
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                    disabled={isLoading || isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a car" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cars?.filter(car => car.status === "available" || (rental && car.id === rental.carId))
                        .map((car) => (
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
            
            {isAdmin ? (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? field.value.toString() : ""}
                      disabled={isLoading || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <input type="hidden" {...field} value={user?.id} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
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
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
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
                        disabled={(date) => 
                          date < new Date(new Date(form.getValues("startDate")).setHours(0, 0, 0, 0)) ||
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {(rentalId || isAdmin) && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading || (selectedCarId && availabilityData?.available === false)}
            >
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {rentalId ? "Updating..." : "Creating..."}
                </>
              ) : (
                rentalId ? "Update Rental" : "Create Rental"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
