// import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
// import { useState } from "react";
// import { auth } from "@/lib/auth";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Gem, AlertTriangle } from "lucide-react";

// export const Route = createFileRoute("/login")({
//   component: LoginPage,
// });

// function LoginPage() {
//   const navigate = useNavigate();
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     const res = auth.login(email, password);
//     if (!res.ok) { setError(res.error); return; }
//     navigate({ to: "/" });
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 bg-background">
//       <Card className="w-full max-w-md glass-card border-border/50">
//         <CardHeader className="text-center">
//           <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg gold-gradient">
//             <Gem className="h-6 w-6 text-primary-foreground" />
//           </div>
//           <CardTitle className="font-heading text-2xl gold-text">Welcome back</CardTitle>
//           <p className="text-sm text-muted-foreground mt-1">Sign in to your shop</p>
//         </CardHeader>
//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             {error && (
//               <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
//                 <AlertTriangle className="h-4 w-4 shrink-0" />{error}
//               </div>
//             )}
//             <div className="grid gap-2">
//               <Label>Email</Label>
//               <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="shop@example.com" required />
//             </div>
//             <div className="grid gap-2">
//               <Label>Password</Label>
//               <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
//             </div>
//             <Button type="submit" className="w-full">Sign in</Button>
//             <p className="text-sm text-center text-muted-foreground">
//               Don't have a shop? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
//             </p>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }


import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";           // ← Use api, not auth
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, AlertTriangle, Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.auth.login({ email, password });

      

      if (res.ok) {
        // Save authentication data
        localStorage.setItem("token", res.token);
        localStorage.setItem("currentShop", JSON.stringify(res.shop));

        alert("Login successful! 🎉");
        navigate({ to: "/" });        // Change if your dashboard route is different
      } else {
        setError(res.error || "Invalid email or password");
      }
    } catch (err) {
      console.error(err);
      setError("Cannot connect to server. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-md glass-card border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg gold-gradient">
            <Gem className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-heading text-2xl gold-text">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your shop ERP</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="shop@example.com" 
                required 
              />
            </div>

            <div className="grid gap-2">
              <Label>Password</Label>
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Don't have a shop?{" "}
              <Link to="/signup" className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}