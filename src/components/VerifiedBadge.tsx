import { CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const VerifiedBadge = ({ size = "md", className = "" }: VerifiedBadgeProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CheckCircle 
            className={`${sizeClasses[size]} text-blue-500 fill-blue-500 ${className}`}
            aria-label="Verified Artist"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Artist</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
