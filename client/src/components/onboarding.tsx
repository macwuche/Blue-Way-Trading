import { useState } from "react";
import { 
  TrendingUp, TrendingDown, Wallet, Shield, 
  ChevronRight, ChevronLeft, X, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  title: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  image?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    title: "Welcome to TradeFlow",
    description: "Your gateway to binary options trading. Trade cryptocurrencies, forex, stocks, and ETFs with ease.",
    icon: TrendingUp,
    color: "text-primary"
  },
  {
    title: "How Binary Trading Works",
    description: "Predict if an asset's price will go HIGHER or LOWER within your chosen timeframe. Correct predictions earn up to 95% profit!",
    icon: ArrowUp,
    color: "text-success"
  },
  {
    title: "Place Your First Trade",
    description: "Select an asset, choose your expiry time (30 seconds to 1 year), set your amount, and click HIGHER or LOWER.",
    icon: ArrowDown,
    color: "text-destructive"
  },
  {
    title: "Fund Your Account",
    description: "Deposit using Bitcoin, Ethereum, USDT, PayPal, or bank transfer. Start trading with as little as $10.",
    icon: Wallet,
    color: "text-success"
  },
  {
    title: "Trade Securely",
    description: "Your funds are safe. Complete verification to unlock higher limits and faster withdrawals.",
    icon: Shield,
    color: "text-primary"
  }
];

interface OnboardingProps {
  open: boolean;
  onComplete: () => void;
}

export function Onboarding({ open, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = onboardingSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onComplete()}>
      <DialogContent className="glass-dark border-white/10 max-w-md p-0 overflow-hidden">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-white z-10"
          data-testid="button-skip-onboarding"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center",
              step.color
            )}>
              <step.icon className="w-12 h-12" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-3" data-testid="text-onboarding-title">
              {step.title}
            </h2>
            <p className="text-muted-foreground" data-testid="text-onboarding-description">
              {step.description}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentStep === index 
                    ? "w-8 bg-primary" 
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                data-testid={`button-step-${index}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
                data-testid="button-onboarding-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn("flex-1", isFirstStep && "w-full")}
              data-testid="button-onboarding-next"
            >
              {isLastStep ? "Get Started" : "Next"}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
