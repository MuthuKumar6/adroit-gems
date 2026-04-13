import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Package, Layers, Users, ShoppingCart,
  Warehouse, Receipt, FileText, Shield, Bell, Menu, X, Gem,
} from "lucide-react";
import { alertStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";

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
  const location = useLocation();
  const unreadAlerts = typeof window !== 'undefined' ? alertStore.getUnread().length : 0;

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-3 p-6 border-b border-sidebar-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gold-gradient">
            <Gem className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold text-sidebar-foreground">JewelERP</h1>
            <p className="text-xs text-muted-foreground">Wholesale Manager</p>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <a
                key={to}
                href={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {label === "Orders" && unreadAlerts > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0">
                    {unreadAlerts}
                  </Badge>
                )}
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-border bg-background/95 backdrop-blur px-4 py-3 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-muted-foreground hover:text-foreground transition-colors" onClick={() => alertStore.markAllRead()}>
            <Bell className="h-5 w-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground">
                {unreadAlerts}
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
