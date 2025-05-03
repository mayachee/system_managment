import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Check, Image as ImageIcon, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FileUploaderProps {
  onFileSelect: (files: File[]) => void;
  onClear?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  maxFiles?: number; // maximum number of files allowed
  className?: string;
  buttonClassName?: string;
  description?: string;
  previewImages?: string[];
}

export function FileUploader({
  onFileSelect,
  onClear,
  accept = "image/*",
  maxSize = 5, // 5MB default
  maxFiles = 5, // 5 files default
  className = "",
  buttonClassName = "",
  description = "Upload images",
  previewImages = [],
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(previewImages || []);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      processFiles(fileArray);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const fileArray = Array.from(droppedFiles);
      processFiles(fileArray);
    }
  };

  const processFiles = (selectedFiles: File[]) => {
    if (!selectedFiles.length) return;
    
    // Check if adding these files would exceed the limit
    const totalFiles = files.length + selectedFiles.length;
    if (totalFiles > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} files`,
        variant: "destructive",
      });
      return;
    }
    
    // Filter valid files
    const validFiles = selectedFiles.filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `The file "${file.name}" is larger than ${maxSize}MB`,
          variant: "destructive",
        });
        return false;
      }

      // Check file type
      if (!file.type.match(accept.replace("*", ""))) {
        toast({
          title: "Invalid file type",
          description: `The file "${file.name}" is not a valid ${accept.replace("*/", "")} file`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to existing files
    const newFiles = [...files, ...validFiles];
    setFiles(newFiles);
    onFileSelect(newFiles);
    
    // Create previews for image files
    validFiles.forEach(file => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          setPreviews(prev => [...prev, reader.result as string]);
        };
      } else {
        // For non-image files, we still need a placeholder
        setPreviews(prev => [...prev, ""]);
      }
    });
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    
    onFileSelect(newFiles);
  };

  const handleClear = () => {
    setFiles([]);
    setPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onClear) {
      onClear();
    }
    onFileSelect([]);
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isUploading}
        multiple
      />

      {files.length === 0 && previews.length === 0 ? (
        <div
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragOver
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50 hover:bg-accent"
          }`}
          onClick={handleFileSelect}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
          <p className="mb-1 text-sm font-medium">{description}</p>
          <p className="text-xs text-muted-foreground">
            Drag & drop or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max size: {maxSize}MB per file (up to {maxFiles} files)
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClear} 
              className="text-xs h-7 px-2"
            >
              Clear All
            </Button>
          </div>
          
          <ScrollArea className="h-full max-h-56">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-border">
                  {preview ? (
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                  ) : (
                    <div className="w-full h-24 bg-muted flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="p-1 bg-card">
                    <span className="text-xs text-foreground font-medium truncate block">
                      {files[index]?.name || `Image ${index + 1}`}
                    </span>
                  </div>
                </div>
              ))}
              
              {files.length < maxFiles && (
                <div 
                  className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50"
                  onClick={handleFileSelect}
                >
                  <Plus className="w-6 h-6 mb-1 text-muted-foreground" />
                  <span className="text-xs">Add more</span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}