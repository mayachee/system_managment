import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, Shield, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CarInsuranceCardProps {
  insurance: {
    id: number;
    policyNumber: string;
    provider: string;
    coverageType: string;
    premium: number;
    startDate: string;
    endDate: string;
    deductible: number;
    coverageLimit: number;
    carId: number;
    car?: {
      id: number;
      make: string;
      model: string;
      year: number;
      carId: string;
    };
  };
  onEdit?: (insurance: any) => void;
  onDelete?: (id: number) => void;
  isAdmin?: boolean;
}

export default function CarInsuranceCard({ insurance, onEdit, onDelete, isAdmin = false }: CarInsuranceCardProps) {
  const isActive = new Date(insurance.endDate) > new Date();
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit(insurance);
    }
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete(insurance.id);
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 pt-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              {insurance.policyNumber}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {insurance.provider}
            </CardDescription>
          </div>
          <Badge variant={isActive ? "default" : "destructive"} className="text-xs">
            {isActive ? "Active" : "Expired"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage Type:</span>
            <span className="font-medium">{insurance.coverageType}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Premium:</span>
            <span className="font-medium">{formatCurrency(insurance.premium)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deductible:</span>
            <span className="font-medium">{formatCurrency(insurance.deductible)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage Limit:</span>
            <span className="font-medium">{formatCurrency(insurance.coverageLimit)}</span>
          </div>
          
          {insurance.car && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Car:</span>
              <span className="font-medium">
                {insurance.car.make} {insurance.car.model} ({insurance.car.year})
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3 mr-1" />
              <span>
                {new Date(insurance.startDate).toLocaleDateString()} - {new Date(insurance.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      
      {isAdmin && (
        <CardFooter className="pt-2 flex justify-end gap-2 border-t bg-muted/20">
          <Button variant="ghost" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}