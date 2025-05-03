import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/hooks/use-auth";
import { useLocalization } from "@/hooks/use-localization";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Percent, Users, Award, Gift, Calendar, ArrowUpCircle, RefreshCw, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { DataTable } from "@/components/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// Types for loyalty program data
type Tier = {
  name: string;
  minimumPoints: number;
  benefits: string[];
  discountPercentage: number;
  color: string;
};

type RedemptionRule = {
  pointsRequired: number;
  rewardDescription: string;
  value: number;
};

type LoyaltyProgram = {
  id: number;
  name: string;
  description: string;
  pointsPerDollar: number;
  createdAt: string;
  active: boolean;
  tiers: Tier[];
  redemptionRules: RedemptionRule[];
};

type LoyaltyPointsRecord = {
  id: number;
  userId: number;
  programId: number;
  points: number;
  tier: string;
  joinDate: string;
  lastActivity: string | null;
  expiryDate: string | null;
  program: {
    id: number;
    name: string;
    description: string;
    pointsPerDollar: number;
    active: boolean;
    tiers: Tier[];
  };
};

type PointsTransaction = {
  transaction: {
    id: number;
    loyaltyPointsId: number;
    transactionType: "earn" | "redeem" | "expire" | "bonus";
    points: number;
    transactionDate: string;
    sourceId: number | null;
    sourceType: string | null;
    description: string | null;
  };
  loyaltyPoints: {
    id: number;
    userId: number;
    programId: number;
    tier: string;
  };
  program: {
    name: string;
  };
};

type ProgramUser = {
  loyaltyPoints: {
    id: number;
    userId: number;
    programId: number;
    points: number;
    tier: string;
    joinDate: string;
    lastActivity: string | null;
    expiryDate: string | null;
  };
  user: {
    id: number;
    username: string;
    email: string;
  };
};

type ProgramStats = {
  programId: number;
  programName: string;
  memberCount: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalActivePoints: number;
  redemptionRate: number;
  membershipByTier: Array<{
    tier: string;
    count: number;
  }>;
};

// Columns for the members data table
const membersColumns: ColumnDef<ProgramUser>[] = [
  {
    accessorKey: "user.username",
    header: "Username",
  },
  {
    accessorKey: "user.email",
    header: "Email",
  },
  {
    accessorKey: "loyaltyPoints.points",
    header: "Points",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.loyaltyPoints?.points?.toLocaleString() || '0'}
      </span>
    ),
  },
  {
    accessorKey: "loyaltyPoints.tier",
    header: "Tier",
    cell: ({ row }) => {
      const tier = row.original.loyaltyPoints?.tier || 'None';
      let color = "bg-gray-100 text-gray-800";
      
      if (tier && typeof tier === 'string') {
        switch (tier.toLowerCase()) {
          case "bronze":
            color = "bg-amber-100 text-amber-800";
            break;
          case "silver":
            color = "bg-slate-100 text-slate-800";
            break;
          case "gold":
            color = "bg-yellow-100 text-yellow-800";
            break;
          case "platinum":
            color = "bg-indigo-100 text-indigo-800";
            break;
          case "diamond":
            color = "bg-cyan-100 text-cyan-800";
            break;
        }
      }
      
      return (
        <Badge className={color} variant="outline">
          {tier}
        </Badge>
      );
    },
  },
  {
    accessorKey: "loyaltyPoints.joinDate",
    header: "Joined",
    cell: ({ row }) => row.original.loyaltyPoints?.joinDate ? new Date(row.original.loyaltyPoints.joinDate).toLocaleDateString() : 'N/A',
  },
  {
    accessorKey: "loyaltyPoints.lastActivity",
    header: "Last Active",
    cell: ({ row }) => {
      const lastActivity = row.original.loyaltyPoints?.lastActivity;
      return lastActivity ? new Date(lastActivity).toLocaleDateString() : "Never";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm">
          View Details
        </Button>
        <Button variant="ghost" size="sm">
          Edit Tier
        </Button>
      </div>
    ),
  },
];

// Columns for transactions table
const transactionsColumns: ColumnDef<PointsTransaction>[] = [
  {
    accessorKey: "transaction.transactionDate",
    header: "Date",
    cell: ({ row }) => row.original.transaction?.transactionDate ? new Date(row.original.transaction.transactionDate).toLocaleDateString() : 'N/A',
  },
  {
    accessorKey: "transaction.transactionType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.transaction?.transactionType;
      let badge;
      
      if (!type) {
        return <Badge variant="outline">Unknown</Badge>;
      }
      
      switch (type) {
        case "earn":
          badge = <Badge className="bg-green-100 text-green-800" variant="outline">Earned</Badge>;
          break;
        case "redeem":
          badge = <Badge className="bg-blue-100 text-blue-800" variant="outline">Redeemed</Badge>;
          break;
        case "expire":
          badge = <Badge className="bg-red-100 text-red-800" variant="outline">Expired</Badge>;
          break;
        case "bonus":
          badge = <Badge className="bg-purple-100 text-purple-800" variant="outline">Bonus</Badge>;
          break;
        default:
          badge = <Badge variant="outline">{type}</Badge>;
      }
      
      return badge;
    },
  },
  {
    accessorKey: "transaction.points",
    header: "Points",
    cell: ({ row }) => {
      const type = row.original.transaction?.transactionType;
      const points = row.original.transaction?.points;
      
      if (!points) {
        return <span>0</span>;
      }
      
      if (type === "earn" || type === "bonus") {
        return <span className="text-green-600 font-medium">+{points}</span>;
      } else {
        return <span className="text-red-600 font-medium">-{points}</span>;
      }
    },
  },
  {
    accessorKey: "program.name",
    header: "Program",
  },
  {
    accessorKey: "transaction.description",
    header: "Description",
    cell: ({ row }) => row.original.transaction?.description || "-",
  },
  {
    accessorKey: "transaction.sourceType",
    header: "Source",
    cell: ({ row }) => {
      const sourceType = row.original.transaction?.sourceType;
      const sourceId = row.original.transaction?.sourceId;
      
      if (!sourceType) return "-";
      
      return (
        <span className="capitalize">
          {sourceType} #{sourceId || ''}
        </span>
      );
    },
  },
];

// Form schemas
const createProgramSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  pointsPerDollar: z.coerce.number().min(0.1, "Points per dollar must be at least 0.1"),
  active: z.boolean().default(true),
  tiers: z.array(
    z.object({
      name: z.string(),
      minimumPoints: z.number(),
      benefits: z.array(z.string()),
      discountPercentage: z.number(),
      color: z.string(),
    })
  ).default([
    {
      name: "Bronze",
      minimumPoints: 0,
      benefits: ["Basic rewards"],
      discountPercentage: 0,
      color: "amber",
    },
    {
      name: "Silver",
      minimumPoints: 1000,
      benefits: ["5% discount on rentals", "Priority booking"],
      discountPercentage: 5,
      color: "slate",
    },
    {
      name: "Gold",
      minimumPoints: 5000,
      benefits: ["10% discount on rentals", "Priority booking", "Free upgrades"],
      discountPercentage: 10,
      color: "yellow",
    },
  ]),
  redemptionRules: z.array(
    z.object({
      pointsRequired: z.number(),
      rewardDescription: z.string(),
      value: z.number(),
    })
  ).default([
    {
      pointsRequired: 500,
      rewardDescription: "$5 discount",
      value: 5,
    },
    {
      pointsRequired: 1000,
      rewardDescription: "$10 discount",
      value: 10,
    },
    {
      pointsRequired: 2500,
      rewardDescription: "Free rental day",
      value: 50,
    },
  ]),
});

type CreateProgramFormValues = z.infer<typeof createProgramSchema>;

export default function LoyaltyProgramPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLocalization();
  const isAdmin = user?.role === "admin";
  const [currentProgramId, setCurrentProgramId] = useState<number | null>(null);
  const [createProgramOpen, setCreateProgramOpen] = useState<boolean>(false);
  const [redeemPointsOpen, setRedeemPointsOpen] = useState<boolean>(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(500);
  
  // Form for creating a loyalty program
  const form = useForm<CreateProgramFormValues>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsPerDollar: 1,
      active: true,
      tiers: [
        {
          name: "Bronze",
          minimumPoints: 0,
          benefits: ["Basic rewards"],
          discountPercentage: 0,
          color: "amber",
        },
        {
          name: "Silver",
          minimumPoints: 1000,
          benefits: ["5% discount on rentals", "Priority booking"],
          discountPercentage: 5,
          color: "slate",
        },
        {
          name: "Gold",
          minimumPoints: 5000,
          benefits: ["10% discount on rentals", "Priority booking", "Free upgrades"],
          discountPercentage: 10,
          color: "yellow",
        },
      ],
      redemptionRules: [
        {
          pointsRequired: 500,
          rewardDescription: "$5 discount",
          value: 5,
        },
        {
          pointsRequired: 1000,
          rewardDescription: "$10 discount",
          value: 10,
        },
        {
          pointsRequired: 2500,
          rewardDescription: "Free rental day",
          value: 50,
        },
      ],
    },
  });
  
  // Query to get all loyalty programs
  const { 
    data: programs, 
    isLoading: isLoadingPrograms, 
    error: programsError,
    refetch: refetchPrograms
  } = useQuery<LoyaltyProgram[]>({
    queryKey: ["/api/loyalty-program-management/programs"],
  });
  
  // If we have programs, select the first one by default
  useEffect(() => {
    if (programs && programs.length > 0 && !currentProgramId) {
      setCurrentProgramId(programs[0].id);
    }
  }, [programs, currentProgramId]);
  
  // Get the current program
  const currentProgram = programs?.find(p => p.id === currentProgramId);
  
  // Query to get user's loyalty points
  const { 
    data: userPoints, 
    isLoading: isLoadingUserPoints,
    error: userPointsError,
    refetch: refetchUserPoints
  } = useQuery<LoyaltyPointsRecord[]>({
    queryKey: ["/api/loyalty-program-management/users", user?.id, "points"],
    enabled: !!user?.id,
  });
  
  // Query to get the current program's statistics (admin only)
  const { 
    data: programStats, 
    isLoading: isLoadingProgramStats,
    error: programStatsError,
    refetch: refetchProgramStats
  } = useQuery<ProgramStats>({
    queryKey: ["/api/loyalty-program-management/statistics", currentProgramId],
    enabled: !!currentProgramId && isAdmin,
  });
  
  // Query to get program members (admin only)
  const { 
    data: programMembers, 
    isLoading: isLoadingProgramMembers,
    error: programMembersError,
    refetch: refetchProgramMembers
  } = useQuery<ProgramUser[]>({
    queryKey: ["/api/loyalty-program-management/programs", currentProgramId, "users"],
    enabled: !!currentProgramId && isAdmin,
  });
  
  // Query to get user's transactions
  const { 
    data: userTransactions, 
    isLoading: isLoadingUserTransactions,
    error: userTransactionsError,
    refetch: refetchUserTransactions
  } = useQuery<PointsTransaction[]>({
    queryKey: ["/api/loyalty-program-management/users", user?.id, "transactions"],
    enabled: !!user?.id,
  });
  
  // Mutation to create a loyalty program
  const createProgramMutation = useMutation({
    mutationFn: async (data: CreateProgramFormValues) => {
      const response = await apiRequest("POST", "/api/loyalty-program-management/programs", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Program Created",
        description: "The loyalty program has been created successfully.",
      });
      setCreateProgramOpen(false);
      refetchPrograms();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to enroll in a program
  const enrollMutation = useMutation({
    mutationFn: async (programId: number) => {
      const response = await apiRequest("POST", `/api/loyalty-program-management/users/${user?.id}/enroll`, { programId });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful",
        description: "You have been enrolled in the loyalty program.",
      });
      refetchUserPoints();
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to check if user can redeem points
  const checkRedemptionEligibility = useQuery({
    queryKey: ["/api/loyalty-program-management/users", user?.id, "can-redeem", pointsToRedeem],
    queryFn: async ({ queryKey }) => {
      const userId = queryKey[1] as number;
      const points = queryKey[3] as number;
      const response = await fetch(`/api/loyalty-program-management/users/${userId}/can-redeem/${points}?programId=${currentProgramId}`);
      if (!response.ok) {
        throw new Error("Failed to check redemption eligibility");
      }
      return response.json();
    },
    enabled: !!user?.id && !!currentProgramId && redeemPointsOpen,
  });
  
  // Mutation to redeem points
  const redeemPointsMutation = useMutation({
    mutationFn: async ({ loyaltyPointsId, points, description }: { loyaltyPointsId: number, points: number, description: string }) => {
      const response = await apiRequest("POST", "/api/loyalty-program-management/transactions", {
        loyaltyPointsId,
        transactionType: "redeem",
        points,
        description,
        transactionDate: new Date().toISOString(),
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Points Redeemed",
        description: "Your points have been redeemed successfully.",
      });
      setRedeemPointsOpen(false);
      refetchUserPoints();
      refetchUserTransactions();
    },
    onError: (error) => {
      toast({
        title: "Redemption Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Function to handle program creation
  const onSubmitProgram = (values: CreateProgramFormValues) => {
    createProgramMutation.mutate(values);
  };
  
  // Function to enroll in a program
  const handleEnroll = (programId: number) => {
    enrollMutation.mutate(programId);
  };
  
  // Function to redeem points
  const handleRedeemPoints = () => {
    if (!userPoints || userPoints.length === 0) return;
    
    const userLoyaltyPoints = userPoints.find(p => p.programId === currentProgramId);
    if (!userLoyaltyPoints) return;
    
    const currentProgramObj = programs?.find(p => p.id === currentProgramId);
    if (!currentProgramObj) return;
    
    const rule = currentProgramObj.redemptionRules.find(r => r.pointsRequired === pointsToRedeem);
    if (!rule) return;
    
    redeemPointsMutation.mutate({
      loyaltyPointsId: userLoyaltyPoints.id,
      points: pointsToRedeem,
      description: `Redeemed for ${rule.rewardDescription}`,
    });
  };
  
  // Function to refresh data
  const handleRefresh = () => {
    refetchPrograms();
    refetchUserPoints();
    if (isAdmin && currentProgramId) {
      refetchProgramStats();
      refetchProgramMembers();
    }
    refetchUserTransactions();
  };
  
  // Calculate progress to next tier for the user
  const calculateTierProgress = () => {
    if (!userPoints || userPoints.length === 0 || !currentProgramId) return { progress: 0, nextTier: null };
    
    const userLoyaltyPoints = userPoints.find(p => p.programId === currentProgramId);
    if (!userLoyaltyPoints) return { progress: 0, nextTier: null };
    
    const currentProgramObj = programs?.find(p => p.id === currentProgramId);
    if (!currentProgramObj) return { progress: 0, nextTier: null };
    
    const userTier = userLoyaltyPoints.tier;
    const userPointsTotal = userLoyaltyPoints.points;
    
    // Find the current tier and the next tier
    const sortedTiers = [...currentProgramObj.tiers].sort((a, b) => a.minimumPoints - b.minimumPoints);
    const currentTierIndex = sortedTiers.findIndex(t => t.name === userTier);
    
    if (currentTierIndex === -1 || currentTierIndex === sortedTiers.length - 1) {
      // User is at the highest tier or tier not found
      return { progress: 100, nextTier: null };
    }
    
    const currentTier = sortedTiers[currentTierIndex];
    const nextTier = sortedTiers[currentTierIndex + 1];
    
    const pointsNeededForNextTier = nextTier.minimumPoints - currentTier.minimumPoints;
    const pointsEarnedSinceLastTier = userPointsTotal - currentTier.minimumPoints;
    
    const progress = Math.min(100, Math.floor((pointsEarnedSinceLastTier / pointsNeededForNextTier) * 100));
    
    return {
      progress,
      nextTier,
      pointsEarnedSinceLastTier,
      pointsNeededForNextTier,
    };
  };
  
  const tierProgress = calculateTierProgress();
  
  // Determine if user is enrolled in current program
  const isEnrolledInCurrentProgram = !!userPoints?.some(p => p.programId === currentProgramId);
  
  // Get user's points for current program
  const userCurrentProgramPoints = userPoints?.find(p => p.programId === currentProgramId);
  
  // Loading states
  const isLoading = isLoadingPrograms || isLoadingUserPoints || 
                    (isAdmin && (isLoadingProgramStats || isLoadingProgramMembers)) ||
                    isLoadingUserTransactions;
  
  // Error states
  const hasError = programsError || userPointsError || 
                   (isAdmin && (programStatsError || programMembersError)) ||
                   userTransactionsError;
  
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold">{t('loyalty.title', 'Loyalty Programs')}</h1>
            <p className="text-neutral-500 dark:text-neutral-400">
              {t('loyalty.subtitle', 'Manage and participate in loyalty programs')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <Button 
                variant="default" 
                onClick={() => setCreateProgramOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('loyalty.newProgram', 'New Program')}
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              {t('common.refresh', 'Refresh')}
            </Button>
          </div>
        </div>
        
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
            <AlertDescription>
              {t('loyalty.errorLoading', 'There was an error loading loyalty program data. Please try refreshing.')}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Programs Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isLoadingPrograms ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : programs && programs.length > 0 ? (
            programs.map((program) => (
              <Card 
                key={program.id} 
                className={`cursor-pointer hover:border-primary transition-all ${currentProgramId === program.id ? 'border-primary shadow-md' : ''}`}
                onClick={() => setCurrentProgramId(program.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{program.name}</CardTitle>
                    {program.active ? (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <CardDescription>{program.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2">
                    <Percent className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{program.pointsPerDollar} points per dollar</span>
                  </div>
                  <div className="flex items-center">
                    <Award className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm">{program.tiers.length} membership tiers</span>
                  </div>
                </CardContent>
                <CardFooter>
                  {isEnrolledInCurrentProgram && program.id === currentProgramId ? (
                    <Badge className="bg-blue-100 text-blue-800" variant="outline">Enrolled</Badge>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnroll(program.id);
                      }}
                      disabled={enrollMutation.isPending}
                    >
                      Enroll Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>No Loyalty Programs</CardTitle>
                <CardDescription>There are no loyalty programs available at this time.</CardDescription>
              </CardHeader>
              {isAdmin && (
                <CardFooter>
                  <Button onClick={() => setCreateProgramOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Program
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
        </div>
        
        {/* Program Details */}
        {currentProgram && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t('loyalty.tabs.overview', 'Overview')}</TabsTrigger>
              <TabsTrigger value="tiers">{t('loyalty.tabs.tiers', 'Membership Tiers')}</TabsTrigger>
              {isAdmin && <TabsTrigger value="members">{t('loyalty.tabs.members', 'Members')}</TabsTrigger>}
              <TabsTrigger value="transactions">{t('loyalty.tabs.transactions', 'My Transactions')}</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* User's points card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('loyalty.membership.title', 'My Membership')}</CardTitle>
                    <CardDescription>{t('loyalty.membership.subtitle', 'Your current status and points')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingUserPoints ? (
                      <Skeleton className="h-24 w-full" />
                    ) : isEnrolledInCurrentProgram && userCurrentProgramPoints ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('loyalty.membership.currentTier', 'Current Tier')}</span>
                          <Badge className="font-semibold">
                            {userCurrentProgramPoints.tier}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{t('loyalty.membership.pointsBalance', 'Points Balance')}</span>
                          <span className="text-2xl font-bold">
                            {userCurrentProgramPoints.points.toLocaleString()}
                          </span>
                        </div>
                        {tierProgress.nextTier && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{t('loyalty.membership.progressTo', 'Progress to')} {tierProgress.nextTier.name}</span>
                              <span className="text-sm font-medium">{tierProgress.progress}%</span>
                            </div>
                            <Progress value={tierProgress.progress} />
                            <p className="text-xs text-neutral-500">
                              {tierProgress.pointsEarnedSinceLastTier.toLocaleString()} / {tierProgress.pointsNeededForNextTier.toLocaleString()} {t('loyalty.membership.points', 'points')}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <Award className="h-10 w-10 mx-auto mb-2 text-neutral-400" />
                        <p className="text-sm text-neutral-600 mb-4">{t('loyalty.membership.notEnrolled', 'You\'re not enrolled in this program yet')}</p>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleEnroll(currentProgramId!)}
                          disabled={enrollMutation.isPending}
                        >
                          {t('loyalty.membership.enrollNow', 'Enroll Now')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  {isEnrolledInCurrentProgram && userCurrentProgramPoints && (
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setRedeemPointsOpen(true)}
                      >
                        <Gift className="mr-2 h-4 w-4" />
                        {t('loyalty.membership.redeemPoints', 'Redeem Points')}
                      </Button>
                      <span className="text-xs text-neutral-500">
                        {t('loyalty.membership.joined', 'Joined')} {new Date(userCurrentProgramPoints.joinDate).toLocaleDateString()}
                      </span>
                    </CardFooter>
                  )}
                </Card>
                
                {/* Program statistics (admin only) */}
                {isAdmin ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('loyalty.admin.programStats', 'Program Statistics')}</CardTitle>
                        <CardDescription>{t('loyalty.admin.programStatsDesc', 'Overall program performance')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isLoadingProgramStats ? (
                          <Skeleton className="h-24 w-full" />
                        ) : programStats ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-sm text-neutral-500">{t('loyalty.admin.members', 'Members')}</span>
                                <p className="text-2xl font-bold">{programStats.memberCount}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-sm text-neutral-500">{t('loyalty.admin.activePoints', 'Active Points')}</span>
                                <p className="text-2xl font-bold">{programStats.totalActivePoints.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-sm text-neutral-500">{t('loyalty.admin.pointsIssued', 'Points Issued')}</span>
                                <p className="text-xl font-medium">{programStats.totalPointsIssued.toLocaleString()}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-sm text-neutral-500">{t('loyalty.admin.pointsRedeemed', 'Points Redeemed')}</span>
                                <p className="text-xl font-medium">{programStats.totalPointsRedeemed.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-sm text-neutral-500">{t('loyalty.admin.redemptionRate', 'Redemption Rate')}</span>
                              <Progress value={programStats.redemptionRate} />
                              <p className="text-right text-xs text-neutral-500">{programStats.redemptionRate.toFixed(1)}%</p>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-neutral-600">{t('loyalty.admin.noStats', 'No statistics available')}</p>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('loyalty.admin.membershipByTier', 'Membership by Tier')}</CardTitle>
                        <CardDescription>{t('loyalty.admin.membershipByTierDesc', 'Distribution of members across tiers')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingProgramStats ? (
                          <Skeleton className="h-24 w-full" />
                        ) : programStats && programStats.membershipByTier?.length > 0 ? (
                          <div className="space-y-3">
                            {programStats.membershipByTier.map((tier) => (
                              <div key={tier.tier} className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">{tier.tier}</span>
                                  <span className="text-sm">{tier.count} {t('loyalty.admin.membersCount', 'members')}</span>
                                </div>
                                <Progress value={(tier.count / programStats.memberCount) * 100} />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-600">{t('loyalty.admin.noTierData', 'No tier data available')}</p>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    {/* Non-admin users see redemption options */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>{t('loyalty.rewards.title', 'Available Rewards')}</CardTitle>
                        <CardDescription>{t('loyalty.rewards.subtitle', 'Redeem your points for these rewards')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!isEnrolledInCurrentProgram ? (
                          <p className="text-sm text-neutral-600">{t('loyalty.rewards.enrollPrompt', 'Enroll in the program to view rewards')}</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {currentProgram.redemptionRules.map((rule) => (
                              <Card key={rule.pointsRequired} className="border-dashed">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">{rule.rewardDescription}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-2xl font-bold">{rule.pointsRequired} <span className="text-sm font-normal">{t('loyalty.rewards.points', 'points')}</span></p>
                                  <p className="text-sm text-neutral-500">{t('loyalty.rewards.value', 'Value')}: ${rule.value.toFixed(2)}</p>
                                </CardContent>
                                <CardFooter>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      setPointsToRedeem(rule.pointsRequired);
                                      setRedeemPointsOpen(true);
                                    }}
                                    disabled={!userCurrentProgramPoints || userCurrentProgramPoints.points < rule.pointsRequired}
                                  >
                                    {t('loyalty.rewards.redeem', 'Redeem')}
                                  </Button>
                                </CardFooter>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
            
            {/* Tiers Tab */}
            <TabsContent value="tiers" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentProgram.tiers.map((tier, index) => (
                  <Card key={tier.name}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>{tier.name}</CardTitle>
                        {userCurrentProgramPoints?.tier === tier.name && (
                          <Badge className="bg-blue-100 text-blue-800">{t('loyalty.tiers.yourTier', 'Your Tier')}</Badge>
                        )}
                      </div>
                      <CardDescription>
                        {tier.minimumPoints.toLocaleString()} {t('loyalty.tiers.pointsRequired', 'points required')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {tier.discountPercentage > 0 && (
                        <div className="flex items-center">
                          <Percent className="h-4 w-4 mr-2 text-primary" />
                          <span className="text-sm">{tier.discountPercentage}% {t('loyalty.tiers.discountOnRentals', 'discount on rentals')}</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">{t('loyalty.tiers.benefits', 'Benefits')}:</h4>
                        <ul className="list-disc list-inside text-sm">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i}>{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    {isEnrolledInCurrentProgram && userCurrentProgramPoints?.tier !== tier.name && (
                      <CardFooter>
                        <div className="w-full space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-neutral-500">
                              {userCurrentProgramPoints && tier.minimumPoints > 0 
                                ? `${Math.max(0, tier.minimumPoints - userCurrentProgramPoints.points).toLocaleString()} ${t('loyalty.tiers.morePointsNeeded', 'more points needed')}`
                                : ''}
                            </span>
                          </div>
                          {userCurrentProgramPoints && (
                            <Progress 
                              value={Math.min(100, (userCurrentProgramPoints.points / Math.max(1, tier.minimumPoints)) * 100)} 
                            />
                          )}
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {/* Members Tab (admin only) */}
            {isAdmin && (
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{t('loyalty.admin.programMembers', 'Program Members')}</CardTitle>
                        <CardDescription>{t('loyalty.admin.programMembersDesc', 'Members enrolled in this loyalty program')}</CardDescription>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {programStats?.memberCount || 0} {t('loyalty.admin.membersCount', 'Members')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingProgramMembers ? (
                      <Skeleton className="h-96 w-full" />
                    ) : programMembers && programMembers.length > 0 ? (
                      <DataTable 
                        columns={membersColumns} 
                        data={programMembers} 
                        searchKey="user.username"
                      />
                    ) : (
                      <div className="text-center py-10">
                        <Users className="h-10 w-10 mx-auto mb-2 text-neutral-400" />
                        <p className="text-neutral-600">{t('loyalty.admin.noMembers', 'No members enrolled yet')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            
            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{t('loyalty.transactions.title', 'My Transactions')}</CardTitle>
                      <CardDescription>{t('loyalty.transactions.subtitle', 'History of points earned and redeemed')}</CardDescription>
                    </div>
                    {userCurrentProgramPoints && (
                      <Badge className="bg-blue-100 text-blue-800">
                        {userCurrentProgramPoints.points.toLocaleString()} {t('loyalty.transactions.pointsAvailable', 'Points Available')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingUserTransactions ? (
                    <Skeleton className="h-96 w-full" />
                  ) : userTransactions && userTransactions.length > 0 ? (
                    <DataTable 
                      columns={transactionsColumns} 
                      data={userTransactions} 
                      searchKey="transaction.description"
                    />
                  ) : (
                    <div className="text-center py-10">
                      <Calendar className="h-10 w-10 mx-auto mb-2 text-neutral-400" />
                      <p className="text-neutral-600">{t('loyalty.transactions.noTransactions', 'No transactions found')}</p>
                      {!isEnrolledInCurrentProgram && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="mt-4"
                          onClick={() => handleEnroll(currentProgramId!)}
                        >
                          {t('loyalty.membership.enrollNow', 'Enroll Now')}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Create Program Dialog */}
      <Dialog open={createProgramOpen} onOpenChange={setCreateProgramOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('loyalty.createProgram.title', 'Create Loyalty Program')}</DialogTitle>
            <DialogDescription>
              {t('loyalty.createProgram.description', 'Create a new loyalty program for your customers. This will allow them to earn and redeem points.')}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProgram)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loyalty.createProgram.programName', 'Program Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('loyalty.createProgram.programNamePlaceholder', 'Premium Rewards')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loyalty.createProgram.description', 'Description')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('loyalty.createProgram.descriptionPlaceholder', 'Our premium loyalty program with exclusive benefits')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pointsPerDollar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('loyalty.createProgram.pointsPerDollar', 'Points Per Dollar')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.1" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>{t('loyalty.createProgram.pointsPerDollarHelp', 'How many points customers earn per dollar spent')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>{t('loyalty.createProgram.active', 'Active')}</FormLabel>
                      <FormDescription>{t('loyalty.createProgram.activeHelp', 'Make this program available to customers')}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateProgramOpen(false)}
                  type="button"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button type="submit" disabled={createProgramMutation.isPending}>
                  {createProgramMutation.isPending && (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('loyalty.createProgram.submit', 'Create Program')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Redeem Points Dialog */}
      <Dialog open={redeemPointsOpen} onOpenChange={setRedeemPointsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('loyalty.redeemPoints.title', 'Redeem Points')}</DialogTitle>
            <DialogDescription>
              {t('loyalty.redeemPoints.description', 'Use your loyalty points to get rewards and discounts.')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {checkRedemptionEligibility.isLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : checkRedemptionEligibility.data ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('loyalty.redeemPoints.pointsToRedeem', 'Points to Redeem')}:</span>
                  <span className="text-xl font-bold">{pointsToRedeem}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('loyalty.redeemPoints.currentBalance', 'Current Balance')}:</span>
                  <span>{checkRedemptionEligibility.data.availablePoints} {t('loyalty.redeemPoints.points', 'points')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t('loyalty.redeemPoints.remainingAfter', 'Remaining After Redemption')}:</span>
                  <span>{checkRedemptionEligibility.data.availablePoints - pointsToRedeem} {t('loyalty.redeemPoints.points', 'points')}</span>
                </div>
                
                {currentProgram && (
                  <div className="space-y-2">
                    <span className="font-medium">{t('loyalty.redeemPoints.reward', 'Reward')}:</span>
                    <Card className="border-dashed">
                      <CardContent className="p-4">
                        <p className="font-medium">
                          {currentProgram.redemptionRules.find(r => r.pointsRequired === pointsToRedeem)?.rewardDescription || t('loyalty.redeemPoints.customReward', 'Custom reward')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {!checkRedemptionEligibility.data.canRedeem && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('loyalty.redeemPoints.cannotRedeem', 'Cannot Redeem')}</AlertTitle>
                    <AlertDescription>
                      {checkRedemptionEligibility.data.reason}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
                <AlertDescription>
                  {t('loyalty.redeemPoints.eligibilityError', 'Failed to check redemption eligibility. Please try again.')}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRedeemPointsOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button 
              variant="default"
              disabled={
                redeemPointsMutation.isPending || 
                checkRedemptionEligibility.isLoading || 
                !checkRedemptionEligibility.data?.canRedeem
              }
              onClick={handleRedeemPoints}
            >
              {redeemPointsMutation.isPending && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('loyalty.redeemPoints.submit', 'Redeem Points')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}