import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, Shield, AlertTriangle, Wand2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSuspiciousActivityDetection } from "@/hooks/useSecurityAudit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Strong password validation for signup
const signupSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[\p{L}\p{M}\s'-]+$/u, "Name contains invalid characters"),
});

// Simpler validation for login
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(100),
});

// Magic link validation
const magicLinkSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authMethod, setAuthMethod] = useState<"password" | "magic-link">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { trackFailedAttempt, resetFailedAttempts, shouldLockAccount } = useSuspiciousActivityDetection();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Check if account is locked on email change
  useEffect(() => {
    const checkLockStatus = async () => {
      if (!email || !email.includes('@')) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('security-middleware', {
          body: {
            action: 'check-login-status',
            data: { email },
          },
        });

        if (!error && data?.locked) {
          setIsLocked(true);
          setLockUntil(new Date(data.lockedUntil));
        } else {
          setIsLocked(false);
          setLockUntil(null);
        }
      } catch {
        // Fail silently - don't disrupt user experience
      }
    };

    const debounce = setTimeout(checkLockStatus, 500);
    return () => clearTimeout(debounce);
  }, [email]);

  // Password strength checker
  const checkPasswordStrength = useCallback((pwd: string) => {
    const feedback: string[] = [];
    let score = 0;

    if (pwd.length >= 8) score++;
    else feedback.push("At least 8 characters");

    if (/[A-Z]/.test(pwd)) score++;
    else feedback.push("One uppercase letter");

    if (/[a-z]/.test(pwd)) score++;
    else feedback.push("One lowercase letter");

    if (/[0-9]/.test(pwd)) score++;
    else feedback.push("One number");

    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    else feedback.push("One special character (recommended)");

    setPasswordStrength({ score, feedback });
  }, []);

  useEffect(() => {
    if (!isLogin && password) {
      checkPasswordStrength(password);
    }
  }, [password, isLogin, checkPasswordStrength]);

  // Handle magic link submission
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = magicLinkSchema.parse({ email });
      
      const { error } = await supabase.auth.signInWithOtp({
        email: validated.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message,
        });
      } else {
        setMagicLinkSent(true);
        toast({
          title: "Check your email",
          description: "We've sent you a magic link to sign in.",
        });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: err.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check client-side lock
    if (shouldLockAccount()) {
      toast({
        variant: "destructive",
        title: "Too many attempts",
        description: "Please wait a few minutes before trying again.",
      });
      return;
    }

    // Check server-side lock
    if (isLocked && lockUntil && new Date() < lockUntil) {
      const minutes = Math.ceil((lockUntil.getTime() - Date.now()) / 60000);
      toast({
        variant: "destructive",
        title: "Account temporarily locked",
        description: `Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const validated = loginSchema.parse({ email, password });

        const { error } = await signIn(validated.email, validated.password);
        if (error) {
          // Track failed attempt
          trackFailedAttempt();
          
          // Report to server
          try {
            await supabase.functions.invoke('security-middleware', {
              body: {
                action: 'track-failed-login',
                data: { email: validated.email },
              },
            });
          } catch {
            // Fail silently
          }

          toast({
            variant: "destructive",
            title: "Login failed",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
          });
        } else {
          // Reset failed attempts on successful login
          resetFailedAttempts();
          try {
            await supabase.functions.invoke('security-middleware', {
              body: {
                action: 'reset-failed-logins',
                data: { email: validated.email },
              },
            });
          } catch {
            // Fail silently
          }

          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/");
        }
      } else {
        const validated = signupSchema.parse({ email, password, fullName });

        const { error } = await signUp(validated.email, validated.password, validated.fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              variant: "destructive",
              title: "Account exists",
              description: "This email is already registered. Please login instead.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Signup failed",
              description: error.message,
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "You have successfully signed up.",
          });
          navigate("/");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation error",
          description: err.errors[0].message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = (score: number) => {
    if (score <= 1) return "bg-destructive";
    if (score <= 2) return "bg-orange-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-green-500";
    return "bg-green-600";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </button>

        <div className="bg-card rounded-2xl shadow-floating p-8 animate-fade-in">
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-hero mx-auto mb-4">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {magicLinkSent ? "Check your email" : isLogin ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {magicLinkSent 
                ? "Click the link in your email to sign in"
                : isLogin
                  ? "Sign in to your marketplace account"
                  : "Join our marketplace community"}
            </p>
          </div>

          {magicLinkSent ? (
            <div className="text-center space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <Mail className="h-12 w-12 mx-auto text-primary mb-3" />
                <p className="text-sm text-foreground">
                  We've sent a magic link to <strong>{email}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  The link will expire in 1 hour
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setMagicLinkSent(false);
                  setEmail("");
                }}
                className="w-full"
              >
                Try a different email
              </Button>
            </div>
          ) : (
            <>
              {isLocked && lockUntil && new Date() < lockUntil && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">Account temporarily locked</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Too many failed login attempts. Try again in {Math.ceil((lockUntil.getTime() - Date.now()) / 60000)} minutes.
                    </p>
                  </div>
                </div>
              )}

              {isLogin && (
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "password" | "magic-link")} className="mb-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </TabsTrigger>
                    <TabsTrigger value="magic-link" className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4" />
                      Magic Link
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              {authMethod === "magic-link" && isLogin ? (
                <form onSubmit={handleMagicLink} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="magic-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="email"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-hero text-primary-foreground"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    We'll email you a secure link to sign in instantly
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          autoComplete="name"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoComplete="email"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                        autoComplete={isLogin ? "current-password" : "new-password"}
                        maxLength={100}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator for signup */}
                    {!isLogin && password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.score
                                  ? getStrengthColor(passwordStrength.score)
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Missing: {passwordStrength.feedback.slice(0, 2).join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-hero text-primary-foreground"
                    disabled={isLoading || (isLocked && lockUntil && new Date() < lockUntil)}
                  >
                    {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setPassword("");
                    setPasswordStrength({ score: 0, feedback: [] });
                    setAuthMethod("password");
                  }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </>
          )}

          {/* Security notice */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Your data is protected with industry-standard encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}