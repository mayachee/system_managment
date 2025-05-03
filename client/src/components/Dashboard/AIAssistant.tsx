import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, X, ChevronDown, ChevronUp, HelpCircle, Check, Car, Shield, Bell, Wrench, Loader2, Calendar, Activity, BarChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { processAIQuery, type AIQuery, type AIResponse } from "@/lib/aiService";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { FileUploader } from "@/components/ui/file-uploader";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  response?: AIResponse;
  timestamp: Date;
}

const EXAMPLES = [
  "Add car",
  "Add insurance",
  "Send notification",
  "Schedule maintenance",
  "Which cars are most popular?",
  "Maintenance recommendations",
  "Revenue analysis",
  "Predict maintenance needs",
  "Analyze vehicle health",
  "Customer insights",
  "Fleet optimization",
  "Check engine health",
  "When will my car need an oil change?",
  "Predict tire replacement",
  "Which cars need maintenance soon?",
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "assistant",
      content: "Hello! I'm your car rental dashboard assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [currentAction, setCurrentAction] = useState<{
    type: string; 
    data: any;
    messageId: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get car data for AI context
  const { data: carsData } = useQuery({
    queryKey: ['/api/cars'],
    enabled: isOpen, // Only fetch when the assistant is open
  });

  // Get dashboard stats for AI context
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    enabled: isOpen,
  });
  
  // State for file uploads
  const [carImages, setCarImages] = useState<File[]>([]);
  
  // Function to upload car images
  const uploadCarImages = async (carId: string) => {
    if (!carId) {
      console.error('Cannot upload images: No car ID provided');
      toast({
        title: "Upload Error",
        description: "Cannot upload images: Car ID is missing",
        variant: "destructive",
      });
      return [];
    }
    
    if (carImages.length === 0) {
      return [];
    }
    
    // Define category mapping based on image index
    const imageCategories = ['main', 'interior', 'exterior', 'damage', 'other'];
    console.log(`Uploading ${carImages.length} images for car ID ${carId}`);
    
    // Create a batch upload FormData
    const formData = new FormData();
    
    // Append all images with corresponding categories
    carImages.forEach((file, index) => {
      const category = index < imageCategories.length 
        ? imageCategories[index] 
        : 'other';
      
      // Append each file and its category
      formData.append('photos', file);
      formData.append('categories', category);
      console.log(`Adding ${category} image to upload batch`);
    });
    
    try {
      console.log(`Uploading ${carImages.length} images for car ${carId}`);
      const res = await fetch(`/api/cars/${carId}/photos`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Server response: ${errorText}`);
        throw new Error(`Failed to upload images: ${res.status} ${res.statusText}`);
      }
      
      const result = await res.json();
      console.log(`Successfully uploaded images:`, result);
      
      toast({
        title: "Images Uploaded",
        description: `Successfully uploaded ${carImages.length} images`,
        variant: "default",
      });
      
      return [result]; // Return the result in an array for compatibility
    } catch (error: any) {
      console.error(`Image upload error:`, error);
      toast({
        title: `Upload Error`,
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
      return [];
    }
  };
  
  // API mutations for AI actions
  const addCarMutation = useMutation({
    mutationFn: async (car: any) => {
      const res = await apiRequest('POST', '/api/cars', car);
      const newCar = await res.json();
      
      // If we have images, upload them after car is created
      if (carImages.length > 0) {
        // In our system, the car ID field is just "id", not "carId"
        const carId = newCar.id || newCar.carId;
        if (carId) {
          console.log(`Car created with ID: ${carId}, uploading ${carImages.length} images`);
          await uploadCarImages(carId.toString());
        } else {
          console.error("Car ID missing in response:", newCar);
          toast({
            title: "Warning",
            description: "Car was added but could not upload images due to missing ID",
            variant: "destructive",
          });
        }
      }
      
      return newCar;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cars'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Success",
        description: "New car added to your fleet!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add car: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const addInsuranceMutation = useMutation({
    mutationFn: async (insurance: any) => {
      const res = await apiRequest('POST', '/api/insurance', insurance);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/insurance'] });
      toast({
        title: "Success",
        description: "Insurance details added!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add insurance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async (maintenance: any) => {
      const res = await apiRequest('POST', '/api/maintenance', maintenance);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: "Success",
        description: "Maintenance scheduled successfully!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to schedule maintenance: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const sendNotificationMutation = useMutation({
    mutationFn: async (notification: any) => {
      const res = await apiRequest('POST', '/api/notifications', notification);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Notification sent successfully!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send notification: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // New mutations for vehicle health analysis and prediction
  const analyzeVehicleHealthMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate a real API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return mock analysis data (in a real app, this would come from the API)
      return {
        success: true,
        analysis: {
          overall: "good",
          components: {
            engine: "excellent",
            brakes: "good",
            transmission: "good",
            suspension: "fair",
            electrical: "excellent"
          },
          recommendations: [
            "Check suspension system at next service",
            "Maintain regular oil changes every 5,000 miles"
          ]
        }
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health'] });
      toast({
        title: "Analysis Complete",
        description: "Vehicle health analysis completed successfully!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to analyze vehicle health: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const predictMaintenanceMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate a real API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1800));
      
      // Return mock prediction data (in a real app, this would come from the API)
      return {
        success: true,
        predictions: [
          {
            carId: data.carId || 1,
            component: "Brakes",
            estimatedDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            confidence: 0.89,
            priority: "medium"
          },
          {
            carId: data.carId || 1,
            component: "Oil Change",
            estimatedDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            confidence: 0.95,
            priority: "high"
          }
        ]
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/predictions'] });
      toast({
        title: "Prediction Complete",
        description: "Maintenance predictions generated successfully!",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to predict maintenance needs: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    try {
      // Prepare context from available data
      const context = {
        cars: Array.isArray(carsData) ? carsData : [],
        rentalStats: dashboardStats || {},
      };
      
      // Process the query
      const query: AIQuery = {
        question: input,
        context,
      };
      
      // Add a small delay to simulate thinking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await processAIQuery(query);
      
      // Add assistant message with response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.answer,
        response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing query:", error);
      toast({
        title: "Error",
        description: "Sorry, I had trouble processing your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 100);
  };
  
  const handleActionMessage = (message: Message) => {
    if (message.response?.type === 'action' && message.response.actionType) {
      setCurrentAction({
        type: message.response.actionType,
        data: message.response.actionData,
        messageId: message.id
      });
    }
  };
  
  // Check response after new message is added
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.type === 'assistant' && lastMessage.response) {
      handleActionMessage(lastMessage);
    }
  }, [messages]);
  
  const handleActionComplete = (result: any) => {
    // Add a success message from assistant
    const successMessage: Message = {
      id: Date.now().toString(),
      type: "assistant",
      content: `I've successfully completed that action for you! ${
        currentAction?.type === 'add_car' ? 'The new car has been added to your fleet.' : 
        currentAction?.type === 'add_insurance' ? 'The insurance details have been added.' :
        currentAction?.type === 'send_notification' ? 'The notification has been sent.' :
        currentAction?.type === 'schedule_maintenance' ? 'The maintenance has been scheduled.' :
        currentAction?.type === 'predict_maintenance' ? 'The maintenance predictions have been analyzed.' :
        currentAction?.type === 'analyze_vehicle_health' ? 'The vehicle health analysis has been completed.' : ''
      }`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, successMessage]);
    setCurrentAction(null);
    
    // Clear any uploaded files
    if (carImages.length > 0) {
      setCarImages([]);
    }
  };
  
  const handleActionCancel = () => {
    setCurrentAction(null);
    
    // Clear any uploaded files
    if (carImages.length > 0) {
      setCarImages([]);
    }
  };

  return (
    <Collapsible 
      open={isOpen} 
      onOpenChange={setIsOpen}
      className={`fixed bottom-4 right-4 w-80 sm:w-96 z-40 shadow-xl rounded-lg border border-border overflow-hidden bg-white dark:bg-neutral-800 transition-all duration-300 ease-in-out ${
        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary/80 p-3 text-white">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-md">
            <Bot className="h-5 w-5" />
          </div>
          <h3 className="font-medium text-sm">AI Dashboard Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <CollapsibleTrigger asChild>
            <Button 
              id="ai-assistant-trigger"
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full text-white hover:bg-white/20"
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CollapsibleContent className="data-[state=open]:animate-slideUpAndFade data-[state=closed]:animate-slideDownAndFade">
        <Card className="rounded-none border-0">
          <CardContent className="p-0">
            <ScrollArea className="h-[350px] p-4">
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-lg shadow-sm ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-white animate-slideInFromRight' 
                          : 'bg-muted/70 border border-border/50 text-foreground animate-slideUpAndFade'
                      }`}
                    >
                      {message.content}
                      
                      {/* Show badge for recommendation type responses */}
                      {message.response?.type === 'recommendation' && (
                        <Badge variant="outline" className="mt-2 bg-background">Recommendation</Badge>
                      )}
                      
                      {/* Show action buttons for action type responses */}
                      {message.response?.type === 'action' && message.response.actionType && (
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            className="w-full"
                            variant="outline"
                            onClick={() => handleActionMessage(message)}
                          >
                            {message.response.actionType === 'add_car' && <Car className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'add_insurance' && <Shield className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'send_notification' && <Bell className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'schedule_maintenance' && <Wrench className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'predict_maintenance' && <Calendar className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'analyze_vehicle_health' && <Activity className="mr-2 h-4 w-4" />}
                            {message.response.actionType === 'add_car' && "Add New Car"}
                            {message.response.actionType === 'add_insurance' && "Add Insurance"}
                            {message.response.actionType === 'send_notification' && "Send Notification"}
                            {message.response.actionType === 'schedule_maintenance' && "Schedule Maintenance"}
                            {message.response.actionType === 'predict_maintenance' && "View Predictions"}
                            {message.response.actionType === 'analyze_vehicle_health' && "View Health Analysis"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] p-3 rounded-lg bg-muted/70 border border-border/50 shadow-sm animate-slideUpAndFade">
                      <div className="flex items-center gap-1.5">
                        <div className="animate-bounce h-2 w-2 bg-primary/70 rounded-full"></div>
                        <div className="animate-bounce delay-75 h-2 w-2 bg-primary/60 rounded-full"></div>
                        <div className="animate-bounce delay-150 h-2 w-2 bg-primary/50 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Action UI Components */}
            {currentAction && (
              <div className="p-3 border-t animate-slideUpAndFade">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium flex items-center gap-1">
                    {currentAction.type === 'add_car' && <Car className="h-4 w-4" />}
                    {currentAction.type === 'add_insurance' && <Shield className="h-4 w-4" />}
                    {currentAction.type === 'send_notification' && <Bell className="h-4 w-4" />}
                    {currentAction.type === 'schedule_maintenance' && <Wrench className="h-4 w-4" />}
                    {currentAction.type === 'predict_maintenance' && <Calendar className="h-4 w-4" />}
                    {currentAction.type === 'analyze_vehicle_health' && <Activity className="h-4 w-4" />}
                    {currentAction.type === 'add_car' && "Add New Car"}
                    {currentAction.type === 'add_insurance' && "Add Insurance"}
                    {currentAction.type === 'send_notification' && "Send Notification"}
                    {currentAction.type === 'schedule_maintenance' && "Schedule Maintenance"}
                    {currentAction.type === 'predict_maintenance' && "Maintenance Predictions"}
                    {currentAction.type === 'analyze_vehicle_health' && "Vehicle Health Analysis"}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0"
                    onClick={handleActionCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Add Car Action Form */}
                {currentAction.type === 'add_car' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="make">Make</Label>
                        <Input 
                          id="make" 
                          value={currentAction.data.car.make} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                make: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="model">Model</Label>
                        <Input 
                          id="model" 
                          value={currentAction.data.car.model} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                model: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="year">Year</Label>
                        <Input 
                          id="year" 
                          type="number"
                          value={currentAction.data.car.year} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                year: parseInt(e.target.value)
                              }
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="carId">Car ID</Label>
                        <Input 
                          id="carId" 
                          value={currentAction.data.car.carId} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                carId: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="location">Location</Label>
                        <Select
                          value={currentAction.data.car.locationId ? currentAction.data.car.locationId.toString() : "1"}
                          onValueChange={(value) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                locationId: parseInt(value)
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Main Office</SelectItem>
                            <SelectItem value="2">Downtown</SelectItem>
                            <SelectItem value="3">Airport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={currentAction.data.car.status || "available"}
                          onValueChange={(value) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              car: {
                                ...currentAction.data.car,
                                status: value
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Car Images Upload */}
                    <div className="space-y-2 mt-3">
                      <Label htmlFor="carImages">Car Images (up to 5)</Label>
                      <FileUploader
                        onFileSelect={(files: File[]) => {
                          setCarImages(files);
                        }}
                        onClear={() => setCarImages([])}
                        accept="image/*"
                        maxSize={2}
                        maxFiles={5}
                        description="Upload up to 5 car images"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          // Validate form data
                          if (!currentAction.data.car.make || !currentAction.data.car.model) {
                            toast({
                              title: "Validation Error",
                              description: "Please fill in all required fields (Make and Model are required)",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          // Execute mutation and handle action completion after success
                          addCarMutation.mutate(currentAction.data.car, {
                            onSuccess: (data) => {
                              handleActionComplete(data);
                            }
                          });
                        }}
                        disabled={addCarMutation.isPending}
                      >
                        {addCarMutation.isPending ? (
                          <>
                            <span className="mr-2">Adding...</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : "Add Car"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Add Insurance Action Form */}
                {currentAction.type === 'add_insurance' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="carId">Car ID</Label>
                      <Input 
                        id="carId" 
                        value={currentAction.data.insurance.carId} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            insurance: {
                              ...currentAction.data.insurance,
                              carId: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="provider">Insurance Provider</Label>
                      <Input 
                        id="provider" 
                        value={currentAction.data.insurance.provider} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            insurance: {
                              ...currentAction.data.insurance,
                              provider: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="policyNumber">Policy Number</Label>
                        <Input 
                          id="policyNumber" 
                          value={currentAction.data.insurance.policyNumber} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              insurance: {
                                ...currentAction.data.insurance,
                                policyNumber: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="coverageType">Coverage Type</Label>
                        <Select
                          value={currentAction.data.insurance.coverageType}
                          onValueChange={(value) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              insurance: {
                                ...currentAction.data.insurance,
                                coverageType: value
                              }
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Coverage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input 
                          id="startDate" 
                          type="date"
                          value={currentAction.data.insurance.startDate} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              insurance: {
                                ...currentAction.data.insurance,
                                startDate: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input 
                          id="endDate" 
                          type="date"
                          value={currentAction.data.insurance.endDate} 
                          onChange={(e) => setCurrentAction({
                            ...currentAction,
                            data: {
                              ...currentAction.data,
                              insurance: {
                                ...currentAction.data.insurance,
                                endDate: e.target.value
                              }
                            }
                          })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        addInsuranceMutation.mutate(currentAction.data.insurance);
                        handleActionComplete(currentAction.data.insurance);
                      }}>Add Insurance</Button>
                    </div>
                  </div>
                )}
                
                {/* Send Notification Action Form */}
                {currentAction.type === 'send_notification' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="recipientType">Recipients</Label>
                      <Select
                        value={currentAction.data.notification.recipientType}
                        onValueChange={(value) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            notification: {
                              ...currentAction.data.notification,
                              recipientType: value
                            }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Recipients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="admins">Admins Only</SelectItem>
                          <SelectItem value="specific">Specific User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="title">Title</Label>
                      <Input 
                        id="title" 
                        value={currentAction.data.notification.title} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            notification: {
                              ...currentAction.data.notification,
                              title: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        value={currentAction.data.notification.message} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            notification: {
                              ...currentAction.data.notification,
                              message: e.target.value
                            }
                          }
                        })}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={currentAction.data.notification.priority}
                        onValueChange={(value) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            notification: {
                              ...currentAction.data.notification,
                              priority: value
                            }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        sendNotificationMutation.mutate(currentAction.data.notification);
                        handleActionComplete(currentAction.data.notification);
                      }}>Send Notification</Button>
                    </div>
                  </div>
                )}
                
                {/* Schedule Maintenance Action Form */}
                {currentAction.type === 'schedule_maintenance' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="carId">Car ID</Label>
                      <Input 
                        id="carId" 
                        value={currentAction.data.maintenance.carId} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            maintenance: {
                              ...currentAction.data.maintenance,
                              carId: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="maintenanceType">Maintenance Type</Label>
                      <Select
                        value={currentAction.data.maintenance.maintenanceType}
                        onValueChange={(value) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            maintenance: {
                              ...currentAction.data.maintenance,
                              maintenanceType: value
                            }
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="oil_change">Oil Change</SelectItem>
                          <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="scheduledDate">Scheduled Date</Label>
                      <Input 
                        id="scheduledDate" 
                        type="date"
                        value={currentAction.data.maintenance.scheduledDate} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            maintenance: {
                              ...currentAction.data.maintenance,
                              scheduledDate: e.target.value
                            }
                          }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea 
                        id="notes" 
                        value={currentAction.data.maintenance.notes} 
                        onChange={(e) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            maintenance: {
                              ...currentAction.data.maintenance,
                              notes: e.target.value
                            }
                          }
                        })}
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        scheduleMaintenanceMutation.mutate(currentAction.data.maintenance);
                        handleActionComplete(currentAction.data.maintenance);
                      }}>Schedule</Button>
                    </div>
                  </div>
                )}
                
                {/* Vehicle Health Analysis View */}
                {currentAction.type === 'analyze_vehicle_health' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="car">Select Car</Label>
                      <Select
                        value={currentAction.data?.carId?.toString() || "1"}
                        onValueChange={(value) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            carId: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Car" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(carsData) && carsData.map(car => (
                            <SelectItem key={car.id} value={car.id.toString()}>
                              {car.make} {car.model} ({car.carId})
                            </SelectItem>
                          ))}
                          {(!Array.isArray(carsData) || carsData.length === 0) && (
                            <SelectItem value="1">Sample Car</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2 bg-background/50">
                      <div className="text-sm font-medium">Analysis Options</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="engine" 
                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                            defaultChecked
                          />
                          <Label htmlFor="engine" className="text-xs">Engine</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="brakes" 
                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                            defaultChecked
                          />
                          <Label htmlFor="brakes" className="text-xs">Brakes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="transmission" 
                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                            defaultChecked
                          />
                          <Label htmlFor="transmission" className="text-xs">Transmission</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input 
                            type="checkbox" 
                            id="electrical" 
                            className="h-4 w-4 rounded text-primary focus:ring-primary"
                            defaultChecked
                          />
                          <Label htmlFor="electrical" className="text-xs">Electrical</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          analyzeVehicleHealthMutation.mutate(currentAction.data, {
                            onSuccess: (data) => {
                              handleActionComplete(data);
                            }
                          });
                        }}
                        disabled={analyzeVehicleHealthMutation.isPending}
                      >
                        {analyzeVehicleHealthMutation.isPending ? (
                          <>
                            <span className="mr-2">Analyzing...</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : "Analyze Health"}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Maintenance Prediction View */}
                {currentAction.type === 'predict_maintenance' && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="car">Select Car</Label>
                      <Select
                        value={currentAction.data?.carId?.toString() || "1"}
                        onValueChange={(value) => setCurrentAction({
                          ...currentAction,
                          data: {
                            ...currentAction.data,
                            carId: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Car" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(carsData) && carsData.map(car => (
                            <SelectItem key={car.id} value={car.id.toString()}>
                              {car.make} {car.model} ({car.carId})
                            </SelectItem>
                          ))}
                          {(!Array.isArray(carsData) || carsData.length === 0) && (
                            <SelectItem value="1">Sample Car</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md p-3 space-y-2 bg-background/50">
                      <div className="text-sm font-medium">Prediction Parameters</div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="timeframe" className="text-xs">Timeframe</Label>
                          <Select defaultValue="3">
                            <SelectTrigger id="timeframe">
                              <SelectValue placeholder="Select Timeframe" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Month</SelectItem>
                              <SelectItem value="3">3 Months</SelectItem>
                              <SelectItem value="6">6 Months</SelectItem>
                              <SelectItem value="12">12 Months</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="confidence" className="text-xs">Minimum Confidence</Label>
                          <Select defaultValue="0.7">
                            <SelectTrigger id="confidence">
                              <SelectValue placeholder="Select Confidence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.5">50%</SelectItem>
                              <SelectItem value="0.7">70%</SelectItem>
                              <SelectItem value="0.9">90%</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={handleActionCancel}>Cancel</Button>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          predictMaintenanceMutation.mutate(currentAction.data, {
                            onSuccess: (data) => {
                              handleActionComplete(data);
                            }
                          });
                        }}
                        disabled={predictMaintenanceMutation.isPending}
                      >
                        {predictMaintenanceMutation.isPending ? (
                          <>
                            <span className="mr-2">Predicting...</span>
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </>
                        ) : "Generate Predictions"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {messages.length === 1 && !currentAction && ( // Only show examples after welcome message
              <div className="p-3 border-t animate-slideUpAndFade">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  Try asking about:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((example, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="p-3 border-t animate-slideUpAndFade">
              <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-3 py-1 focus-within:ring-1 focus-within:ring-primary/30">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your car rentals..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                  disabled={isTyping}
                />
                <Button 
                  type="submit" 
                  disabled={isTyping || !input.trim()} 
                  size="icon" 
                  className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90 text-white shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}