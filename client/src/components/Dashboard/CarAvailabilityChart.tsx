import { Card, CardContent } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CarAvailabilityChartProps {
  data: any;
  isAdmin: boolean;
}

export default function CarAvailabilityChart({ data, isAdmin }: CarAvailabilityChartProps) {
  // Create chart data from the dashboard stats
  const pieData = isAdmin
    ? [
        {
          name: "Available",
          value: data?.availableCars || 0,
        },
        {
          name: "Rented",
          value: data?.rentedCars || 0,
        },
        {
          name: "Maintenance",
          value: data?.maintenanceCars || 0,
        },
      ]
    : [
        {
          name: "Available",
          value: data?.availableCars || 0,
        },
        {
          name: "Your Rentals",
          value: data?.activeUserRentals || 0,
        },
      ];

  // Filter out zero values
  const filteredData = pieData.filter(item => item.value > 0);

  // Chart colors
  const COLORS = ["#10B981", "#3B82F6", "#F59E0B"];

  return (
    <Card className="shadow-sm">
      <div className="p-6 pb-0">
        <h2 className="text-lg font-semibold">Car Availability</h2>
      </div>
      <CardContent className="p-6 h-80">
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [`${value} cars`, 'Count']}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '8px',
                  border: '1px solid #ddd'
                }}
              />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-neutral-500">No car data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
