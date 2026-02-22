import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { countries } from "@/lib/countries";
import loginBgImage from "@assets/GmbuHuHbRYpTPJt5_1768481770485.png";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [detectedCountry, setDetectedCountry] = useState<string>("");

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    async function detectCountry() {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.country_code) {
          const matchedCountry = countries.find(c => c.code === data.country_code);
          if (matchedCountry) {
            setDetectedCountry(matchedCountry.name);
            form.setValue("country", matchedCountry.name);
          }
        }
      } catch (error) {
        console.log("Could not detect country by IP");
      }
    }
    detectCountry();
  }, [form]);

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register", registerData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      toast({
        title: "Account Created",
        description: "Welcome to Blue Way Trading!",
      });
      setLocation("/trade");
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SignupFormData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Left Side - Signup Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 bg-white dark:bg-[#0a0a0a] order-1 md:order-1 overflow-y-auto">
        {/* Mobile Logo - Above form */}
        <div className="md:hidden flex flex-col items-center mb-8">
          <div className="flex items-center gap-1 text-4xl font-bold">
            <span className="text-[#34C759]">s</span>
            <span className="relative">
              <span className="text-[#34C759]">▲</span>
              <span className="absolute top-3 left-0 text-red-500 text-xs">▼</span>
            </span>
            <span className="text-[#1a1a1a] dark:text-white">le</span>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-[#34C759] mb-8">
            Create Your Account
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#34C759] font-medium">First Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="John"
                          data-testid="input-firstname"
                          className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#34C759] font-medium">Last Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Doe"
                          data-testid="input-lastname"
                          className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="john@example.com"
                        data-testid="input-email"
                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="tel"
                        placeholder="+1 234 567 8900"
                        data-testid="input-phone"
                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Country</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger 
                          data-testid="select-country"
                          className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                        >
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        {countries.map((country) => (
                          <SelectItem 
                            key={country.code} 
                            value={country.name}
                            data-testid={`option-country-${country.code}`}
                          >
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-password"
                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        data-testid="input-confirm-password"
                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={signupMutation.isPending}
                data-testid="button-signup"
                className="w-full h-12 bg-[#34C759] hover:bg-[#2db84e] text-white font-semibold text-lg rounded-full"
              >
                {signupMutation.isPending ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          </Form>

          {/* Social Login Buttons */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow" />
              <span className="px-4 text-sm text-gray-500">or sign up with</span>
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow" />
            </div>

            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    data-testid="button-google-signup"
                    className="flex-1 h-12 gap-2 opacity-60 cursor-not-allowed"
                  >
                    <SiGoogle className="w-5 h-5 text-red-500" />
                    <span>Google</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    data-testid="button-facebook-signup"
                    className="flex-1 h-12 gap-2 opacity-60 cursor-not-allowed"
                  >
                    <SiFacebook className="w-5 h-5 text-blue-600" />
                    <span>Facebook</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setLocation("/login")}
              data-testid="link-login"
              className="text-[#34C759] font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image & Branding */}
      <div
        className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-8 md:p-16 min-h-[300px] md:h-full order-2 md:order-2"
        style={{
          backgroundImage: `url(${loginBgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

        <div className="relative z-10 text-center max-w-lg">
          {/* Logo */}
          <div className="hidden md:flex items-center justify-center gap-1 text-6xl font-bold mb-6">
            <span className="text-[#34C759]">s</span>
            <span className="relative">
              <span className="text-[#34C759]">▲</span>
              <span className="absolute top-4 left-0 text-red-500 text-lg">▼</span>
            </span>
            <span className="text-white">le</span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Join the Future of Trading
          </h2>

          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Start your trading journey with Blue Way Trading. Get access to real-time market data,
            advanced trading tools, and a secure platform designed for both beginners and experts.
            Create your account today and take control of your financial future.
          </p>
        </div>
      </div>
    </div>
  );
}
