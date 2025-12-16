import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookOpen, Mail, Lock, User, ArrowRight, Eye, EyeOff, GraduationCap, Users, ShieldCheck, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authApi, otpApi, tokenManager, ApiError } from "@/lib/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [userType, setUserType] = useState<"student" | "mentor">("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login
        const response = await authApi.login({
          email: formData.email,
          password: formData.password,
        });

        if (response.requiresVerification) {
          setPendingEmail(formData.email);
          setShowOtpVerification(true);
          toast({
            title: "Email verification required",
            description: "Please verify your email. A new OTP has been sent.",
            variant: "default",
          });
        } else if (response.token && response.user) {
          tokenManager.setToken(response.token);
          toast({
            title: "Welcome back!",
            description: "You've successfully logged in.",
          });
          // Dispatch storage event to update navbar
          window.dispatchEvent(new Event('storage'));
          // Redirect based on role
          const userRole = response.user.role;
          if (userRole === "teacher" || userRole === "mentor" || userRole === "admin" || userRole === "superadmin") {
            navigate("/mentor-dashboard");
          } else {
            navigate("/dashboard");
          }
        }
      } else {
        // Register
        const response = await authApi.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: userType === "mentor" ? "teacher" : "student",
        });

        if (response.user) {
          setPendingEmail(formData.email);
          setShowOtpVerification(true);
          toast({
            title: "Account created!",
            description: "Please verify your email. OTP has been sent to your email.",
            variant: "default",
          });
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await otpApi.verifyOtp(pendingEmail, otp);

      if (response.success) {
        toast({
          title: "Email verified!",
          description: "Your email has been verified successfully.",
        });

        // If it was a login flow, try logging in again
        if (isLogin) {
          const loginResponse = await authApi.login({
            email: formData.email,
            password: formData.password,
          });

          if (loginResponse.token && loginResponse.user) {
            tokenManager.setToken(loginResponse.token);
            // Dispatch custom event to update navbar
            window.dispatchEvent(new Event('authChange'));
            // Redirect based on role
            const userRole = loginResponse.user.role;
            if (userRole === "teacher" || userRole === "mentor" || userRole === "admin" || userRole === "superadmin") {
              navigate("/mentor-dashboard");
            } else {
              navigate("/dashboard");
            }
          }
        } else {
          // Registration flow - go to login
          setIsLogin(true);
          setShowOtpVerification(false);
          setOtp("");
          setFormData({ name: "", email: formData.email, password: "" });
          toast({
            title: "Success!",
            description: "You can now log in with your credentials.",
          });
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      await otpApi.sendOtp(pendingEmail);
      toast({
        title: "OTP resent",
        description: "A new OTP has been sent to your email.",
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" />
        
        {/* Floating icons */}
        <div className="absolute top-1/4 left-1/4 animate-bounce-subtle" style={{ animationDelay: "0s" }}>
          <BookOpen className="w-8 h-8 text-primary/20" />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-bounce-subtle" style={{ animationDelay: "0.5s" }}>
          <GraduationCap className="w-10 h-10 text-secondary/20" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-bounce-subtle" style={{ animationDelay: "1s" }}>
          <Users className="w-8 h-8 text-accent/20" />
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold gradient-text">Study Link</span>
        </Link>

        {/* Auth Card */}
        <div className="glass rounded-2xl shadow-elevated p-8 animate-scale-in">
          {showOtpVerification ? (
            /* OTP Verification Form */
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
                <p className="text-muted-foreground">
                  We've sent a verification code to <br />
                  <span className="font-medium text-foreground">{pendingEmail}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Enter Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 text-center text-2xl tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full"
                  disabled={isLoading || otp.length !== 6}
                >
                  {isLoading ? "Verifying..." : "Verify Email"}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setShowOtpVerification(false);
                    setOtp("");
                  }}
                >
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back
                </Button>
              </form>
            </div>
          ) : (
            <>
          {/* Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                isLogin
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                !isLogin
                  ? "gradient-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* User Type Selection (only for signup) */}
          {!isLogin && (
            <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Label className="text-sm font-medium text-muted-foreground mb-3 block">
                I want to join as
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("student")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                    userType === "student"
                      ? "border-primary bg-primary/5 shadow-soft"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <GraduationCap className={`w-6 h-6 ${userType === "student" ? "text-primary" : "text-muted-foreground"}`} />
                  <span className={`font-medium ${userType === "student" ? "text-primary" : "text-muted-foreground"}`}>
                    Student
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("mentor")}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                    userType === "mentor"
                      ? "border-secondary bg-secondary/5 shadow-soft"
                      : "border-border hover:border-secondary/50"
                  }`}
                >
                  <Users className={`w-6 h-6 ${userType === "mentor" ? "text-secondary" : "text-muted-foreground"}`} />
                  <span className={`font-medium ${userType === "mentor" ? "text-secondary" : "text-muted-foreground"}`}>
                    Mentor
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isLogin ? "0.1s" : "0.3s" }}>
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isLogin ? "0.2s" : "0.4s" }}>
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-12 pr-12 h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-sm text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="xl"
              className="w-full group"
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 hover-lift">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-12 hover-lift">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
