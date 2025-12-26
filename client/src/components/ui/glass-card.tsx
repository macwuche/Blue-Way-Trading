import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dark" | "light";
  gradient?: boolean;
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className, 
  variant = "default", 
  gradient = false,
  onClick 
}: GlassCardProps) {
  const baseStyles = "rounded-lg transition-all duration-300";
  
  const variantStyles = {
    default: "glass",
    dark: "glass-dark",
    light: "glass-light",
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        gradient && "gradient-border",
        onClick && "cursor-pointer hover-elevate",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
