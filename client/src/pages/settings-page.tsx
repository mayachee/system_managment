import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useLocalization } from "@/hooks/use-localization";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { 
  MoonIcon, 
  SunIcon, 
  Globe, 
  Bell, 
  Clock, 
  Shield, 
  UserCog, 
  Smartphone, 
  Mail, 
  Calendar, 
  BellRing,
  LanguagesIcon,
  Settings2,
  Zap,
  AlertTriangle,
  Download,
  Trash2,
} from "lucide-react";
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
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ActiveMeTheme } from "@/components/ActiveMeTheme";
import { Link } from "wouter";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { 
    theme, 
    setTheme, 
    autoThemeSwitching, 
    toggleAutoThemeSwitching 
  } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [rentalReminders, setRentalReminders] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Get localization from hook
  const { language: appLanguage, setLanguage: setAppLanguage, availableLanguages, t } = useLocalization();
  
  // Appearance settings
  const [language, setLanguage] = useState<string>(appLanguage);
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");
  
  // Security settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [passwordLastChanged, setPasswordLastChanged] = useState(
    new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleDateString()
  );
  
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
      <div className="space-y-6 pb-8">
        {/* Page header */}
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="mt-1 text-muted-foreground">
            {t('settings.accountInfo')}
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-1.5">
              <UserCog className="h-4 w-4" />
              <span>{t('settings.general')}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1.5">
              <Bell className="h-4 w-4" />
              <span>{t('settings.notifications')}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1.5">
              <Settings2 className="h-4 w-4" />
              <span>{t('settings.appearance')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span>{t('settings.security')}</span>
            </TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    <CardTitle>Account Information</CardTitle>
                  </div>
                  <CardDescription>
                    View and update your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={user?.username || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} readOnly />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Account Type</Label>
                      <div className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-1 text-sm shadow-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          {user?.role === "admin" ? (
                            <>
                              <Shield className="h-4 w-4 text-primary" />
                              <span className="font-medium">Administrator</span>
                            </>
                          ) : (
                            <>
                              <UserCog className="h-4 w-4 text-primary" />
                              <span>Standard User</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => logoutMutation.mutate()} 
                    disabled={logoutMutation.isPending}
                  >
                    Sign Out
                  </Button>
                  <Button asChild>
                    <Link href="/profile">
                      <Icons.edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            
              {isAdmin && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <CardTitle>System Settings</CardTitle>
                    </div>
                    <CardDescription>
                      Configure system-wide settings (Admin only)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="space-y-0.5">
                          <Label className="text-base">Registration</Label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-normal">Enable public registration</Label>
                          <p className="text-xs text-muted-foreground">
                            Allow users to create accounts without admin approval
                          </p>
                        </div>
                        <Switch checked={true} />
                      </div>
                    </div>
                    
                    <div className="border-b pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="space-y-0.5">
                          <Label className="text-base">System Status</Label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-normal">Maintenance mode</Label>
                          <p className="text-xs text-muted-foreground">
                            Put the system in maintenance mode
                          </p>
                        </div>
                        <Switch checked={false} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-normal">Enable debug logging</Label>
                          <p className="text-xs text-muted-foreground">
                            Record detailed logs for troubleshooting
                          </p>
                        </div>
                        <Switch checked={false} />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button onClick={saveSettings}>
                      Save System Settings
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 pt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BellRing className="h-5 w-5 text-primary" />
                  <CardTitle>Notification Preferences</CardTitle>
                </div>
                <CardDescription>
                  Manage how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="border-b pb-6 space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Notifications
                    </h3>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Rental updates</Label>
                        <p className="text-xs text-muted-foreground">
                          Status changes to your rentals
                        </p>
                      </div>
                      <Switch checked={true} disabled={!emailNotifications} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Security alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Login attempts and account changes
                        </p>
                      </div>
                      <Switch checked={true} disabled={!emailNotifications} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Marketing emails</Label>
                        <p className="text-xs text-muted-foreground">
                          Promotional offers and updates
                        </p>
                      </div>
                      <Switch 
                        checked={marketingEmails} 
                        onCheckedChange={setMarketingEmails}
                        disabled={!emailNotifications}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-b pb-6 space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      SMS Notifications
                    </h3>
                    <Switch 
                      checked={smsNotifications} 
                      onCheckedChange={setSmsNotifications} 
                    />
                  </div>
                  
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Rental updates</Label>
                        <p className="text-xs text-muted-foreground">
                          Status changes to your rentals
                        </p>
                      </div>
                      <Switch checked={true} disabled={!smsNotifications} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Security alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Login attempts and account changes
                        </p>
                      </div>
                      <Switch checked={true} disabled={!smsNotifications} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Scheduling & Reminders
                    </h3>
                    <Switch 
                      checked={rentalReminders} 
                      onCheckedChange={setRentalReminders} 
                    />
                  </div>
                  
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Upcoming rentals</Label>
                        <p className="text-xs text-muted-foreground">
                          Remind you 24 hours before pickup
                        </p>
                      </div>
                      <Switch checked={true} disabled={!rentalReminders} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Return reminders</Label>
                        <p className="text-xs text-muted-foreground">
                          Remind you 24 hours before return date
                        </p>
                      </div>
                      <Switch checked={true} disabled={!rentalReminders} />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-normal">Maintenance alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify about maintenance status changes
                        </p>
                      </div>
                      <Switch checked={false} disabled={!rentalReminders} />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end">
                <Button onClick={saveSettings}>
                  Save Notification Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <SunIcon className="h-5 w-5 text-primary" />
                    <CardTitle>Theme & Display</CardTitle>
                  </div>
                  <CardDescription>
                    Customize how the application looks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Theme Mode</Label>
                      <p className="text-sm text-muted-foreground">
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
                        <Label>Quick theme toggle</Label>
                        <p className="text-sm text-muted-foreground">
                          Switch between light and dark themes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SunIcon className="h-5 w-5 text-muted-foreground" />
                        <Switch 
                          checked={theme === "dark" || (theme === "system" && window.matchMedia('(prefers-color-scheme: dark)').matches)} 
                          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                        />
                        <MoonIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Advanced Theme Features */}
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium mb-3">Advanced Theme Features</h3>
                    
                    {/* Auto Theme Switching Feature */}
                    <div className="p-4 border rounded-lg bg-neutral-50 mb-4">
                      <h3 className="text-md font-medium mb-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        Time-Based Theme
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Automatically adjusts theme based on time of day
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            Light mode (day) and dark mode (evening)
                          </p>
                        </div>
                        <Switch 
                          checked={autoThemeSwitching}
                          onCheckedChange={toggleAutoThemeSwitching}
                        />
                      </div>
                    </div>
                    
                    {/* Active Me Theme Feature */}
                    <div className="p-4 border rounded-lg bg-neutral-50">
                      <h3 className="text-md font-medium mb-1 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        Activity-Based Theme
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Adapts theme to your activity level
                      </p>
                      
                      {/* Use ActiveMeTheme component */}
                      <ActiveMeTheme />
                    </div>
                  </div>
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <LanguagesIcon className="h-5 w-5 text-primary" />
                    <CardTitle>{t('settings.language')}</CardTitle>
                  </div>
                  <CardDescription>
                    {t('settings.appearance')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="language" className="text-base">{t('settings.language')}</Label>
                    <Select 
                      value={language} 
                      onValueChange={(value) => {
                        setLanguage(value);
                        // Sync with the app's language context
                        if (value === "en" || value === "fr" || value === "es" || value === "ar") {
                          setAppLanguage(value as "en" | "fr" | "es" | "ar");
                        }
                      }}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder={t('app.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {t(`language.${lang.value === 'en' ? 'english' : 
                               lang.value === 'fr' ? 'french' : 
                               lang.value === 'es' ? 'spanish' : 'arabic'}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="date-format" className="text-base">{t('settings.dateFormat')}</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger id="date-format">
                        <SelectValue placeholder={t('app.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (Europe/Asia)</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (ISO)</SelectItem>
                        <SelectItem value="YYYY/MM/DD">YYYY/MM/DD (Japan/Korea)</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('app.example')}: {
                        dateFormat === "MM/DD/YYYY" ? "05/03/2025" :
                        dateFormat === "DD/MM/YYYY" ? "03/05/2025" :
                        dateFormat === "YYYY-MM-DD" ? "2025-05-03" :
                        "2025/05/03"
                      }
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="time-format" className="text-base">{t('settings.timeFormat')}</Label>
                    <Select value={timeFormat} onValueChange={setTimeFormat}>
                      <SelectTrigger id="time-format">
                        <SelectValue placeholder={t('app.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">{t('settings.timeFormat12h')} (AM/PM)</SelectItem>
                        <SelectItem value="24h">{t('settings.timeFormat24h')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground mt-1">
                      {t('app.example')}: {
                        timeFormat === "12h" ? "3:30 PM" : "15:30"
                      }
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={saveSettings}>
                    {t('app.save')}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Security Tab (New) */}
          <TabsContent value="security" className="space-y-6 pt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Account Security</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your password and security settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Password Management</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        Change Password
                      </Button>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-2">
                      <div className="flex justify-between">
                        <span>Password last changed</span>
                        <span>{passwordLastChanged}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Password strength</span>
                        <span className="font-medium text-green-600">Strong</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-b pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <Label className="text-base">Two-Factor Authentication</Label>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch 
                        checked={twoFactorEnabled} 
                        onCheckedChange={setTwoFactorEnabled} 
                      />
                    </div>
                    
                    {!twoFactorEnabled && (
                      <Alert className="bg-sky-50 border-sky-200 text-sky-800">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Enhanced security recommended</AlertTitle>
                        <AlertDescription>
                          Enable two-factor authentication for better protection
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <Label className="text-base">Session Management</Label>
                        <p className="text-sm text-muted-foreground">
                          Control your login sessions
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="session-timeout">Session timeout (minutes)</Label>
                        <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                          <SelectTrigger id="session-timeout">
                            <SelectValue placeholder="Select timeout period" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        Log Out of All Other Devices
                      </Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end">
                  <Button onClick={saveSettings}>
                    {t('app.save')}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    <CardTitle>Privacy & Data</CardTitle>
                  </div>
                  <CardDescription>
                    Manage your data and privacy preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-b pb-4">
                    <h3 className="font-medium mb-3">Data Collection</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-normal">Usage analytics</Label>
                          <p className="text-xs text-muted-foreground">
                            Help us improve by sharing anonymous usage data
                          </p>
                        </div>
                        <Switch checked={true} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="font-normal">Personalization</Label>
                          <p className="text-xs text-muted-foreground">
                            Get personalized recommendations based on your activity
                          </p>
                        </div>
                        <Switch checked={true} />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-3">Data Management</h3>
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" className="justify-start">
                        <Download className="mr-2 h-4 w-4" />
                        Download My Data
                      </Button>
                      
                      <Button variant="outline" className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}