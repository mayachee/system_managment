import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocalization } from '@/hooks/use-localization';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Define the form schema
const componentSchema = z.object({
  carId: z.coerce.number({
    required_error: "Car is required",
  }),
  componentName: z.string()
    .min(2, { message: "Component name must be at least 2 characters" })
    .max(50, { message: "Component name can't exceed 50 characters" }),
  status: z.string({
    required_error: "Health status is required",
  }),
  alertLevel: z.coerce.number()
    .min(0, { message: "Alert level must be at least 0" })
    .max(3, { message: "Alert level can't exceed 3" }),
  notes: z.string().max(500, { message: "Notes can't exceed 500 characters" }).optional(),
  lastChecked: z.string().default(() => new Date().toISOString().substring(0, 16)),
});

type ComponentFormValues = z.infer<typeof componentSchema>;

interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  carId: string;
}

interface ComponentFormProps {
  cars: Car[];
  existingComponent?: {
    id: number;
    carId: number;
    componentName: string;
    status: string;
    alertLevel: number;
    notes?: string;
    lastChecked: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

export function ComponentForm({ cars, existingComponent, onSuccess, onCancel }: ComponentFormProps) {
  const { t } = useLocalization();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Set up the form with default values
  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: existingComponent ? {
      ...existingComponent,
      lastChecked: format(new Date(existingComponent.lastChecked), "yyyy-MM-dd'T'HH:mm"),
    } : {
      carId: cars.length > 0 ? cars[0].id : 0,
      componentName: '',
      status: 'good',
      alertLevel: 0,
      notes: '',
      lastChecked: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    },
  });
  
  // Handle component creation mutation
  const createMutation = useMutation({
    mutationFn: async (data: ComponentFormValues) => {
      const response = await apiRequest('POST', '/api/vehicle-health/components', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/components'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/critical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/needs-attention'] });
      toast({
        title: t("Component Created"),
        description: t("The vehicle health component has been added successfully."),
        variant: "default",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error creating component:", error);
      toast({
        title: t("Creation Failed"),
        description: t("Failed to create the component. Please try again."),
        variant: "destructive",
      });
    },
  });
  
  // Handle component update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ComponentFormValues) => {
      if (!existingComponent) throw new Error("No component to update");
      const response = await apiRequest('PATCH', `/api/vehicle-health/components/${existingComponent.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/components'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/critical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/needs-attention'] });
      toast({
        title: t("Component Updated"),
        description: t("The vehicle health component has been updated successfully."),
        variant: "default",
      });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error updating component:", error);
      toast({
        title: t("Update Failed"),
        description: t("Failed to update the component. Please try again."),
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ComponentFormValues) => {
    if (existingComponent) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{existingComponent ? t("Update Component") : t("Add New Component")}</CardTitle>
        <CardDescription>
          {t("Track and manage vehicle health status")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Car Selection */}
            <FormField
              control={form.control}
              name="carId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Vehicle")}</FormLabel>
                  <Select
                    disabled={!!existingComponent}
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select a vehicle")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cars.map((car) => (
                        <SelectItem key={car.id} value={car.id.toString()}>
                          {car.make} {car.model} ({car.year}) - {car.carId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("Select the vehicle this component belongs to")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Component Name */}
            <FormField
              control={form.control}
              name="componentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Component Name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("e.g., Engine, Brakes, Transmission")} {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("Enter the name of the vehicle component")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Health Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Health Status")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select health status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="excellent">
                        😀 {t("Excellent")}
                      </SelectItem>
                      <SelectItem value="good">
                        🙂 {t("Good")}
                      </SelectItem>
                      <SelectItem value="fair">
                        😐 {t("Fair")}
                      </SelectItem>
                      <SelectItem value="poor">
                        🙁 {t("Poor")}
                      </SelectItem>
                      <SelectItem value="critical">
                        😨 {t("Critical")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("Select the current health status of this component")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Alert Level */}
            <FormField
              control={form.control}
              name="alertLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Alert Level")}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("Select alert level")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">{t("No Alert (0)")}</SelectItem>
                      <SelectItem value="1">{t("Low (1)")}</SelectItem>
                      <SelectItem value="2">{t("Medium (2)")}</SelectItem>
                      <SelectItem value="3">{t("High (3)")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t("Set the alert level for this component")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Last Checked Date */}
            <FormField
              control={form.control}
              name="lastChecked"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Last Checked")}</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormDescription>
                    {t("When was this component last inspected?")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Notes")}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t("Add any additional notes about this component's condition")} 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("Optional details about the component condition")}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {t("Cancel")}
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 
                  t("Saving...") : 
                  existingComponent ? t("Update Component") : t("Add Component")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ComponentForm;