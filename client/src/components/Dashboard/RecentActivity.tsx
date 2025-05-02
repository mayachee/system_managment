import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { format } from "date-fns";
import { Link } from "wouter";

interface Activity {
  id: string;
  type: string;
  timestamp: string;
  user?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
  car?: {
    id: number;
    make: string;
    model: string;
    year: number;
    carId: string;
    status: string;
  };
  status?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string, status?: string) => {
    if (type === "login") {
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
          <Icons.user className="h-5 w-5" />
        </div>
      );
    }
    
    if (type === "rental") {
      if (status === "active") {
        return (
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/60 flex items-center justify-center text-green-600 dark:text-green-400 flex-shrink-0">
            <Icons.car className="h-5 w-5" />
          </div>
        );
      }
      
      if (status === "completed") {
        return (
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Icons.check className="h-5 w-5" />
          </div>
        );
      }
      
      return (
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
          <Icons.calendar className="h-5 w-5" />
        </div>
      );
    }
    
    // Default icon
    return (
      <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-400 flex-shrink-0">
        <Icons.time className="h-5 w-5" />
      </div>
    );
  };
  
  const getActivityTitle = (activity: Activity) => {
    if (activity.type === "login") {
      return `User login: ${activity.user?.username}`;
    }
    
    if (activity.type === "rental") {
      if (activity.status === "active") {
        return "New rental created";
      }
      
      if (activity.status === "completed") {
        return "Rental completed";
      }
      
      return "Rental updated";
    }
    
    return "Activity";
  };
  
  const getActivityDescription = (activity: Activity) => {
    if (activity.type === "login") {
      return `${activity.user?.email} (${activity.user?.role})`;
    }
    
    if (activity.type === "rental" && activity.car) {
      return `${activity.car.make} ${activity.car.model} (ID: ${activity.car.carId})`;
    }
    
    return "";
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return "Just now";
    }
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
    }
    
    return format(date, "MMM d, yyyy");
  };

  return (
    <Card className="shadow-sm">
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Link href="/rentals">
          <a className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            View all
          </a>
        </Link>
      </div>
      <CardContent className="p-6">
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                {getActivityIcon(activity.type, activity.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getActivityTitle(activity)}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                    {getActivityDescription(activity)}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
              No recent activity to display
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
