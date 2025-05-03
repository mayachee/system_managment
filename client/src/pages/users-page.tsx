import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import UsersList from "@/components/Users/UsersList";
import UserForm from "@/components/Users/UserForm";
import LoginHistory from "@/components/Users/LoginHistory";
import { AddUserButton } from "@/components/Users/AddUserButton";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { InsertUser } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  
  const isAdmin = user?.role === "admin";
  
  const { 
    data: users, 
    isLoading: isLoadingUsers,
    error: usersError
  } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const { 
    data: loginHistory, 
    isLoading: isLoadingHistory,
    error: historyError
  } = useQuery({
    queryKey: ["/api/login-history"],
  });
  
  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertUser> }) => {
      const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setSelectedUserId(null);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddNew = () => {
    setSelectedUserId(null);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (userId: number) => {
    setSelectedUserId(userId);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (userId: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  const handleFormSubmit = (data: InsertUser) => {
    if (selectedUserId) {
      updateUserMutation.mutate({ id: selectedUserId, data });
    } else {
      createUserMutation.mutate(data);
    }
  };
  
  const filteredUsers = users?.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });
  
  // Non-admin users should not access this page
  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              You do not have permission to access this page. Only administrators can manage users.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              Manage users and track login history
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-10 pr-4 py-2 w-full md:w-64 rounded-md"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <AddUserButton />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 w-full max-w-[400px]">
            <TabsTrigger value="users" className="flex-1">Users</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Login History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-6">
            {usersError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was an error loading the users data. Please try refreshing.
                </AlertDescription>
              </Alert>
            )}
            
            {isLoadingUsers ? (
              <Skeleton className="h-[500px] w-full" />
            ) : (
              <UsersList 
                users={filteredUsers || []} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                currentUserId={user?.id}
              />
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            {historyError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was an error loading the login history data. Please try refreshing.
                </AlertDescription>
              </Alert>
            )}
            
            {isLoadingHistory ? (
              <Skeleton className="h-[500px] w-full" />
            ) : (
              <LoginHistory loginHistory={loginHistory || []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUserId ? "Edit User" : "Add New User"}
            </DialogTitle>
            <DialogDescription>
              {selectedUserId 
                ? "Update the user details below" 
                : "Fill in the user details below to create a new user account"
              }
            </DialogDescription>
          </DialogHeader>
          
          <UserForm 
            onSubmit={handleFormSubmit}
            userId={selectedUserId}
            isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
            currentUserId={user?.id}
          />
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
