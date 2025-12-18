import { Check, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItemProps {
  title: string;
  description: string;
  status: "pass" | "fail" | "warning";
  category: string;
}

export function ChecklistItem({ title, description, status, category }: ChecklistItemProps) {
  const statusConfig = {
    pass: {
      icon: Check,
      bgClass: "bg-geo-green/10",
      iconClass: "text-geo-green",
      borderClass: "border-geo-green/20",
    },
    fail: {
      icon: X,
      bgClass: "bg-geo-red/10",
      iconClass: "text-geo-red",
      borderClass: "border-geo-red/20",
    },
    warning: {
      icon: AlertCircle,
      bgClass: "bg-geo-orange/10",
      iconClass: "text-geo-orange",
      borderClass: "border-geo-orange/20",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-lg border transition-colors",
      config.bgClass,
      config.borderClass
    )}>
      <div className={cn("flex-shrink-0 mt-0.5", config.iconClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {category}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
