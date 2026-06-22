import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";           // ← Correct import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Made async + await
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.auth.signup({ 
        shopName, 
        ownerName, 
        email, 
        phone, 
        password 
      });

      

      if (res.ok) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("currentShop", JSON.stringify(res.shop));

        toast.success("Shop created successfully! 🎉");
        navigate({ to: "/" });   // Change to your dashboard route
      } else {
        setError(res.error || "Signup failed. Please try again.");
        toast.error("Failed to create shop. Please try again.");
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      setError("Cannot connect to server. Make sure backend is running on port 5000.");
      toast.error("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg gold-gradient">
            <Gem className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading text-2xl gold-text">Create your shop</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Start managing your jewellery business</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />{error}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Shop Name *</Label>
              <Input 
                value={shopName} 
                onChange={e => setShopName(e.target.value)} 
                placeholder="Sharma Jewellers" 
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label>Owner Name</Label>
              <Input 
                value={ownerName} 
                onChange={e => setOwnerName(e.target.value)} 
                placeholder="Rajesh Sharma" 
              />
            </div>

            <div className="grid gap-2">
              <Label>Email *</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="shop@example.com" 
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="9876543210" 
              />
            </div>

            <div className="grid gap-2">
              <Label>Password * <span className="text-xs text-muted-foreground">(min 4 chars)</span></Label>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Shop...
                </>
              ) : (
                "Create Shop"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have a shop?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}