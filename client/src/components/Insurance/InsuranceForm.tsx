import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

export type InsuranceFormProps = {
  type: "car" | "user";
  insurance?: any;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
  carId?: number;
  userId?: number;
  availableCars?: { id: number; make: string; model: string; year: number; carId: string }[];
  availableUsers?: { id: number; username: string; email: string; role: string }[];
};

export default function InsuranceForm({
  type,
  insurance,
  onSubmit,
  isSubmitting = false,
  carId,
  userId,
  availableCars,
  availableUsers,
}: InsuranceFormProps) {
  // Common schema fields
  const baseSchema = z.object({
    policyNumber: z
      .string()
      .min(5, { message: "Policy number must be at least 5 characters" })
      .max(50),
    provider: z.string().min(2, { message: "Provider name is required" }).max(100),
    coverageType: z.string().min(2, { message: "Coverage type is required" }).max(50),
    premium: z.coerce
      .number()
      .positive({ message: "Premium must be a positive amount" })
      .max(1000000, { message: "Premium amount is too high" }),
    startDate: z.date({ required_error: "Start date is required" }),
    endDate: z.date({ required_error: "End date is required" }),
  });

  // Type-specific schema fields
  const carSpecificSchema = z.object({
    carId: z.coerce.number({ required_error: "Car is required" }),
    deductible: z.coerce
      .number()
      .positive({ message: "Deductible must be a positive amount" })
      .max(1000000, { message: "Deductible amount is too high" }),
    coverageLimit: z.coerce
      .number()
      .positive({ message: "Coverage limit must be a positive amount" })
      .max(10000000, { message: "Coverage limit amount is too high" }),
  });

  const userSpecificSchema = z.object({
    userId: z.coerce.number({ required_error: "User is required" }),
    liabilityCoverage: z.coerce
      .number()
      .positive({ message: "Liability coverage must be a positive amount" })
      .max(10000000, { message: "Liability coverage amount is too high" }),
    personalInjuryCoverage: z.coerce
      .number()
      .positive({ message: "Personal injury coverage must be a positive amount" })
      .max(10000000, { message: "Personal injury coverage amount is too high" }),
  });

  // Combine schemas based on type
  const formSchema = type === "car"
    ? baseSchema.merge(carSpecificSchema)
    : baseSchema.merge(userSpecificSchema);

  // Set up form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: insurance
      ? {
          ...insurance,
          startDate: insurance.startDate ? new Date(insurance.startDate) : undefined,
          endDate: insurance.endDate ? new Date(insurance.endDate) : undefined,
        }
      : {
          policyNumber: "",
          provider: "",
          coverageType: "Full Coverage",
          premium: 0,
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          ...(type === "car"
            ? {
                carId: carId || 0,
                deductible: 500,
                coverageLimit: 100000,
              }
            : {
                userId: userId || 0,
                liabilityCoverage: 100000,
                personalInjuryCoverage: 50000,
              }),
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Policy Number */}
          <FormField
            control={form.control}
            name="policyNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Policy Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter policy number" {...field} />
                </FormControl>
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
                <FormLabel>Provider</FormLabel>
                <FormControl>
                  <Input placeholder="Enter insurance provider" {...field} />
                </FormControl>
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
                <FormLabel>Coverage Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coverage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Full Coverage">Full Coverage</SelectItem>
                    <SelectItem value="Liability Only">Liability Only</SelectItem>
                    <SelectItem value="Collision">Collision</SelectItem>
                    <SelectItem value="Comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Premium */}
          <FormField
            control={form.control}
            name="premium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Premium (USD)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date */}
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* End Date */}
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Car-specific fields */}
          {type === "car" && (
            <>
              {/* Car ID */}
              <FormField
                control={form.control}
                name="carId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Car</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || ""}
                      disabled={!!carId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a car" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCars?.map((car) => (
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

              {/* Deductible */}
              <FormField
                control={form.control}
                name="deductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Coverage Limit */}
              <FormField
                control={form.control}
                name="coverageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Limit (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* User-specific fields */}
          {type === "user" && (
            <>
              {/* User ID */}
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || ""}
                      disabled={!!userId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUsers?.map((user) => (
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

              {/* Liability Coverage */}
              <FormField
                control={form.control}
                name="liabilityCoverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Liability Coverage (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Personal Injury Protection */}
              <FormField
                control={form.control}
                name="personalInjuryCoverage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Injury Coverage (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : insurance ? "Update Insurance" : "Create Insurance"}
        </Button>
      </form>
    </Form>
  );
}