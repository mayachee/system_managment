import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Shield, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AddInsuranceDialogProps {
  type: "car" | "user";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Insurance form schemas
const carInsuranceSchema = z.object({
  carId: z.number({
    required_error: "Please select a car",
  }),
  policyNumber: z.string().min(5, {
    message: "Policy number must be at least 5 characters.",
  }),
  provider: z.string().min(2, {
    message: "Provider name is required.",
  }),
  coverageType: z.string().min(2, {
    message: "Coverage type is required.",
  }),
  premium: z.coerce.number().positive({
    message: "Premium must be a positive number.",
  }),
  deductible: z.coerce.number().positive({
    message: "Deductible must be a positive number.",
  }),
  coverageLimit: z.coerce.number().positive({
    message: "Coverage limit must be a positive number.",
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please provide a valid date in YYYY-MM-DD format.",
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please provide a valid date in YYYY-MM-DD format.",
  }),
  isActive: z.boolean().default(true),
});

const userInsuranceSchema = z.object({
  userId: z.number({
    required_error: "Please select a user",
  }),
  policyNumber: z.string().min(5, {
    message: "Policy number must be at least 5 characters.",
  }),
  provider: z.string().min(2, {
    message: "Provider name is required.",
  }),
  coverageType: z.string().min(2, {
    message: "Coverage type is required.",
  }),
  premium: z.coerce.number().positive({
    message: "Premium must be a positive number.",
  }),
  liabilityCoverage: z.coerce.number().positive({
    message: "Liability coverage must be a positive number.",
  }),
  personalInjuryCoverage: z.coerce.number().positive({
    message: "Personal injury coverage must be a positive number.",
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please provide a valid date in YYYY-MM-DD format.",
  }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Please provide a valid date in YYYY-MM-DD format.",
  }),
});

export default function AddInsuranceDialog({ type, open, onOpenChange }: AddInsuranceDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine which schema to use based on the insurance type
  const schema = type === "car" ? carInsuranceSchema : userInsuranceSchema;
  
  // Set up the form
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: type === "car" 
      ? {
          policyNumber: "",
          provider: "",
          coverageType: "",
          premium: 0,
          deductible: 0,
          coverageLimit: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          isActive: true,
        }
      : {
          policyNumber: "",
          provider: "",
          coverageType: "",
          premium: 0,
          liabilityCoverage: 0,
          personalInjuryCoverage: 0,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        }
  });

  // Fetch cars or users based on the insurance type
  const { data: cars = [] } = useQuery({
    queryKey: ["/api/cars"],
    enabled: type === "car" && open,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: type === "user" && open,
  });

  // Create insurance mutation
  const createInsuranceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof schema>) => {
      const endpoint = type === "car" ? "/api/car-insurances" : "/api/user-insurances";
      const response = await apiRequest("POST", endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: [type === "car" ? "/api/car-insurances" : "/api/user-insurances"] });
      
      // Show success toast
      toast({
        title: "Success",
        description: `${type === "car" ? "Car" : "User"} insurance policy created successfully.`,
      });
      
      // Close the dialog and reset form
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create insurance policy: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  function onSubmit(data: z.infer<typeof schema>) {
    createInsuranceMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {type === "car" ? "Add Car Insurance Policy" : "Add User Insurance Policy"}
          </DialogTitle>
          <DialogDescription>
            Create a new insurance policy for a {type === "car" ? "vehicle" : "user"}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative">
            <div className="bg-muted/40 rounded-lg p-5 border mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                {type === "car" ? (
                  <>
                    <Car className="h-5 w-5 mr-2 text-primary" />
                    Vehicle Selection
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    User Selection
                  </>
                )}
              </h3>
              
              {/* Select Car/User */}
              <FormField
                control={form.control}
                name={type === "car" ? "carId" : "userId"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">{type === "car" ? "Vehicle" : "User"}</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder={`Select a ${type === "car" ? "vehicle" : "user"}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {type === "car" ? (
                          cars.map((car: any) => (
                            <SelectItem key={car.id} value={car.id.toString()}>
                              {car.make} {car.model} ({car.carId})
                            </SelectItem>
                          ))
                        ) : (
                          users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username} - {user.email}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the {type === "car" ? "vehicle" : "user"} to insure
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-muted/40 rounded-lg p-5 border mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Policy Details
              </h3>
              <div className="space-y-4">
                {/* Policy Number */}
                <FormField
                  control={form.control}
                  name="policyNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Policy Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. POL-12345678" className="bg-background" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the unique insurance policy number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Provider */}
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Insurance Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. State Farm, Geico" className="bg-background" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name of the insurance company
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Coverage Type */}
                <FormField
                  control={form.control}
                  name="coverageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Coverage Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select coverage type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {type === "car" ? (
                            <>
                              <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                              <SelectItem value="Collision">Collision</SelectItem>
                              <SelectItem value="Liability">Liability</SelectItem>
                              <SelectItem value="Full Coverage">Full Coverage</SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="Basic">Basic</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="Premium">Premium</SelectItem>
                              <SelectItem value="Full Coverage">Full Coverage</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Type of insurance coverage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-muted/40 rounded-lg p-5 border mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 mr-2">
                  <span className="text-primary text-sm font-semibold">$</span>
                </span>
                Financial Information
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Premium */}
                  <FormField
                    control={form.control}
                    name="premium"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Monthly Premium ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" className="bg-background" {...field} />
                        </FormControl>
                        <FormDescription>
                          Monthly cost of the policy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Car specific: Deductible */}
                  {type === "car" && (
                    <FormField
                      control={form.control}
                      name="deductible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Deductible ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" className="bg-background" {...field} />
                          </FormControl>
                          <FormDescription>
                            Amount paid before insurance kicks in
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Car specific: Coverage Limit */}
                  {type === "car" && (
                    <FormField
                      control={form.control}
                      name="coverageLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Coverage Limit ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" className="bg-background" {...field} />
                          </FormControl>
                          <FormDescription>
                            Maximum amount insurance will pay
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* User specific: Liability Coverage */}
                  {type === "user" && (
                    <FormField
                      control={form.control}
                      name="liabilityCoverage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Liability Coverage ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" className="bg-background" {...field} />
                          </FormControl>
                          <FormDescription>
                            Coverage for damage to others
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* User specific: Personal Injury Coverage */}
                  {type === "user" && (
                    <FormField
                      control={form.control}
                      name="personalInjuryCoverage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Personal Injury Coverage ($)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" className="bg-background" {...field} />
                          </FormControl>
                          <FormDescription>
                            Coverage for personal injuries
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-muted/40 rounded-lg p-5 border mb-6">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Policy Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the policy begins
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">End Date</FormLabel>
                      <FormControl>
                        <Input type="date" className="bg-background" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the policy expires
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 pt-4 pb-2 bg-background border-t flex flex-col sm:flex-row sm:justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createInsuranceMutation.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80"
              >
                {createInsuranceMutation.isPending ? 'Creating...' : 'Create Policy'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}