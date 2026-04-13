import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { productStore, productTypeStore, customerStore, orderStore, billStore, alertStore, initializeSeedData } from "@/lib/store";
import { useState, useEffect } from "react";
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Warehouse } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initializeSeedData();
    setTick(t => t + 1);
  }, []);

  const products = productStore.getAll();
  const productTypes = productTypeStore.getAll();
  const customers = customerStore.getAll();
  const orders = orderStore.getAll();
  const bills = billStore.getAll();
  const alerts = alertStore.getUnread();

  const totalRevenue = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalStockWeight = productTypes.reduce((s, pt) => s + pt.inStock * pt.netWeight, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const lowStockItems = productTypes.filter(pt => pt.inStock <= 3).length;

  const stats = [
    { label: "Total Products", value: productTypes.length, icon: Package, color: "text-primary" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-chart-2" },
    { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-chart-3" },
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-chart-1" },
    { label: "Stock Weight", value: `${totalStockWeight.toFixed(1)}g`, icon: Warehouse, color: "text-chart-5" },
    { label: "Pending Orders", value: pendingOrders, icon: AlertTriangle, color: "text-warning" },
  ];

  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Approved', value: orders.filter(o => o.status === 'approved').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const stockByType = productTypes.map(pt => ({
    name: pt.name.length > 12 ? pt.name.slice(0, 12) + '…' : pt.name,
    inStock: pt.inStock,
    total: pt.quantity,
  }));

  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your jewellery business</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-semibold">Stock Alerts ({alerts.length})</span>
            </div>
            <div className="space-y-1">
              {alerts.slice(0, 3).map(a => (
                <p key={a.id} className="text-xs text-muted-foreground">{a.message}</p>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="glass-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock by Product Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                    <Bar dataKey="inStock" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total" fill="var(--chart-5)" radius={[4, 4, 0, 0]} opacity={0.4} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                {orderStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {orderStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {orderStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(-5).reverse().map(o => {
                  const customer = customerStore.getById(o.customerId);
                  return (
                    <a key={o.id} href="/orders" className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="text-sm font-medium">{o.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">{customer?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">₹{o.totalAmount.toLocaleString('en-IN')}</p>
                        <Badge variant={o.status === 'pending' ? 'outline' : o.status === 'cancelled' ? 'destructive' : 'default'} className="text-[10px]">
                          {o.status}
                        </Badge>
                      </div>
                    </a>
                  );
                })}
                {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productTypes.filter(pt => pt.inStock <= 3).map(pt => {
                  const product = productStore.getById(pt.productId);
                  return (
                    <div key={pt.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div>
                        <p className="text-sm font-medium">{pt.name}</p>
                        <p className="text-xs text-muted-foreground">{product?.name} • {pt.netWeight}g each</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">{pt.inStock} left</Badge>
                    </div>
                  );
                })}
                {lowStockItems === 0 && <p className="text-sm text-muted-foreground text-center py-4">All items well stocked</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
