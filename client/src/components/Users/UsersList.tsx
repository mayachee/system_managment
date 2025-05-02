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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface UsersListProps {
  users: User[];
  onEdit: (userId: number) => void;
  onDelete: (userId: number) => void;
  currentUserId: number | undefined;
}

export default function UsersList({ 
  users, 
  onEdit, 
  onDelete,
  currentUserId
}: UsersListProps) {
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  
  const handleDeleteClick = (userId: number) => {
    setUserToDelete(userId);
  };
  
  const confirmDelete = () => {
    if (userToDelete) {
      onDelete(userToDelete);
      setUserToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setUserToDelete(null);
  };
  
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };
  
  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };
  
  const isSelf = (userId: number) => userId === currentUserId;

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
                            <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{user.username}</div>
                          {isSelf(user.id) && (
                            <Badge variant="outline" className="ml-2">You</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role === "admin" ? "Administrator" : "User"}
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
                                onEdit(user.id);
                              }}
                            >
                              <Icons.edit className="mr-2 h-4 w-4" />
                              <span>Edit user</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              className="flex items-center text-destructive focus:text-destructive" 
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteClick(user.id);
                              }}
                              disabled={isSelf(user.id)} // Can't delete yourself
                            >
                              <Icons.delete className="mr-2 h-4 w-4" />
                              <span>Delete user</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                      No users found. Add a new user to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {users.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    Showing <span className="font-medium">1</span> to <span className="font-medium">{users.length}</span> of{" "}
                    <span className="font-medium">{users.length}</span> results
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={userToDelete !== null} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
