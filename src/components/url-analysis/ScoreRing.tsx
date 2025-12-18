import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "seo" | "geo";
}

export function ScoreRing({ score, label, size = "md", variant = "seo" }: ScoreRingProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-40 h-40",
  };

  const textSizes = {
    sm: "text-2xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  const getScoreColor = (score: number, variant: string) => {
    if (variant === "geo") {
      if (score >= 70) return "stroke-geo-purple";
      if (score >= 40) return "stroke-geo-orange";
      return "stroke-geo-red";
    }
    if (score >= 70) return "stroke-geo-teal";
    if (score >= 40) return "stroke-geo-orange";
    return "stroke-geo-red";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excelente";
    if (score >= 70) return "Bom";
    if (score >= 50) return "Regular";
    if (score >= 30) return "Fraco";
    return "Crítico";
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={cn("relative", sizeClasses[size])}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            className="stroke-muted"
          />
          {/* Score circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={cn("transition-all duration-1000 ease-out", getScoreColor(score, variant))}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold", textSizes[size])}>{score}</span>
          <span className="text-xs text-muted-foreground">{getScoreLabel(score)}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
