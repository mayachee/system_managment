import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Sample data for the chart - in a real scenario, this would come from an API
const weeklyData = [
  { name: "Mon", active: 12, completed: 8, total: 20 },
  { name: "Tue", active: 15, completed: 10, total: 25 },
  { name: "Wed", active: 18, completed: 11, total: 29 },
  { name: "Thu", active: 16, completed: 9, total: 25 },
  { name: "Fri", active: 20, completed: 12, total: 32 },
  { name: "Sat", active: 22, completed: 13, total: 35 },
  { name: "Sun", active: 19, completed: 10, total: 29 },
];

const monthlyData = [
  { name: "Jan", active: 120, completed: 80, total: 200 },
  { name: "Feb", active: 150, completed: 100, total: 250 },
  { name: "Mar", active: 180, completed: 110, total: 290 },
  { name: "Apr", active: 160, completed: 90, total: 250 },
  { name: "May", active: 200, completed: 120, total: 320 },
  { name: "Jun", active: 220, completed: 130, total: 350 },
  { name: "Jul", active: 190, completed: 100, total: 290 },
  { name: "Aug", active: 205, completed: 115, total: 320 },
  { name: "Sep", active: 215, completed: 125, total: 340 },
  { name: "Oct", active: 230, completed: 140, total: 370 },
  { name: "Nov", active: 210, completed: 130, total: 340 },
  { name: "Dec", active: 240, completed: 145, total: 385 },
];

const yearlyData = [
  { name: "2019", active: 1200, completed: 800, total: 2000 },
  { name: "2020", active: 1500, completed: 1000, total: 2500 },
  { name: "2021", active: 1800, completed: 1100, total: 2900 },
  { name: "2022", active: 1600, completed: 900, total: 2500 },
  { name: "2023", active: 2000, completed: 1200, total: 3200 },
];

interface RentalActivityChartProps {
  data: any;
  isAdmin: boolean;
}

export default function RentalActivityChart({ data, isAdmin }: RentalActivityChartProps) {
  const [timeframe, setTimeframe] = useState("weekly");

  // Select the appropriate data based on the timeframe
  const chartData = timeframe === "weekly" 
    ? weeklyData 
    : timeframe === "monthly" 
      ? monthlyData 
      : yearlyData;

  return (
    <Card className="shadow-sm">
      <div className="flex items-center justify-between p-6 pb-0">
        <h2 className="text-lg font-semibold">Rental Activity</h2>
        <Tabs value={timeframe} onValueChange={setTimeframe}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CardContent className="p-6 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                borderRadius: '8px',
                border: '1px solid #ddd'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="total" 
              name="Total Rentals"
              stackId="1" 
              stroke="#3B82F6" 
              fill="#3B82F6" 
              fillOpacity={0.8}
            />
            <Area 
              type="monotone" 
              dataKey="active" 
              name="Active Rentals"
              stackId="2" 
              stroke="#10B981" 
              fill="#10B981" 
              fillOpacity={0.6}
            />
            <Area 
              type="monotone" 
              dataKey="completed" 
              name="Completed Rentals"
              stackId="3" 
              stroke="#F59E0B" 
              fill="#F59E0B" 
              fillOpacity={0.4}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
