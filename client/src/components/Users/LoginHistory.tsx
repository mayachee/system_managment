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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { format } from "date-fns";
import { Clock, User } from "lucide-react";

interface LoginRecord {
  id: number;
  userId: number;
  timestamp: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

interface LoginHistoryProps {
  loginHistory: LoginRecord[];
}

export default function LoginHistory({ loginHistory }: LoginHistoryProps) {
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  
  const uniqueUsers = Array.from(new Set(loginHistory.map(record => record.user?.username)))
    .filter(Boolean)
    .sort();
  
  const filteredHistory = loginHistory.filter(record => {
    const matchesUser = userFilter === "all" || record.user?.username === userFilter;
    
    let matchesDate = true;
    const recordDate = new Date(record.timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    if (dateFilter === "today") {
      matchesDate = recordDate >= today;
    } else if (dateFilter === "yesterday") {
      matchesDate = recordDate >= yesterday && recordDate < today;
    } else if (dateFilter === "week") {
      matchesDate = recordDate >= weekAgo;
    } else if (dateFilter === "month") {
      matchesDate = recordDate >= monthAgo;
    }
    
    return matchesUser && matchesDate;
  });
  
  const formatDateTime = (timestamp: string) => {
    return format(new Date(timestamp), "PPpp");
  };
  
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const loginTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - loginTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
    }
    
    return format(loginTime, "PP");
  };
  
  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || "?";
  };
  
  const getRoleBadgeVariant = (role: string) => {
    return role === "admin" ? "default" : "secondary";
  };

  return (
    <Card className="shadow-sm">
      <div className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-neutral-200 dark:border-neutral-700 mb-0">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="user-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              User
            </label>
            <Select
              value={userFilter}
              onValueChange={setUserFilter}
            >
              <SelectTrigger id="user-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((username) => (
                  <SelectItem key={username} value={username}>
                    {username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full sm:w-auto">
            <label htmlFor="date-filter" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Time Period
            </label>
            <Select
              value={dateFilter}
              onValueChange={setDateFilter}
            >
              <SelectTrigger id="date-filter" className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <CardContent className="p-0 pt-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Login Time</TableHead>
                <TableHead>Relative Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                          <AvatarFallback>{getInitials(record.user?.username)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{record.user?.username}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            {record.user?.email}
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(record.user?.role)}>
                          {record.user?.role === "admin" ? "Administrator" : "User"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        {formatDateTime(record.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatRelativeTime(record.timestamp)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-6 text-neutral-500 dark:text-neutral-400">
                    No login history found matching the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {filteredHistory.length > 0 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex-1 flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredHistory.length}</span> of{" "}
                  <span className="font-medium">{loginHistory.length}</span> login records
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
