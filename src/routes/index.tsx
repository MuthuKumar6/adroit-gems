// import { createFileRoute } from "@tanstack/react-router";
// import { AppLayout } from "@/components/AppLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { productStore, productTypeStore, customerStore, orderStore, billStore, alertStore, initializeSeedData } from "@/lib/store";
// import { useState, useEffect } from "react";
// import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Warehouse } from "lucide-react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
// import { Badge } from "@/components/ui/badge";

// export const Route = createFileRoute("/")({
//   component: DashboardPage,
// });

// function DashboardPage() {
//   const [, setTick] = useState(0);

//   useEffect(() => {
//     initializeSeedData();
//     setTick(t => t + 1);
//   }, []);

//   const products = productStore.getAll();
//   const productTypes = productTypeStore.getAll();
//   const customers = customerStore.getAll();
//   const orders = orderStore.getAll();
//   const bills = billStore.getAll();
//   const alerts = alertStore.getUnread();

//   const totalRevenue = bills.reduce((s, b) => s + b.totalAmount, 0);
//   const totalStockWeight = productTypes.reduce((s, pt) => s + pt.inStock * pt.netWeight, 0);
//   const pendingOrders = orders.filter(o => o.status === 'pending').length;
//   const lowStockItems = productTypes.filter(pt => pt.inStock <= 3).length;

//   const stats = [
//     { label: "Total Products", value: productTypes.length, icon: Package, color: "text-primary" },
//     { label: "Customers", value: customers.length, icon: Users, color: "text-chart-2" },
//     { label: "Orders", value: orders.length, icon: ShoppingCart, color: "text-chart-3" },
//     { label: "Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-chart-1" },
//     { label: "Stock Weight", value: `${totalStockWeight.toFixed(1)}g`, icon: Warehouse, color: "text-chart-5" },
//     { label: "Pending Orders", value: pendingOrders, icon: AlertTriangle, color: "text-warning" },
//   ];

//   const orderStatusData = [
//     { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
//     { name: 'Approved', value: orders.filter(o => o.status === 'approved').length },
//     { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
//     { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
//   ].filter(d => d.value > 0);

//   const stockByType = productTypes.map(pt => ({
//     name: pt.name.length > 12 ? pt.name.slice(0, 12) + '…' : pt.name,
//     inStock: pt.inStock,
//     total: pt.quantity,
//   }));

//   const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];

//   return (
//     <AppLayout>
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Dashboard</h1>
//           <p className="text-muted-foreground text-sm mt-1">Overview of your jewellery business</p>
//         </div>

//         {/* Alerts */}
//         {alerts.length > 0 && (
//           <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
//             <div className="flex items-center gap-2 text-warning mb-2">
//               <AlertTriangle className="h-4 w-4" />
//               <span className="text-sm font-semibold">Stock Alerts ({alerts.length})</span>
//             </div>
//             <div className="space-y-1">
//               {alerts.slice(0, 3).map(a => (
//                 <p key={a.id} className="text-xs text-muted-foreground">{a.message}</p>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
//           {stats.map(s => (
//             <Card key={s.label} className="glass-card border-border/50">
//               <CardContent className="p-4">
//                 <div className="flex items-center justify-between mb-2">
//                   <s.icon className={`h-4 w-4 ${s.color}`} />
//                 </div>
//                 <p className="text-xl font-bold font-heading">{s.value}</p>
//                 <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <Card className="glass-card border-border/50">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">Stock by Product Type</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="h-64">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={stockByType}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
//                     <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
//                     <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
//                     <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
//                     <Bar dataKey="inStock" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
//                     <Bar dataKey="total" fill="var(--chart-5)" radius={[4, 4, 0, 0]} opacity={0.4} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="glass-card border-border/50">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">Order Status</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="h-64 flex items-center justify-center">
//                 {orderStatusData.length > 0 ? (
//                   <ResponsiveContainer width="100%" height="100%">
//                     <PieChart>
//                       <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
//                         {orderStatusData.map((_, i) => (
//                           <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
//                     </PieChart>
//                   </ResponsiveContainer>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No orders yet</p>
//                 )}
//               </div>
//               <div className="flex flex-wrap gap-3 justify-center mt-2">
//                 {orderStatusData.map((d, i) => (
//                   <div key={d.name} className="flex items-center gap-1.5">
//                     <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
//                     <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Recent Orders & Low Stock */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <Card className="glass-card border-border/50">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">Recent Orders</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {orders.slice(-5).reverse().map(o => {
//                   const customer = customerStore.getById(o.customerId);
//                   return (
//                     <a key={o.id} href="/orders" className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors">
//                       <div>
//                         <p className="text-sm font-medium">{o.orderNumber}</p>
//                         <p className="text-xs text-muted-foreground">{customer?.name}</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="text-sm font-medium">₹{o.totalAmount.toLocaleString('en-IN')}</p>
//                         <Badge variant={o.status === 'pending' ? 'outline' : o.status === 'cancelled' ? 'destructive' : 'default'} className="text-[10px]">
//                           {o.status}
//                         </Badge>
//                       </div>
//                     </a>
//                   );
//                 })}
//                 {orders.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No orders yet</p>}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="glass-card border-border/50">
//             <CardHeader className="pb-2">
//               <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {productTypes.filter(pt => pt.inStock <= 3).map(pt => {
//                   const product = productStore.getById(pt.productId);
//                   return (
//                     <div key={pt.id} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/20">
//                       <div>
//                         <p className="text-sm font-medium">{pt.name}</p>
//                         <p className="text-xs text-muted-foreground">{product?.name} • {pt.netWeight}g each</p>
//                       </div>
//                       <Badge variant="destructive" className="text-xs">{pt.inStock} left</Badge>
//                     </div>
//                   );
//                 })}
//                 {lowStockItems === 0 && <p className="text-sm text-muted-foreground text-center py-4">All items well stocked</p>}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }


import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { productStore, productTypeStore, customerStore, orderStore, billStore, alertStore, initializeSeedData } from "@/lib/store";
import { useState, useEffect } from "react";
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Warehouse, Clock, CheckCircle, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const [, setTick] = useState(0);

  useEffect(() => {
    initializeSeedData();
    setTick(t => t + 1);
  }, []);

  const productTypes = productTypeStore.getAll();
  const orders = orderStore.getAll();
  const customers = customerStore.getAll();
  const bills = billStore.getAll();
  const alerts = alertStore.getUnread();

  const totalRevenue = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalStockWeight = productTypes.reduce((s, pt) => s + pt.inStock * pt.netWeight, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const lowStockCount = productTypes.filter(pt => pt.inStock <= 3).length;

  const stats = [
    { label: "Total Product Types", value: productTypes.length, icon: Package, color: "text-primary" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-chart-2" },
    { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-chart-3" },
    { label: "Revenue", value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: "text-chart-1" },
    { label: "Total Stock Weight", value: `${totalStockWeight.toFixed(1)}g`, icon: Warehouse, color: "text-chart-5" },
    { label: "Pending Orders", value: pendingOrdersCount, icon: AlertTriangle, color: "text-warning" },
  ];

  // Order Status Pie
  const orderStatusData = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length },
    { name: 'Approved', value: orders.filter(o => o.status === 'approved').length },
    { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length },
    { name: 'Cancelled', value: orders.filter(o => o.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];

  // === DETAILED INVENTORY PER PRODUCT TYPE ===
  const inventoryData = productTypes.map(pt => {
    const product = productStore.getById(pt.productId);

    // Calculate ordered quantity for this product type (only pending + approved)
    const orderedQty = orders
      .filter(o => ['pending', 'approved'].includes(o.status))
      .reduce((sum, order) => {
        const item = order.items.find(i => i.productTypeId === pt.id);
        return sum + (item?.quantity || 0);
      }, 0);

    return {
      ...pt,
      productName: product?.name || 'Unknown',
      inStock: pt.inStock,
      ordered: orderedQty,
      availableAfterOrders: Math.max(0, pt.inStock - orderedQty),
      totalQuantity: pt.quantity,
    };
  });

  // For expandable ordered customers
  const [expandedPt, setExpandedPt] = useState<string | null>(null);

  const getOrdersForProductType = (productTypeId: string) => {
    return orders
      .filter(o => ['pending', 'approved'].includes(o.status))
      .filter(o => o.items.some(item => item.productTypeId === productTypeId))
      .map(order => {
        const customer = customerStore.getById(order.customerId);
        const item = order.items.find(i => i.productTypeId === productTypeId);
        return {
          orderNumber: order.orderNumber,
          customerName: customer?.name || 'Unknown',
          customerPhone: customer?.phone,
          quantity: item?.quantity || 0,
          status: order.status,
        };
      });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold gold-text">Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of your jewellery business — Inventory + Orders + Stock Flow</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-semibold">Stock Alerts ({alerts.length})</span>
            </div>
            {alerts.slice(0, 3).map(a => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.message}</p>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map(s => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-2xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Total Available Pieces</CardTitle></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{productTypes.reduce((s, pt) => s + pt.inStock, 0)}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle>Stock Reserved for Orders</CardTitle></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-600">
                {orders
                  .filter(o => ['pending', 'approved'].includes(o.status))
                  .reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle>Low Stock Items</CardTitle></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-destructive">{lowStockCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stock Levels Bar Chart */}
          <Card className="glass-card">
            <CardHeader><CardTitle>Stock Levels by Product Type</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="inStock" fill="var(--chart-1)" name="In Stock" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ordered" fill="var(--chart-3)" name="Ordered" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Order Status Pie */}
          <Card className="glass-card">
            <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
            <CardContent className="h-80 flex flex-col items-center justify-center">
              {orderStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value">
                        {orderStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 justify-center mt-4">
                    {orderStatusData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-sm">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p>No orders placed yet</p>}
            </CardContent>
          </Card>
        </div>

        {/* === MAIN INVENTORY TABLE - Total Qty with Ordered / Unordered === */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Inventory Overview — Stock vs Ordered
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Click on any row with Ordered Qty &gt; 0 to see which customers ordered it
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Type</TableHead>
                  <TableHead>Base Product</TableHead>
                  <TableHead className="text-right">Total Qty</TableHead>
                  <TableHead className="text-right">In Stock</TableHead>
                  <TableHead className="text-right text-amber-600">Ordered Qty</TableHead>
                  <TableHead className="text-right">Available After Orders</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map(pt => {
                  const hasOrders = pt.ordered > 0;
                  const isExpanded = expandedPt === pt.id;
                  const orderedCustomers = getOrdersForProductType(pt.id);

                  return (
                    <>
                      <TableRow key={pt.id} className={hasOrders ? "cursor-pointer hover:bg-accent/50" : ""}
                        onClick={() => hasOrders && setExpandedPt(isExpanded ? null : pt.id)}>
                        <TableCell className="font-medium">{pt.name}</TableCell>
                        <TableCell className="text-muted-foreground">{pt.productName}</TableCell>
                        <TableCell className="text-right font-medium">{pt.totalQuantity}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{pt.inStock}</TableCell>
                        <TableCell className="text-right font-medium text-amber-600">
                          {pt.ordered > 0 ? pt.ordered : '—'}
                        </TableCell>
                        <TableCell className="text-right">{pt.availableAfterOrders}</TableCell>
                        <TableCell>
                          {hasOrders && (
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>

                      {/* Expanded Customer Details */}
                      {hasOrders && isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0 bg-muted/30">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent className="p-4 border-t">
                                <p className="text-sm font-medium mb-3">Customers who ordered <span className="text-amber-600">{pt.name}</span></p>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Order No.</TableHead>
                                      <TableHead>Customer</TableHead>
                                      <TableHead>Phone</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      <TableHead>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {orderedCustomers.map((oc, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>{oc.orderNumber}</TableCell>
                                        <TableCell>{oc.customerName}</TableCell>
                                        <TableCell>{oc.customerPhone}</TableCell>
                                        <TableCell className="text-right font-medium">{oc.quantity}</TableCell>
                                        <TableCell>
                                          <Badge variant={oc.status === 'pending' ? 'outline' : 'default'}>
                                            {oc.status}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </CollapsibleContent>
                            </Collapsible>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders & Low Stock Side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orders */}
          <Card className="glass-card">
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(-6).reverse().map(o => {
                  const customer = customerStore.getById(o.customerId);
                  return (
                    <a key={o.id} href="/orders" className="block p-3 rounded-lg hover:bg-accent/50 transition-all">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{o.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">{customer?.name}</p>
                        </div>
                        <div className="text-right">
                          <p>₹{o.totalAmount.toLocaleString('en-IN')}</p>
                          <Badge variant={o.status === 'pending' ? "outline" : o.status === 'cancelled' ? "destructive" : "default"}>
                            {o.status}
                          </Badge>
                        </div>
                      </div>
                    </a>
                  );
                })}
                {orders.length === 0 && <p className="text-center py-8 text-muted-foreground">No orders yet</p>}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card className="glass-card">
            <CardHeader><CardTitle>Low Stock Items</CardTitle></CardHeader>
            <CardContent>
              {lowStockCount > 0 ? (
                <div className="space-y-3">
                  {productTypes.filter(pt => pt.inStock <= 3).map(pt => (
                    <div key={pt.id} className="flex justify-between items-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div>
                        <p className="font-medium">{pt.name}</p>
                        <p className="text-xs text-muted-foreground">{pt.netWeight}g each</p>
                      </div>
                      <Badge variant="destructive">{pt.inStock} left</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-10 text-green-600">✅ All items are well stocked</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}