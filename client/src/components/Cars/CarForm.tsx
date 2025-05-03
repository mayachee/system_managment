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
import { AlertCircle, Upload, X, Camera, Image as ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    data: locations = [], 
    isLoading: isLoadingLocations,
    error: locationsError
  } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });
  
  // Fetch car data if editing
  const { 
    data: car, 
    isLoading: isLoadingCar,
    error: carError
  } = useQuery<any>({
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
    <div className="car-form-container">
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
                    disabled={isLoading || false}
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
              <FormItem className="col-span-2">
                <FormLabel>Car Images</FormLabel>
                <FormDescription>
                  Upload images of the car to help customers identify it. We display cars with photos first.
                </FormDescription>
                
                <div className="mt-4 border rounded-md">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b">
                    <h3 className="text-sm font-medium">Pictures of the vehicle</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      We only display cars with photos. You can start with one and add more after your listing is live.
                    </p>
                    
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Use the landscape format
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Keep the background clear and neutral
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Follow our image guidelines
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M8 12l2 2 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Use only natural daylight
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">MAIN PICTURE</h4>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className={`relative w-full md:w-1/2 aspect-video border rounded-md overflow-hidden
                          ${imagePreview ? 'bg-white' : 'bg-gray-100 dark:bg-gray-800'}`}>
                          {imagePreview ? (
                            <div className="relative w-full h-full">
                              <img 
                                src={imagePreview} 
                                alt="Car front view" 
                                className="w-full h-full object-contain" 
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                                <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">3/4 Front</span>
                              <Input 
                                type="file" 
                                accept="image/*"
                                className="hidden"
                                id="car-front-image-upload"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => document.getElementById('car-front-image-upload')?.click()}
                                disabled={isUploading}
                              >
                                {isUploading ? "Uploading..." : "Upload"}
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="md:w-1/2">
                          <div className="text-sm mb-2">
                            <span className="font-semibold">A 3/4 front photo</span> that stands out is the first one drivers see.
                          </div>
                          {imagePreview && (
                            <div className="mt-4">
                              <img src={imagePreview} alt="Car thumbnail" className="w-32 h-auto border rounded object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">ADDITIONAL PICTURES</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="aspect-video border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                            <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Side</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Upload
                          </Button>
                        </div>
                        
                        <div className="aspect-video border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                            <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">3/4 Back</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Upload
                          </Button>
                        </div>
                        
                        <div className="aspect-video border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                            <Camera className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">Interior</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            Upload
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2">EXTRA PHOTOS</h4>
                      <div className="aspect-video border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                          <ImageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Extra</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-4 text-center">
                          To highlight specifics (trunk, baby seat...)
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
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
            <Button type="submit" disabled={isSubmitting || (isLoading || false)}>
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
