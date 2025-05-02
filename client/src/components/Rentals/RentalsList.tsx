import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/ui/icons";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";

interface Rental {
  id: number;
  userId: number;
  carId: number;
  startDate: string;
  endDate: string;
  status: string;
  car: {
    id: number;
    make: string;
    model: string;
    year: number;
    carId: string;
    status: string;
  };
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface RentalsListProps {
  rentals: Rental[];
  isAdmin: boolean;
  onEdit: (rentalId: number) => void;
  onDelete: (rentalId: number) => void;
  onComplete: (rentalId: number) => void;
}

export default function RentalsList({ 
  rentals, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onComplete 
}: RentalsListProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  
  const filteredRentals = rentals.filter(rental => {
    return statusFilter === "all" || rental.status === statusFilter;
  });
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PP");
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "completed":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };
  
  return (
    <Card className="shadow-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="status-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rental Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRentals.length > 0 ? (
                filteredRentals.map((rental) => (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {rental.car.make} {rental.car.model} ({rental.car.year})
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {rental.car.carId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {rental.user.username}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {rental.user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(rental.startDate)} - {formatDate(rental.endDate)}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {(() => {
                          const start = new Date(rental.startDate);
                          const end = new Date(rental.endDate);
                          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                          return `${days} ${days === 1 ? 'day' : 'days'}`;
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(rental.status)}>
                        {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Icons.more className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center" 
                            onClick={(e) => {
                              e.preventDefault();
                              onEdit(rental.id);
                            }}
                          >
                            <Icons.edit className="mr-2 h-4 w-4" />
                            <span>Edit rental</span>
                          </DropdownMenuItem>
                          
                          {rental.status === "active" && (
                            <DropdownMenuItem 
                              className="flex items-center" 
                              onClick={(e) => {
                                e.preventDefault();
                                onComplete(rental.id);
                              }}
                            >
                              <Icons.check className="mr-2 h-4 w-4" />
                              <span>Mark as completed</span>
                            </DropdownMenuItem>
                          )}
                          
                          {isAdmin && (
                            <DropdownMenuItem 
                              className="flex items-center text-destructive focus:text-destructive" 
                              onClick={(e) => {
                                e.preventDefault();
                                onDelete(rental.id);
                              }}
                            >
                              <Icons.delete className="mr-2 h-4 w-4" />
                              <span>Delete rental</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                    No rentals found. Create a new rental to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredRentals.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredRentals.length}</span> of{" "}
                  <span className="font-medium">{rentals.length}</span> results
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
