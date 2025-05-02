import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const locationSchema = z.object({
  name: z.string().min(1, "Location name is required"),
  address: z.string().min(5, "Address is required and must be at least 5 characters"),
});

type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormProps {
  onSubmit: (data: LocationFormValues) => void;
  locationId: number | null;
  isSubmitting: boolean;
}

export default function LocationForm({ onSubmit, locationId, isSubmitting }: LocationFormProps) {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });
  
  // Fetch location data if editing
  const { 
    data: location, 
    isLoading,
    error
  } = useQuery({
    queryKey: [`/api/locations/${locationId}`],
    enabled: !!locationId,
  });
  
  // Set form values when location data is loaded
  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        address: location.address,
      });
    }
  }, [location, form]);
  
  const handleSubmit = (data: LocationFormValues) => {
    onSubmit(data);
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to load location data"}
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Downtown Branch" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="e.g. 123 Main Street, Suite 101, Cityville" 
                    {...field} 
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  {locationId ? "Updating..." : "Creating..."}
                </>
              ) : (
                locationId ? "Update Location" : "Create Location"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
