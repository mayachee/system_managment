import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";

interface StatsCardProps {
  title: string;
  value: number;
  icon: keyof typeof Icons;
  change: string;
  changeText: string;
  variant?: "primary" | "secondary" | "amber" | "indigo";
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeText,
  variant = "primary"
}: StatsCardProps) {
  // Map variant to color classes
  const variantClasses = {
    primary: {
      iconBg: "bg-primary-100 dark:bg-primary-900/60",
      iconColor: "text-primary-600 dark:text-primary-400",
      changeColor: "text-green-500"
    },
    secondary: {
      iconBg: "bg-secondary-100 dark:bg-secondary-900/60",
      iconColor: "text-secondary-600 dark:text-secondary-400",
      changeColor: "text-green-500"
    },
    amber: {
      iconBg: "bg-amber-100 dark:bg-amber-900/60",
      iconColor: "text-amber-600 dark:text-amber-400",
      changeColor: "text-green-500"
    },
    indigo: {
      iconBg: "bg-indigo-100 dark:bg-indigo-900/60",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      changeColor: "text-green-500"
    }
  };
  
  const { iconBg, iconColor, changeColor } = variantClasses[variant];
  
  // Get the icon component
  const IconComponent = Icons[icon];

  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${iconBg} flex items-center justify-center ${iconColor}`}>
            <IconComponent className="text-2xl h-6 w-6" />
          </div>
        </div>
        {(change || changeText) && (
          <div className="mt-4 flex items-center">
            {change && (
              <span className={`${changeColor} text-sm font-medium flex items-center`}>
                <Icons.chevronUp className="mr-1 h-4 w-4" />
                {change}
              </span>
            )}
            {changeText && (
              <span className="text-neutral-500 dark:text-neutral-400 text-sm ml-2">
                {changeText}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
