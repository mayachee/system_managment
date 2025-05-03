import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  RotateCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CarPhotosGalleryProps {
  carId: number;
  additionalImages?: string[];
  mainImage?: string;
  onAddPhotos?: () => void;
}

export function CarPhotosGallery({ 
  carId, 
  additionalImages = [],
  mainImage,
  onAddPhotos
}: CarPhotosGalleryProps) {
  const { toast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  
  // Combine main image with additional images
  const allImages = mainImage 
    ? [mainImage, ...additionalImages]
    : additionalImages;
  
  // Check if we have any images
  const hasImages = allImages.length > 0;
  
  // Query to get the latest car features data if not provided
  const { data: carFeatures } = useQuery({
    queryKey: ['/api/cars', carId, 'features'],
    enabled: !hasImages && carId > 0, // Only run if we don't have images and have a valid carId
  });
  
  // Process carFeatures.additionalImages to ensure it's properly handled
  let featureImages: string[] = [];
  if (carFeatures?.additionalImages) {
    let parsedImages: any = carFeatures.additionalImages;
    
    // If it's a string (JSON), try to parse it
    if (typeof carFeatures.additionalImages === 'string') {
      try {
        parsedImages = JSON.parse(carFeatures.additionalImages);
      } catch (error) {
        console.warn('Error parsing additionalImages JSON:', error);
        parsedImages = [];
      }
    }
    
    // Handle both array format (old) and object format (new)
    if (Array.isArray(parsedImages)) {
      // Old format - simple array
      featureImages = parsedImages;
    } else if (typeof parsedImages === 'object') {
      // New format - categorized object
      // Flatten all categories into a single array for the gallery view
      const categories = ['main', 'interior', 'exterior', 'damage', 'other'];
      for (const category of categories) {
        if (Array.isArray(parsedImages[category])) {
          featureImages = [...featureImages, ...parsedImages[category]];
        }
      }
      
      // Check for legacy categories that might still exist in some records
      const legacyCategories = ['side', 'back', 'extra'];
      for (const category of legacyCategories) {
        if (Array.isArray(parsedImages[category])) {
          featureImages = [...featureImages, ...parsedImages[category]];
        }
      }
    }
  }
  
  // Get all available images combining props and data
  const allAvailableImages = hasImages 
    ? allImages 
    : featureImages;
    
  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoUrl: string) => {
      const response = await apiRequest(
        "DELETE",
        `/api/cars/${carId}/photos`,
        { photoUrl }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Photo deleted", 
        description: "The photo has been removed successfully" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cars', carId, 'features'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error deleting photo", 
        description: error.message || "Failed to delete the photo", 
        variant: "destructive" 
      });
    }
  });
  
  if (allAvailableImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg bg-background/50">
        <p className="text-muted-foreground mb-4">No photos available for this car</p>
        {onAddPhotos && (
          <Button onClick={onAddPhotos}>
            Add Photos
          </Button>
        )}
      </div>
    );
  }
  
  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? allAvailableImages.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => 
      prev === allAvailableImages.length - 1 ? 0 : prev + 1
    );
  };
  
  const handleDelete = (photoUrl: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      deletePhotoMutation.mutate(photoUrl);
    }
  };
  
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };
  
  const resetFullscreenControls = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  
  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="relative aspect-video border rounded-lg overflow-hidden bg-background/50">
        <img
          src={allAvailableImages[currentIndex]}
          alt={`Car photo ${currentIndex + 1}`}
          className="w-full h-full object-contain"
        />
        
        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/70 hover:bg-background/90 shadow"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/70 hover:bg-background/90 shadow"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Controls overlay */}
        <div className="absolute top-2 right-2 flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/70 hover:bg-background/90 shadow"
            onClick={() => {
              setFullscreenImage(allAvailableImages[currentIndex]);
              resetFullscreenControls();
            }}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-background/70 hover:bg-background/90 shadow text-destructive hover:text-destructive"
            onClick={() => handleDelete(allAvailableImages[currentIndex])}
            disabled={deletePhotoMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Image counter */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full bg-background/70 text-xs">
          {currentIndex + 1} / {allAvailableImages.length}
        </div>
      </div>
      
      {/* Thumbnails */}
      <ScrollArea className="px-1 pb-3 h-full max-h-24">
        <div className="flex space-x-2">
          {allAvailableImages.map((image: string, index: number) => (
            <button
              key={image}
              className={cn(
                "relative w-20 h-20 rounded border overflow-hidden flex-shrink-0 transition",
                currentIndex === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              )}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          
          {onAddPhotos && (
            <button
              className="w-20 h-20 rounded border border-dashed border-border flex items-center justify-center bg-background/50 hover:bg-background/80 flex-shrink-0 transition"
              onClick={onAddPhotos}
            >
              <span className="text-2xl">+</span>
            </button>
          )}
        </div>
      </ScrollArea>
      
      {/* Fullscreen image dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={(open) => !open && setFullscreenImage(null)}>
        <DialogContent className="max-w-6xl w-[90vw] h-[90vh] p-0 bg-black">
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            {fullscreenImage && (
              <img
                src={fullscreenImage}
                alt="Full size car photo"
                className="max-w-full max-h-full transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)` 
                }}
              />
            )}
            
            {/* Fullscreen controls */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setFullscreenImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}