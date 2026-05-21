

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Package, Layers, Users, ShoppingCart,
  Warehouse, Receipt, FileText, Shield, Bell, Menu, Gem, LogOut,
} from "lucide-react";
import { alertStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/product-types", label: "Product Types", icon: Layers },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/stock", label: "Stock", icon: Warehouse },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/restrictions", label: "Restrictions", icon: Shield },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is authenticated using token
  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentShop = localStorage.getItem("currentShop");

    if (!token || !currentShop) {
      navigate({ to: "/login", replace: true });
      return;
    }

    try {
      setShop(JSON.parse(currentShop));
      setAuthChecked(true);
    } catch (err) {
      console.error("Invalid shop data");
      localStorage.removeItem("token");
      localStorage.removeItem("currentShop");
      navigate({ to: "/login", replace: true });
    }
  }, [navigate]);

  // Fetch unread alerts
  const refreshAlerts = useCallback(async () => {
    if (!authChecked) return;
    try {
      const res = await alertStore.getUnread();
      setUnreadCount(Array.isArray(res) ? res.length : 0);
    } catch (err) {
      setUnreadCount(0);
    }
  }, [authChecked]);

  useEffect(() => {
    if (authChecked) {
      refreshAlerts();
      const interval = setInterval(refreshAlerts, 30000); // every 30 seconds
      return () => clearInterval(interval);
    }
  }, [authChecked, refreshAlerts]);

  const handleMarkAllRead = async () => {
    try {
      await alertStore.markAllRead();
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentShop");
    navigate({ to: "/login", replace: true });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gold-gradient shrink-0">
            <Gem className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="font-heading text-lg font-bold text-sidebar-foreground truncate">
              {shop?.shopName || "Jewel ERP"}
            </h1>
            <p className="text-xs text-muted-foreground truncate">{shop?.email}</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" 
              ? location.pathname === "/" 
              : location.pathname.startsWith(to);

            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 py-3 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            onClick={handleMarkAllRead}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}