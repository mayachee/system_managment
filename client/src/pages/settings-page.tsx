import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { MoonIcon, SunIcon, Globe, Bell, Key, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ActiveMeTheme } from "@/components/ActiveMeTheme";

export default function SettingsPage() {
  const { user } = useAuth();
  const { 
    theme, 
    setTheme, 
    autoThemeSwitching, 
    toggleAutoThemeSwitching 
  } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Example notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [rentalReminders, setRentalReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Example appearance settings
  const [language, setLanguage] = useState("en");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  
  const isAdmin = user?.role === "admin";
  
  const saveSettings = () => {
    // In a real app, this would call an API to save the settings
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully.",
    });
  };
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View and update your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={user?.username || ""} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} readOnly />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" value={user?.role === "admin" ? "Administrator" : "User"} readOnly />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => window.location.href = "/profile"}>
                  <Icons.edit className="mr-2 h-4 w-4" />
                  Go to Profile
                </Button>
              </CardFooter>
            </Card>
            
            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure system-wide settings (Admin only)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable public registration</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Allow users to create accounts without admin approval
                      </p>
                    </div>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance mode</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Put the system in maintenance mode
                      </p>
                    </div>
                    <Switch checked={false} />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={saveSettings}>
                    Save System Settings
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={emailNotifications} 
                    onCheckedChange={setEmailNotifications} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Receive notifications via text message
                    </p>
                  </div>
                  <Switch 
                    checked={smsNotifications} 
                    onCheckedChange={setSmsNotifications} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rental Reminders</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Get reminders about upcoming and overdue rentals
                    </p>
                  </div>
                  <Switch 
                    checked={rentalReminders} 
                    onCheckedChange={setRentalReminders} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Receive promotional offers and updates
                    </p>
                  </div>
                  <Switch 
                    checked={marketingEmails} 
                    onCheckedChange={setMarketingEmails} 
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Theme & Display</CardTitle>
                <CardDescription>
                  Customize how the application looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme Mode</Label>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Choose your preferred theme or use system settings
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <Button 
                        variant={theme === "light" ? "default" : "outline"} 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setTheme("light")}
                      >
                        <SunIcon className="h-4 w-4" />
                        Light
                      </Button>
                      
                      <Button 
                        variant={theme === "dark" ? "default" : "outline"} 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setTheme("dark")}
                      >
                        <MoonIcon className="h-4 w-4" />
                        Dark
                      </Button>
                      
                      <Button 
                        variant={theme === "system" ? "default" : "outline"} 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setTheme("system")}
                      >
                        <Globe className="h-4 w-4" />
                        System
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label>Dark mode toggle</Label>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Quickly switch between light and dark themes
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SunIcon className="h-5 w-5 text-neutral-500" />
                      <Switch 
                        checked={theme === "dark" || (theme === "system" && window.matchMedia('(prefers-color-scheme: dark)').matches)} 
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                      />
                      <MoonIcon className="h-5 w-5 text-neutral-500" />
                    </div>
                  </div>
                  
                  {/* Auto Theme Switching Feature */}
                  <div className="pt-4">
                    <div className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Time-Based Theme
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                        Automatically adjusts your theme based on the time of day. Uses light mode during
                        daytime for better productivity, and dark mode in the evening to reduce eye strain.
                      </p>
                      
                      <div className="p-3 bg-sky-50 dark:bg-sky-900/30 rounded-lg border border-sky-100 dark:border-sky-900 mb-4">
                        <p className="text-sm text-sky-700 dark:text-sky-300 flex items-start">
                          <span className="mr-2 mt-0.5"><Clock className="h-4 w-4" /></span>
                          <span>
                            <span className="font-medium">Time-based theme schedule:</span>
                            <br />
                            5AM-8AM: Light mode (helps wake up)
                            <br />
                            8AM-5PM: Light mode (productivity)
                            <br />
                            5PM-7PM: Light mode (evening transition)
                            <br />
                            7PM-10PM: Dark mode (evening wind down)
                            <br />
                            10PM-5AM: Dark mode (better sleep quality)
                          </span>
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-medium">Auto Theme Switching</Label>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Automatically switch themes based on time of day
                          </p>
                        </div>
                        <Switch 
                          checked={autoThemeSwitching}
                          onCheckedChange={toggleAutoThemeSwitching}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Me Theme Feature */}
                  <div className="pt-4">
                    <div className="p-4 border rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        Active Me Theme
                      </h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                        Smart theme that adapts to your activity level. Switches to dark mode during periods 
                        of low activity to reduce eye strain, and to light mode during high activity for better visibility.
                      </p>
                      
                      {/* Import the ActiveMeTheme component to handle the settings */}
                      <div className="mt-3">
                        <ActiveMeTheme />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger id="time-format">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={saveSettings}>
                  Save Display Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}