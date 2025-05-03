import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, AlertTriangle, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppLayout } from '@/components/AppLayout';
import { useLocalization } from '@/hooks/use-localization';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface VehicleHealthComponent {
  id: number;
  carId: number;
  componentName: string;
  status: string;
  lastChecked: string;
  notes: string;
  alertLevel: number;
  updatedBy: number;
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    status: string;
  };
  updatedByUser?: {
    id: number;
    username: string;
  };
}

export interface VehicleHealthDashboard {
  id: number;
  carId: number;
  overallHealth: string;
  healthScore: number;
  alerts: number;
  lastUpdated: string;
  recommendations: {
    component: string;
    recommendation: string;
    urgent?: boolean;
  }[];
  historyData: {
    date: string;
    score: number;
    alerts: number;
  }[];
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    status: string;
    carId: string;
  };
}

// Emoji mapping for health statuses
const healthStatusEmojis: Record<string, string> = {
  excellent: '😀',
  good: '🙂',
  fair: '😐',
  poor: '🙁',
  critical: '😨'
};

const healthStatusColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800 border-green-300',
  good: 'bg-blue-100 text-blue-800 border-blue-300',
  fair: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  poor: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300'
};

function VehicleHealthPage() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Fetch all vehicles with health dashboards
  const { 
    data: healthDashboards, 
    isLoading: isLoadingDashboards,
    error: dashboardsError
  } = useQuery<VehicleHealthDashboard[]>({ 
    queryKey: ['/api/vehicle-health/dashboards'],
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Fetch critical vehicles
  const { 
    data: criticalVehicles, 
    isLoading: isLoadingCritical 
  } = useQuery<VehicleHealthDashboard[]>({ 
    queryKey: ['/api/vehicle-health/critical'],
    refetchInterval: 30000, // Refresh more frequently for critical vehicles
  });
  
  // Fetch vehicles needing attention
  const { 
    data: attentionVehicles, 
    isLoading: isLoadingAttention 
  } = useQuery<VehicleHealthDashboard[]>({ 
    queryKey: ['/api/vehicle-health/needs-attention'],
    refetchInterval: 45000,
  });
  
  // Fetch components for the selected car
  const { 
    data: carComponents, 
    isLoading: isLoadingComponents,
    error: componentsError
  } = useQuery<VehicleHealthComponent[]>({ 
    queryKey: ['/api/vehicle-health/components', selectedCar],
    enabled: !!selectedCar,
  });
  
  // Function to update vehicle health dashboard
  const updateDashboard = async (carId: number) => {
    try {
      await apiRequest('POST', `/api/vehicle-health/dashboard/update/${carId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/components', carId] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/critical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/needs-attention'] });
      
      toast({
        title: t("Vehicle Health Dashboard Updated"),
        description: t("The health dashboard has been refreshed with the latest data."),
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating dashboard:", error);
      toast({
        title: t("Update Failed"),
        description: t("Failed to update the health dashboard. Please try again."),
        variant: "destructive",
      });
    }
  };
  
  // Loading state
  if (isLoadingDashboards) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p>{t("Loading vehicle health data...")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Error state
  if (dashboardsError) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-destructive" />
            <p className="text-destructive font-semibold mb-2">{t("Error loading vehicle health data")}</p>
            <p className="text-muted-foreground">{t("Please try again later.")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // Empty state - no vehicle health data yet
  if (!healthDashboards || healthDashboards.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">{t("No Vehicle Health Data Yet")}</h2>
            <p className="text-muted-foreground mb-4">{t("There are no vehicle health records in the system yet. Start by adding health components to your vehicles.")}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("Vehicle Health Dashboard")}</h1>
        </div>
        
        <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">{t("All Vehicles")}</TabsTrigger>
            <TabsTrigger value="critical" className="relative">
              {t("Critical Issues")}
              {criticalVehicles && criticalVehicles.length > 0 && (
                <Badge variant="destructive" className="ml-2">{criticalVehicles.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="attention" className="relative">
              {t("Needs Attention")}
              {attentionVehicles && attentionVehicles.length > 0 && (
                <Badge variant="secondary" className="ml-2">{attentionVehicles.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {healthDashboards?.map((dashboard) => (
                <VehicleHealthCard 
                  key={dashboard.id} 
                  dashboard={dashboard} 
                  onSelectCar={() => setSelectedCar(dashboard.carId)}
                  onRefresh={() => updateDashboard(dashboard.carId)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="critical">
            {isLoadingCritical ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : criticalVehicles && criticalVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {criticalVehicles.map((dashboard) => (
                  <VehicleHealthCard 
                    key={dashboard.id} 
                    dashboard={dashboard} 
                    onSelectCar={() => setSelectedCar(dashboard.carId)}
                    onRefresh={() => updateDashboard(dashboard.carId)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">{t("No vehicles with critical issues at the moment.")}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="attention">
            {isLoadingAttention ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : attentionVehicles && attentionVehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attentionVehicles.map((dashboard) => (
                  <VehicleHealthCard 
                    key={dashboard.id} 
                    dashboard={dashboard} 
                    onSelectCar={() => setSelectedCar(dashboard.carId)}
                    onRefresh={() => updateDashboard(dashboard.carId)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">{t("No vehicles needing attention at the moment.")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {selectedCar && (
          <ComponentsDialog 
            carId={selectedCar} 
            components={carComponents || []} 
            isLoading={isLoadingComponents}
            onOpenChange={(open) => {
              if (!open) setSelectedCar(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}

// Card for displaying vehicle health overview
function VehicleHealthCard({ 
  dashboard, 
  onSelectCar,
  onRefresh
}: { 
  dashboard: VehicleHealthDashboard, 
  onSelectCar: () => void,
  onRefresh: () => void
}) {
  const { t } = useLocalization();
  const status = dashboard.overallHealth.toLowerCase();
  
  // Format date for display
  const formattedDate = dashboard.lastUpdated 
    ? format(new Date(dashboard.lastUpdated), 'PPp')
    : t('Not available');
  
  return (
    <Card className={`border-2 ${healthStatusColors[status]}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              {dashboard.car?.make} {dashboard.car?.model} 
              <span className="ml-2 text-2xl">{healthStatusEmojis[status]}</span>
            </CardTitle>
            <CardDescription>{dashboard.car?.year} - {dashboard.car?.carId}</CardDescription>
          </div>
          <Badge variant={status === 'critical' ? 'destructive' : status === 'poor' ? 'outline' : 'secondary'}>
            {t(status.charAt(0).toUpperCase() + status.slice(1))}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-muted-foreground">{t("Health Score")}</span>
            <span className="text-sm font-medium">{dashboard.healthScore}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                dashboard.healthScore > 80 ? 'bg-green-500' : 
                dashboard.healthScore > 60 ? 'bg-blue-500' : 
                dashboard.healthScore > 40 ? 'bg-yellow-500' : 
                dashboard.healthScore > 20 ? 'bg-orange-500' : 
                'bg-red-500'
              }`} 
              style={{ width: `${dashboard.healthScore}%` }}
            />
          </div>
        </div>
        
        {dashboard.recommendations && dashboard.recommendations.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">{t("Recommendations")}:</h4>
            <ul className="text-sm space-y-1">
              {dashboard.recommendations.slice(0, 2).map((rec, i) => (
                <li key={i} className={`flex items-start ${rec.urgent ? 'text-destructive' : ''}`}>
                  {rec.urgent && <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />}
                  <span>{rec.recommendation}</span>
                </li>
              ))}
              {dashboard.recommendations.length > 2 && (
                <li className="text-muted-foreground">
                  +{dashboard.recommendations.length - 2} {t("more issues")}
                </li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch pt-2">
        <div className="flex justify-between items-center w-full text-xs text-muted-foreground mb-2">
          <span>{t("Updated")}: {formattedDate}</span>
          {dashboard.alerts > 0 && (
            <Badge variant="outline" className="text-xs bg-background">
              {dashboard.alerts} {dashboard.alerts === 1 ? t("alert") : t("alerts")}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1" onClick={onSelectCar}>
            {t("View Details")}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1" onClick={onRefresh}>
            {t("Refresh")}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Dialog for displaying component details
function ComponentsDialog({ 
  carId, 
  components,
  isLoading,
  onOpenChange
}: { 
  carId: number,
  components: VehicleHealthComponent[],
  isLoading: boolean,
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useLocalization();
  const [open, setOpen] = useState(true);
  
  // Group data by date for the chart
  const chartData = components.reduce((acc: Record<string, any>, component) => {
    const date = format(new Date(component.lastChecked), 'MMM d');
    if (!acc[date]) {
      acc[date] = { date, excellent: 0, good: 0, fair: 0, poor: 0, critical: 0 };
    }
    acc[date][component.status.toLowerCase()]++;
    return acc;
  }, {});
  
  const lineChartData = Object.values(chartData).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    onOpenChange(open);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {components[0]?.car ? 
              `${components[0].car.make} ${components[0].car.model} (${components[0].car.year})` : 
              t("Vehicle Components")}
          </DialogTitle>
          <DialogDescription>
            {t("Detailed health status of vehicle components")}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {components.length > 0 ? (
              <>
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">{t("Component Health History")}</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="excellent" 
                          stackId="1" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          name={t("Excellent")}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="good" 
                          stackId="1" 
                          stroke="#3b82f6" 
                          fill="#3b82f6" 
                          name={t("Good")}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="fair" 
                          stackId="1" 
                          stroke="#eab308" 
                          fill="#eab308" 
                          name={t("Fair")}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="poor" 
                          stackId="1" 
                          stroke="#f97316" 
                          fill="#f97316" 
                          name={t("Poor")}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="critical" 
                          stackId="1" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          name={t("Critical")}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">{t("Component Status")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {components.map((component) => {
                      const status = component.status.toLowerCase();
                      return (
                        <div 
                          key={component.id} 
                          className={`border rounded-lg p-4 ${healthStatusColors[status]}`}
                        >
                          <div className="flex justify-between mb-2">
                            <h4 className="font-medium flex items-center">
                              {component.componentName}
                              <span className="ml-2 text-xl">{healthStatusEmojis[status]}</span>
                            </h4>
                            <Badge variant={component.alertLevel > 0 ? "destructive" : "outline"}>
                              {component.alertLevel > 0 ? 
                                `${t("Alert")} ${component.alertLevel}` : 
                                t("Normal")}
                            </Badge>
                          </div>
                          {component.notes && (
                            <p className="text-sm mb-2">{component.notes}</p>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {t("Last checked")}: {format(new Date(component.lastChecked), 'PPp')}
                            {component.updatedByUser && (
                              <span> {t("by")} {component.updatedByUser.username}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{t("No health components recorded for this vehicle.")}</p>
              </div>
            )}
          </>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default VehicleHealthPage;