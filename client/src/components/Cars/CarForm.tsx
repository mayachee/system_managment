import { useEffect, useState } from "react";
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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/ui/icons";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Upload, X } from "lucide-react";

const carSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.coerce.number().int().min(1900, "Year must be at least 1900").max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  locationId: z.coerce.number().int().min(1, "Location is required"),
  status: z.enum(["available", "rented", "maintenance"], {
    errorMap: () => ({ message: "Please select a valid status" }),
  }),
  carId: z.string().min(1, "Car ID is required").regex(/^[A-Za-z0-9-]+$/, "Car ID can only contain letters, numbers, and hyphens"),
  imageUrl: z.string().optional(),
});

type CarFormValues = z.infer<typeof carSchema>;

interface CarFormProps {
  onSubmit: (data: CarFormValues) => void;
  carId: number | null;
  isSubmitting: boolean;
}

export default function CarForm({ onSubmit, carId, isSubmitting }: CarFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carSchema),
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      locationId: undefined,
      status: "available",
      carId: "",
      imageUrl: "",
    },
  });
  
  // Fetch locations for dropdown
  const { 
    data: locations, 
    isLoading: isLoadingLocations,
    error: locationsError
  } = useQuery({
    queryKey: ["/api/locations"],
  });
  
  // Fetch car data if editing
  const { 
    data: car, 
    isLoading: isLoadingCar,
    error: carError
  } = useQuery({
    queryKey: [`/api/cars/${carId}`],
    enabled: !!carId,
  });
  
  // Set form values when car data is loaded
  useEffect(() => {
    if (car) {
      form.reset({
        make: car.make,
        model: car.model,
        year: car.year,
        locationId: car.locationId,
        status: car.status as "available" | "rented" | "maintenance",
        carId: car.carId,
        imageUrl: car.imageUrl || "",
      });
      
      // Set the image preview if there's an image URL
      if (car.imageUrl) {
        setImagePreview(car.imageUrl);
      }
    }
  }, [car, form]);
  
  const isLoading = isLoadingLocations || (carId && isLoadingCar);
  const error = locationsError || carError;
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    // Read the file as a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      form.setValue("imageUrl", base64String);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear the image
  const clearImage = () => {
    setImagePreview(null);
    form.setValue("imageUrl", "");
  };
  
  const handleSubmit = (data: CarFormValues) => {
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="make"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Make</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Toyota" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Camry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="e.g. 2023" 
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Car ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. CAR-2023-089" 
                      {...field}
                      disabled={!!carId} // Disable editing of Car ID if editing
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="locationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value ? field.value.toString() : ""}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Car Image</FormLabel>
                <FormDescription>
                  Upload an image of the car to help customers identify it.
                </FormDescription>
                
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative w-full max-w-[300px] h-[200px] border rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Car preview" 
                        className="w-full h-full object-cover" 
                      />
                      <Button 
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-md p-6 flex flex-col items-center justify-center">
                      <div className="mb-2">
                        <Upload className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
                        <span className="font-medium">Click to upload</span> or drag and drop
                      </div>
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        id="car-image-upload"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('car-image-upload')?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Select Image"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                
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
                  {carId ? "Updating..." : "Creating..."}
                </>
              ) : (
                carId ? "Update Car" : "Create Car"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
