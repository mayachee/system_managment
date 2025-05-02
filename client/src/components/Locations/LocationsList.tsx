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
import { Icons } from "@/components/ui/icons";

interface Location {
  id: number;
  name: string;
  address: string;
}

interface LocationsListProps {
  locations: Location[];
  onEdit: (locationId: number) => void;
  onDelete: (locationId: number) => void;
}

export default function LocationsList({ 
  locations, 
  onEdit, 
  onDelete 
}: LocationsListProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length > 0 ? (
                locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Icons.location className="h-5 w-5" />
                        </div>
                        <div className="text-sm font-medium">
                          {location.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {location.address}
                      </div>
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
                              onEdit(location.id);
                            }}
                          >
                            <Icons.edit className="mr-2 h-4 w-4" />
                            <span>Edit location</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center text-destructive focus:text-destructive" 
                            onClick={(e) => {
                              e.preventDefault();
                              onDelete(location.id);
                            }}
                          >
                            <Icons.delete className="mr-2 h-4 w-4" />
                            <span>Delete location</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                    No locations found. Add a new location to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {locations.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{locations.length}</span> of{" "}
                  <span className="font-medium">{locations.length}</span> results
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
