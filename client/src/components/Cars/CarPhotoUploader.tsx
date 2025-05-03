import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, XCircle, ImageIcon, Camera } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface CarPhotoUploaderProps {
  carId: number;
  onComplete?: () => void;
}

// Define photo categories
type PhotoCategory = "side" | "back" | "interior" | "extra";

export function CarPhotoUploader({ carId, onComplete }: CarPhotoUploaderProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<PhotoCategory>("side");
  const [uploadProgress, setUploadProgress] = useState<Record<PhotoCategory, number>>({
    side: 0,
    back: 0,
    interior: 0,
    extra: 0
  });
  
  // Track files and previews for each category
  const [categoryFiles, setCategoryFiles] = useState<Record<PhotoCategory, File[]>>({
    side: [],
    back: [],
    interior: [],
    extra: []
  });
  
  const [categoryPreviews, setCategoryPreviews] = useState<Record<PhotoCategory, string[]>>({
    side: [],
    back: [],
    interior: [],
    extra: []
  });

  // Get current category files and previews
  const currentFiles = categoryFiles[activeCategory] || [];
  const currentPreviews = categoryPreviews[activeCategory] || [];

  const uploadMutation = useMutation({
    mutationFn: async (data: { category: PhotoCategory, files: File[] }) => {
      const { category, files } = data;
      
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        // Add category metadata to each file
        formData.append("photos", file);
        formData.append("categories", category);
      });

      // Mock progress updates (since fetch doesn't have progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          const current = updated[category];
          updated[category] = current < 90 ? current + 5 : current;
          return updated;
        });
      }, 100);

      try {
        // Upload photos
        const response = await apiRequest(
          "POST", 
          `/api/cars/${carId}/photos`, 
          formData, 
          true // isFormData flag
        );
        
        // Complete the progress
        setUploadProgress(prev => ({ 
          ...prev, 
          [category]: 100 
        }));
        clearInterval(progressInterval);
        
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ 
          ...prev, 
          [category]: 0 
        }));
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      const { category } = variables;
      toast({
        title: "Photos uploaded",
        description: `${category.charAt(0).toUpperCase() + category.slice(1)} photos uploaded successfully.`,
      });
      
      // Clear the current category
      setCategoryFiles(prev => ({
        ...prev,
        [category]: []
      }));
      
      // Clear previews and revoke URLs
      categoryPreviews[category].forEach(url => URL.revokeObjectURL(url));
      setCategoryPreviews(prev => ({
        ...prev,
        [category]: []
      }));
      
      // Reset upload progress for this category
      setUploadProgress(prev => ({
        ...prev,
        [category]: 0
      }));
      
      // Invalidate car features query to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/cars', carId, 'features'] });
      
      // Callback on complete
      if (onComplete) onComplete();
    },
    onError: (error: Error, variables) => {
      const { category } = variables;
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading the photos.",
        variant: "destructive",
      });
      setUploadProgress(prev => ({
        ...prev,
        [category]: 0
      }));
    },
  });

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>, category: PhotoCategory) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024 // 10MB limit
    );
    
    if (validFiles.length !== selectedFiles.length) {
      toast({
        title: "Invalid files",
        description: "Some files were rejected. Only images under 10MB are allowed.",
        variant: "destructive",
      });
    }
    
    // Update files for this category
    setCategoryFiles(prev => ({
      ...prev,
      [category]: [...prev[category], ...validFiles]
    }));
    
    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setCategoryPreviews(prev => ({
      ...prev,
      [category]: [...prev[category], ...newPreviews]
    }));
  };

  const removeFile = (category: PhotoCategory, index: number) => {
    // Remove file
    setCategoryFiles(prev => {
      const updated = { ...prev };
      updated[category] = updated[category].filter((_, i) => i !== index);
      return updated;
    });
    
    // Revoke URL to prevent memory leaks
    URL.revokeObjectURL(categoryPreviews[category][index]);
    
    // Remove preview
    setCategoryPreviews(prev => {
      const updated = { ...prev };
      updated[category] = updated[category].filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent, category: PhotoCategory) => {
    e.preventDefault();
    if (categoryFiles[category].length === 0) {
      toast({
        title: "No files selected",
        description: "Please select photos to upload.",
        variant: "destructive",
      });
      return;
    }
    
    uploadMutation.mutate({ 
      category, 
      files: categoryFiles[category] 
    });
  };

  // Count total photos across all categories
  const totalPhotos = Object.values(categoryFiles).reduce(
    (sum, files) => sum + files.length, 
    0
  );

  // Get category display names
  const getCategoryName = (category: PhotoCategory): string => {
    switch(category) {
      case "side": return "Side";
      case "back": return "3/4 Back";
      case "interior": return "Interior";
      case "extra": return "Extra";
      default: return category;
    }
  };

  const getCategoryDescription = (category: PhotoCategory): string => {
    switch(category) {
      case "side": return "Side view of the vehicle";
      case "back": return "3/4 Back angle view";
      case "interior": return "Interior details";
      case "extra": return "To highlight specifics (trunk, baby seat...)";
      default: return "";
    }
  };

  const renderUploadSection = (category: PhotoCategory) => {
    const files = categoryFiles[category];
    const previews = categoryPreviews[category];
    const progress = uploadProgress[category];
    
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-6 bg-background/50 relative">
          {progress > 0 && (
            <div className="absolute inset-0 bg-black/5 flex flex-col items-center justify-center rounded-lg z-10">
              <Progress value={progress} className="w-3/4 mb-2" />
              <p className="text-sm text-muted-foreground">{progress}% Uploaded</p>
            </div>
          )}
          
          {previews.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
              {previews.map((preview, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={preview} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(category, index)}
                    className="absolute -top-2 -right-2 bg-background rounded-full shadow"
                  >
                    <XCircle className="h-5 w-5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium text-foreground mb-1">
                {getCategoryName(category)} Photos
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {getCategoryDescription(category)}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-4">
          <label
            htmlFor={`file-upload-${category}`}
            className="cursor-pointer inline-flex items-center px-4 py-2 rounded-md border border-input bg-background shadow-sm text-sm font-medium hover:bg-accent transition-colors"
          >
            Select Photos
          </label>
          
          <input
            id={`file-upload-${category}`}
            name={`files-${category}`}
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            onChange={(e) => handleFilesChange(e, category)}
            disabled={uploadMutation.isPending}
          />
          
          {files.length > 0 && (
            <Button 
              type="button" 
              onClick={(e) => handleSubmit(e, category)}
              disabled={uploadMutation.isPending}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload {files.length} Photo{files.length !== 1 ? 's' : ''}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Car Photos</h3>
        {totalPhotos > 0 && (
          <Badge variant="outline" className="ml-2">{totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} selected</Badge>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            ADDITIONAL PICTURES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="side" value={activeCategory} onValueChange={(val) => setActiveCategory(val as PhotoCategory)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="side">Side</TabsTrigger>
              <TabsTrigger value="back">3/4 Back</TabsTrigger>
              <TabsTrigger value="interior">Interior</TabsTrigger>
            </TabsList>
            
            <TabsContent value="side" className="mt-0">
              {renderUploadSection("side")}
            </TabsContent>
            
            <TabsContent value="back" className="mt-0">
              {renderUploadSection("back")}
            </TabsContent>
            
            <TabsContent value="interior" className="mt-0">
              {renderUploadSection("interior")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            EXTRA PHOTOS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderUploadSection("extra")}
        </CardContent>
      </Card>
    </div>
  );
}