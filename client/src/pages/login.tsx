import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiFacebook, SiGoogle } from "react-icons/si";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import loginBgImage from "@assets/GmbuHuHbRYpTPJt5_1768481770485.png";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/check"] });
      setLocation("/trade");
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24 bg-white dark:bg-[#0a0a0a] order-1 md:order-1">
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
            Access Your Trading Hub
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        placeholder="support@bluewaytrading.com"
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
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#34C759] font-medium">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••••••••••"
                        data-testid="input-password"
                        className="h-12 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-[#34C759] focus:ring-[#34C759]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-remember"
                          className="border-[#34C759] data-[state=checked]:bg-[#34C759]"
                        />
                      </FormControl>
                      <FormLabel className="text-[#34C759] font-normal cursor-pointer !mt-0">
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <button
                  type="button"
                  className="text-[#34C759] hover:underline text-sm"
                  data-testid="link-forgot-password"
                >
                  Forgot your password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                data-testid="button-signin"
                className="w-full h-12 bg-[#34C759] hover:bg-[#2db84e] text-white font-semibold text-lg rounded-full"
              >
                {loginMutation.isPending ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </Form>

          {/* Social Login Buttons */}
          <div className="mt-6">
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow" />
              <span className="px-4 text-sm text-gray-500">or continue with</span>
              <div className="border-t border-gray-200 dark:border-gray-800 flex-grow" />
            </div>

            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled
                    data-testid="button-google-login"
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
                    data-testid="button-facebook-login"
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
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setLocation("/signup")}
              data-testid="link-signup"
              className="text-[#34C759] font-semibold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Hero Image & Branding */}
      <div
        className="w-full md:w-1/2 relative flex flex-col items-center justify-center p-8 md:p-16 min-h-[300px] md:min-h-screen order-2 md:order-2"
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
            Step Into the World of Smart Trading
          </h2>

          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            Enter the realm of Blue Way Trading, where cutting-edge blockchain technology meets
            seamless trading experiences. As the industry evolves amidst global regulatory
            developments, stay ahead with our secure, intuitive platform. Ready to make your mark in
            the dynamic world of cryptocurrency?
          </p>
        </div>
      </div>
    </div>
  );
}
