import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

const AdminLogin = () => {
  const { user, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // Check if already logged in as admin
  useEffect(() => {
    const checkExistingAdmin = async () => {
      if (authLoading) return;
      
      if (user) {
        setCheckingAdmin(true);
        try {
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });

          if (!error && data) {
            navigate("/admin");
            return;
          }
        } catch (err) {
          console.error("Error checking admin status:", err);
        } finally {
          setCheckingAdmin(false);
        }
      }
    };

    checkExistingAdmin();
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter both email and password.",
      });
      return;
    }

    setLoading(true);

    try {
      // First sign in
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        toast({
          variant: "destructive",
          title: "Authentication Failed",
          description: signInError.message,
        });
        setLoading(false);
        return;
      }

      // Wait a moment for the session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to authenticate. Please try again.",
        });
        setLoading(false);
        return;
      }

      // Check if the user is an admin
      const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin'
      });

      if (roleError) {
        console.error("Error checking admin role:", roleError);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to verify admin access.",
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!isAdmin) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have admin privileges.",
        });
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Success - redirect to admin panel
      toast({
        title: "Welcome, Admin!",
        description: "Redirecting to admin dashboard...",
      });
      
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription className="mt-2">
              Enter your credentials to access the admin panel
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In as Admin"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              Back to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
