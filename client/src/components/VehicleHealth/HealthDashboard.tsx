import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertTriangle, BarChart3, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocalization } from '@/hooks/use-localization';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Health status emoji mapping
const healthStatusEmojis: Record<string, string> = {
  excellent: '😀',
  good: '🙂',
  fair: '😐',
  poor: '🙁',
  critical: '😨'
};

// Health status color mapping
const healthStatusColors: Record<string, string> = {
  excellent: 'bg-green-100 text-green-800 border-green-300',
  good: 'bg-blue-100 text-blue-800 border-blue-300',
  fair: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  poor: 'bg-orange-100 text-orange-800 border-orange-300',
  critical: 'bg-red-100 text-red-800 border-red-300'
};

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

interface HealthDashboardProps {
  highlightCritical?: boolean;
}

export function HealthDashboard({ highlightCritical }: HealthDashboardProps) {
  const { t } = useLocalization();
  const { toast } = useToast();
  
  // Fetch dashboard data
  const { 
    data: dashboards = [], 
    isLoading,
    error,
    isRefetching
  } = useQuery<VehicleHealthDashboard[]>({ 
    queryKey: highlightCritical 
      ? ['/api/vehicle-health/critical'] 
      : ['/api/vehicle-health/dashboards'],
    refetchInterval: highlightCritical ? 30000 : 60000, // Refresh more often for critical
  });
  
  // Handle refresh button click
  const handleRefresh = async () => {
    try {
      // Update all dashboards
      const carIds = dashboards.map(dashboard => dashboard.carId);
      for (const carId of carIds) {
        await apiRequest('POST', `/api/vehicle-health/dashboard/update/${carId}`);
      }
      
      // Invalidate all health-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/critical'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-health/needs-attention'] });
      
      toast({
        title: t("Dashboards Updated"),
        description: t("Vehicle health data has been refreshed."),
        variant: "default",
      });
    } catch (error) {
      console.error("Error refreshing dashboards:", error);
      toast({
        title: t("Refresh Failed"),
        description: t("Failed to refresh vehicle health data. Please try again."),
        variant: "destructive",
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
        <p className="text-red-700">{t("Failed to load health data. Please try again.")}</p>
      </div>
    );
  }
  
  // Empty state
  if (dashboards.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">
          {highlightCritical 
            ? t("No Critical Issues") 
            : t("No Vehicle Health Data")}
        </h3>
        <p className="text-muted-foreground mb-4">
          {highlightCritical 
            ? t("All vehicles are in good condition. No critical issues detected.") 
            : t("Start tracking your vehicles' health by adding components.")}
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">
          {highlightCritical 
            ? t("Critical Vehicles") 
            : t("Vehicle Health Overview")}
        </h2>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          {t("Refresh")}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboards.map((dashboard) => {
          const status = dashboard.overallHealth.toLowerCase();
          const formattedDate = dashboard.lastUpdated 
            ? format(new Date(dashboard.lastUpdated), 'PPp')
            : t('Not available');
            
          return (
            <Card 
              key={dashboard.id} 
              className={`border-2 ${healthStatusColors[status]}`}
            >
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
              <CardContent>
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
                
                {dashboard.recommendations && dashboard.recommendations.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">{t("Issues")}:</h4>
                    <ul className="text-sm space-y-1">
                      {dashboard.recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className={`flex items-start ${rec.urgent ? 'text-destructive' : ''}`}>
                          {rec.urgent && <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" />}
                          <span>{rec.recommendation}</span>
                        </li>
                      ))}
                      {dashboard.recommendations.length > 3 && (
                        <li className="text-muted-foreground">
                          +{dashboard.recommendations.length - 3} {t("more issues")}
                        </li>
                      )}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-muted-foreground">
                    {t("No issues detected with this vehicle.")}
                  </div>
                )}
                
                <div className="mt-4 text-xs text-muted-foreground">
                  {t("Last updated")}: {formattedDate}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default HealthDashboard;