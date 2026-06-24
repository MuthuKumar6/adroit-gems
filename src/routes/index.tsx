// import { createFileRoute } from '@tanstack/react-router';
// import { AppLayout } from "@/components/AppLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import {
//   useProducts,
//   useProductTypes,
//   useCustomers,
//   useOrders,
//   useBills,
//   useUnreadAlerts,
// } from "@/lib/queries";
// import { useState, useEffect, useMemo, Fragment } from "react";
// import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Warehouse, Clock, CheckCircle, Eye } from "lucide-react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
// import { Badge } from "@/components/ui/badge";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
// import type { Product, ProductType, Customer, Order, Bill } from "@/lib/types";

// // Tolerant numeric reader — handles both snake_case (API) and camelCase shapes.
// const num = (v: any) => Number(v ?? 0) || 0;
// const billTotal = (b: any) => num(b?.total_amount ?? b?.totalAmount);
// const orderTotal = (o: any) => num(o?.total_amount ?? o?.totalAmount);

// export const Route = createFileRoute("/")({
//   component: DashboardPage,
// });

// type CustomerMap = Record<string, Customer>;
// type ProductMap = Record<string, Product>;

// function DashboardPage() {
//   const productTypesQ = useProductTypes();
//   const ordersQ = useOrders();
//   const customersQ = useCustomers();
//   const billsQ = useBills();
//   const alertsQ = useUnreadAlerts();
//   const productsQ = useProducts();

//   const productTypes: ProductType[] = productTypesQ.data ?? [];
//   const orders: Order[] = ordersQ.data ?? [];
//   const customers: Customer[] = customersQ.data ?? [];
//   const bills: Bill[] = billsQ.data ?? [];
//   const alerts: any[] = alertsQ.data ?? [];
//   const products: Product[] = productsQ.data ?? [];

//   const loading =
//     productTypesQ.isLoading ||
//     ordersQ.isLoading ||
//     customersQ.isLoading ||
//     billsQ.isLoading ||
//     productsQ.isLoading;

//   const customerMap = useMemo<CustomerMap>(() => {
//     const m: CustomerMap = {};
//     customers.forEach((c) => { m[c.id] = c; });
//     return m;
//   }, [customers]);

//   const productMap = useMemo<ProductMap>(() => {
//     const m: ProductMap = {};
//     products.forEach((p) => { p && (m[p.id] = p); });
//     return m;
//   }, [products]);

//   // Countdown ticker (1s)
//   const [, setNowTick] = useState(0);
//   useEffect(() => {
//     const ticker = setInterval(() => setNowTick((n) => n + 1), 1000);
//     return () => clearInterval(ticker);
//   }, []);


//   // ── Derived values (all synchronous from state) ─────────
//   // Derived values — tolerate snake_case and camelCase API shapes.
//   const totalRevenue = bills.reduce((s, b: any) => s + billTotal(b), 0);
//   const totalStockWeight = productTypes.reduce((s, pt) => s + pt.in_stock * pt.net_weight, 0);
//   const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
//   const lowStockCount = productTypes.filter((pt) => pt.in_stock <= 3).length;


//   const stats = [
//     { label: "Total Product Types", value: productTypes.length, icon: Package, color: "text-primary" },
//     { label: "Customers", value: customers.length, icon: Users, color: "text-chart-2" },
//     { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-chart-3" },
//     { label: "Revenue", value: `₹${Number(totalRevenue).toLocaleString()}`, icon: TrendingUp, color: "text-chart-1" },
//     { label: "Total Stock Weight", value: `${totalStockWeight.toFixed(1)}g`, icon: Warehouse, color: "text-chart-5" },
//     { label: "Pending Orders", value: pendingOrdersCount, icon: AlertTriangle, color: "text-warning" },
//   ];

//   const orderStatusData = [
//     { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
//     { name: 'Approved', value: orders.filter((o) => o.status === 'approved').length },
//     { name: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
//     { name: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length },
//   ].filter((d) => d.value > 0);

//   const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];


//   // ── Inventory table data ────────────────────────────────
//   const inventoryData = productTypes.map((pt) => {
//     const orderedQty = orders
//       .filter((o) => ['pending', 'approved'].includes(o.status))
//       .reduce((sum, order) => {
//         const items = order.items ?? [];                          // ← guard
//         const item = items.find((i) => i.product_type_id === pt.id);
//         return sum + (item?.quantity || 0);
//       }, 0);
//     return {
//       ...pt,
//       productName: productMap[pt.product_id]?.name || 'Unknown',
//       ordered: orderedQty,
//       availableAfterOrders: Math.max(0, pt.in_stock - orderedQty),
//       totalQuantity: pt.quantity,
//     };
//   });


//   // ── Reserved stock items ────────────────────────────────
//   const reservedStockItems = orders
//     .filter((o) => ['pending', 'approved'].includes(o.status))
//     .flatMap((order) =>
//       order.items.map((item) => {
//         const pt = productTypes.find((p) => p.id === item.product_type_id);
//         return {
//           orderNumber: order.order_number,
//           customerName: customerMap[order.customer_id]?.name || 'Unknown',
//           productTypeName: pt?.name || 'Unknown',
//           quantity: item.quantity,
//           netWeight: pt?.net_weight || 0,
//         };
//       })
//     );

//   // ── Expandable inventory rows ───────────────────────────
//   const [expandedPt, setExpandedPt] = useState<string | null>(null);

//   const getOrdersForProductType = (productTypeId: string) =>
//     orders
//       .filter((o) => ['pending', 'approved'].includes(o.status))
//       .filter((o) => o.items.some((item) => item.productTypeId === productTypeId))
//       .map((order) => {
//         const item = order.items.find((i) => i.productTypeId === productTypeId);
//         return {
//           orderNumber: order.order_number,
//           customerName: customerMap[order.customer_id]?.name || 'Unknown',
//           customerPhone: customerMap[order.customer_id]?.phone,
//           quantity: item?.quantity || 0,
//           status: order.status,
//         };
//       });

//   // ── Countdown helpers ───────────────────────────────────
//   const fmtCountdown = (ms: number) => {
//     if (ms <= 0) return '0s';
//     const s = Math.floor(ms / 1000);
//     const h = Math.floor(s / 3600);
//     const m = Math.floor((s % 3600) / 60);
//     const sec = s % 60;
//     return `${h}h ${m}m ${sec}s`;
//   };
//   const fmtLate = (ms: number) => {
//     const s = Math.floor(ms / 1000);
//     const d = Math.floor(s / 86400);
//     const h = Math.floor((s % 86400) / 3600);
//     const m = Math.floor((s % 3600) / 60);
//     if (d > 0) return `${d}d ${h}h late`;
//     if (h > 0) return `${h}h ${m}m late`;
//     return `${m}m late`;
//   };

//   // ── Loading state ───────────────────────────────────────
//   if (loading) {
//     return (
//       <AppLayout>
//         <div className="flex items-center justify-center h-64 text-muted-foreground">
//           Loading dashboard…
//         </div>
//       </AppLayout>
//     );
//   }

//   const now = new Date();
//   const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
//   const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

//   const pendingWithDue = orders.filter((o) => o.status === 'pending' && o.payment_due_date);
//   const dueToday = pendingWithDue.filter((o) => {
//     const due = new Date(o.payment_due_date!);
//     return due >= startOfToday && due <= endOfToday && due >= now;
//   });
//   const overdue = pendingWithDue.filter((o) => new Date(o.payment_due_date!) < now);

//   return (
//     <AppLayout>
//       <div className="space-y-6">
//         <div>
//           <h1 className="text-3xl font-heading font-bold gold-text">Dashboard</h1>
//           <p className="text-muted-foreground">Complete overview of your jewellery business — Inventory + Orders + Stock Flow</p>
//         </div>

//         {/* Alerts */}
//         {alerts.length > 0 && (
//           <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
//             <div className="flex items-center gap-2 text-warning mb-2">
//               <AlertTriangle className="h-4 w-4" />
//               <span className="font-semibold">Stock Alerts ({alerts.length})</span>
//             </div>
//             {alerts.slice(0, 3).map((a) => (
//               <p key={a.id} className="text-sm text-muted-foreground">{a.message}</p>
//             ))}
//           </div>
//         )}

//         {/* Payment Due Today / Overdue */}
//         {(dueToday.length > 0 || overdue.length > 0) && (
//           <div className="space-y-3">
//             {dueToday.length > 0 && (
//               <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
//                 <div className="flex items-center gap-2 text-warning mb-2">
//                   <Clock className="h-4 w-4" />
//                   <span className="font-semibold">Payment Due Today ({dueToday.length})</span>
//                 </div>
//                 <div className="space-y-1">
//                   {dueToday.map((o) => {
//                     const due = new Date(o.payment_due_date!);
//                     const remaining = due.getTime() - now.getTime();
//                     return (
//                       <p key={o.id} className="text-sm text-muted-foreground">
//                         <span className="font-medium text-foreground">{customerMap[o.customer_id]?.name || 'Unknown'}</span>
//                         {' '}— Order {o.order_number} — ₹{orderTotal(o).toLocaleString('en-IN')} — Due at{' '}
//                         <span className="font-medium text-foreground">{due.toLocaleTimeString()}</span>
//                         {' '}— <span className="text-warning font-mono">{fmtCountdown(remaining)} left</span>
//                       </p>
//                     );
//                   })}
//                 </div>
//               </div>
//             )}
//             {overdue.length > 0 && (
//               <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
//                 <div className="flex items-center gap-2 text-destructive mb-2">
//                   <Clock className="h-4 w-4" />
//                   <span className="font-semibold">Payment Overdue ({overdue.length})</span>
//                 </div>
//                 <div className="space-y-1">
//                   {overdue.slice(0, 5).map((o) => {
//                     const due = new Date(o.payment_due_date!);
//                     const lateMs = now.getTime() - due.getTime();
//                     return (
//                       <p key={o.id} className="text-sm text-muted-foreground">
//                         <span className="font-medium text-foreground">{customerMap[o.customer_id]?.name || 'Unknown'}</span>
//                         {' '}— Order {o.order_number} — ₹{orderTotal(o).toLocaleString('en-IN')}
//                         {' '}— <span className="text-destructive">Time limit is over ({fmtLate(lateMs)})</span>
//                       </p>
//                     );
//                   })}
//                   {overdue.length > 5 && (
//                     <p className="text-xs text-muted-foreground">+ {overdue.length - 5} more overdue</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Quick Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
//           {stats.map((s) => (
//             <Card key={s.label} className="glass-card">
//               <CardContent className="p-4">
//                 <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
//                 <p className="text-2xl font-bold font-heading">{s.value}</p>
//                 <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Total Available Pieces */}
//           <Card className="glass-card">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <CheckCircle className="h-5 w-5 text-green-600" />
//                 Total Available Pieces
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-4xl font-bold mb-4">
//                 {productTypes.reduce((s, pt) => s + pt.in_stock, 0)}
//               </p>
//               <div className="space-y-2 max-h-60 overflow-auto pr-2">
//                 {productTypes
//                   .filter((pt) => pt.in_stock > 0)
//                   .sort((a, b) => b.in_stock - a.in_stock)
//                   .map((pt) => (
//                     <div key={pt.id} className="flex justify-between text-sm">
//                       <span>{pt.name}</span>
//                       <span className="font-medium text-green-600">{pt.in_stock} pcs</span>
//                     </div>
//                   ))}
//               </div>
//             </CardContent>
//           </Card>

//           {/* Stock Reserved for Orders */}
//           <Card className="glass-card">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Clock className="h-5 w-5 text-amber-600" />
//                 Stock Reserved for Orders
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-4xl font-bold text-amber-600 mb-4">
//                 {orders
//                   .filter((o) => ['pending', 'approved'].includes(o.status))
//                   .reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)}
//               </p>
//               {reservedStockItems.length > 0 ? (
//                 <div className="space-y-3 max-h-60 overflow-auto">
//                   {reservedStockItems.slice(0, 8).map((item, idx) => (
//                     <div key={idx} className="flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/30 p-2 rounded border border-amber-200/50">
//                       <div>
//                         <p className="text-sm font-medium">{item.productTypeName}</p>
//                         <p className="text-xs text-muted-foreground">{item.customerName}</p>
//                       </div>
//                       <div className="text-right">
//                         <p className="font-medium">{item.quantity} pcs</p>
//                         <p className="text-xs text-muted-foreground">{item.netWeight * item.quantity}g</p>
//                       </div>
//                     </div>
//                   ))}
//                   {reservedStockItems.length > 8 && (
//                     <p className="text-xs text-center text-muted-foreground">
//                       + {reservedStockItems.length - 8} more reservations
//                     </p>
//                   )}
//                 </div>
//               ) : (
//                 <p className="text-center py-8 text-muted-foreground">No stock currently reserved for orders</p>
//               )}
//             </CardContent>
//           </Card>

//           {/* Low Stock Items */}
//           <Card className="glass-card">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <AlertTriangle className="h-5 w-5 text-destructive" />
//                 Low Stock Items
//               </CardTitle>
//             </CardHeader>
//             <CardContent>
//               <p className="text-4xl font-bold text-destructive mb-4">{lowStockCount}</p>
//               {lowStockCount > 0 ? (
//                 <div className="space-y-2">
//                   {productTypes
//                     .filter((pt) => pt.in_stock <= 3)
//                     .map((pt) => (
//                       <div key={pt.id} className="flex justify-between p-2 bg-destructive/5 border border-destructive/20 rounded">
//                         <div>
//                           <p className="font-medium text-sm">{pt.name}</p>
//                           <p className="text-xs text-muted-foreground">{pt.net_weight}g each</p>
//                         </div>
//                         <Badge variant="destructive" className="self-center">{pt.in_stock} left</Badge>
//                       </div>
//                     ))}
//                 </div>
//               ) : (
//                 <p className="text-center py-10 text-green-600 font-medium">✅ All product types are well stocked</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Charts */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <Card className="glass-card">
//             <CardHeader><CardTitle>Stock Levels by Product Type</CardTitle></CardHeader>
//             <CardContent className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={inventoryData}>
//                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
//                   <XAxis dataKey="name" tick={{ fontSize: 11 }} />
//                   <YAxis />
//                   <Tooltip />
//                   <Bar dataKey="in_stock" fill="var(--chart-1)" name="In Stock" radius={[4, 4, 0, 0]} />
//                   <Bar dataKey="ordered" fill="var(--chart-3)" name="Ordered" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             </CardContent>
//           </Card>

//           <Card className="glass-card">
//             <CardHeader><CardTitle>Order Status</CardTitle></CardHeader>
//             <CardContent className="h-80 flex flex-col items-center justify-center">
//               {orderStatusData.length > 0 ? (
//                 <>
//                   <ResponsiveContainer width="100%" height={240}>
//                     <PieChart>
//                       <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} dataKey="value">
//                         {orderStatusData.map((_, i) => (
//                           <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
//                         ))}
//                       </Pie>
//                       <Tooltip />
//                     </PieChart>
//                   </ResponsiveContainer>
//                   <div className="flex flex-wrap gap-4 justify-center mt-4">
//                     {orderStatusData.map((d, i) => (
//                       <div key={d.name} className="flex items-center gap-2">
//                         <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
//                         <span className="text-sm">{d.name} ({d.value})</span>
//                       </div>
//                     ))}
//                   </div>
//                 </>
//               ) : (
//                 <p>No orders placed yet</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>

//         {/* Inventory Overview Table */}
//         <Card className="glass-card">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Warehouse className="h-5 w-5" />
//               Inventory Overview — Stock vs Ordered
//             </CardTitle>
//             <p className="text-sm text-muted-foreground">
//               Click on any row with Ordered Qty &gt; 0 to see which customers ordered it
//             </p>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Product Type</TableHead>
//                   <TableHead>Base Product</TableHead>
//                   <TableHead className="text-right">Total Qty</TableHead>
//                   <TableHead className="text-right">In Stock</TableHead>
//                   <TableHead className="text-right text-amber-600">Ordered Qty</TableHead>
//                   <TableHead className="text-right">Available After Orders</TableHead>
//                   <TableHead></TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {inventoryData.map((pt) => {
//                   const hasOrders = pt.ordered > 0;
//                   const isExpanded = expandedPt === pt.id;
//                   const orderedCustomers = getOrdersForProductType(pt.id);

//                   return (
//                     <Fragment key={pt.id}>
//                       <TableRow
//                         className={hasOrders ? "cursor-pointer hover:bg-accent/50" : ""}
//                         onClick={() => hasOrders && setExpandedPt(isExpanded ? null : pt.id)}
//                       >
//                         <TableCell className="font-medium">{pt.name}</TableCell>
//                         <TableCell className="text-muted-foreground">{pt.productName}</TableCell>
//                         <TableCell className="text-right font-medium">{pt.totalQuantity}</TableCell>
//                         <TableCell className="text-right font-medium text-green-600">{pt.in_stock}</TableCell>
//                         <TableCell className="text-right font-medium text-amber-600">
//                           {pt.ordered > 0 ? pt.ordered : '—'}
//                         </TableCell>
//                         <TableCell className="text-right">{pt.availableAfterOrders}</TableCell>
//                         <TableCell>
//                           {hasOrders && (
//                             <Button variant="ghost" size="sm">
//                               <Eye className="h-4 w-4" />
//                             </Button>
//                           )}
//                         </TableCell>
//                       </TableRow>

//                       {hasOrders && isExpanded && (
//                         <TableRow>
//                           <TableCell colSpan={7} className="p-0 bg-muted/30">
//                             <Collapsible open={isExpanded}>
//                               <CollapsibleContent className="p-4 border-t">
//                                 <p className="text-sm font-medium mb-3">
//                                   Customers who ordered <span className="text-amber-600">{pt.name}</span>
//                                 </p>
//                                 <Table>
//                                   <TableHeader>
//                                     <TableRow>
//                                       <TableHead>Order No.</TableHead>
//                                       <TableHead>Customer</TableHead>
//                                       <TableHead>Phone</TableHead>
//                                       <TableHead className="text-right">Qty</TableHead>
//                                       <TableHead>Status</TableHead>
//                                     </TableRow>
//                                   </TableHeader>
//                                   <TableBody>
//                                     {orderedCustomers.map((oc, idx) => (
//                                       <TableRow key={idx}>
//                                         <TableCell>{oc.orderNumber}</TableCell>
//                                         <TableCell>{oc.customerName}</TableCell>
//                                         <TableCell>{oc.customerPhone}</TableCell>
//                                         <TableCell className="text-right font-medium">{oc.quantity}</TableCell>
//                                         <TableCell>
//                                           <Badge variant={oc.status === 'pending' ? 'outline' : 'default'}>
//                                             {oc.status}
//                                           </Badge>
//                                         </TableCell>
//                                       </TableRow>
//                                     ))}
//                                   </TableBody>
//                                 </Table>
//                               </CollapsibleContent>
//                             </Collapsible>
//                           </TableCell>
//                         </TableRow>
//                       )}
//                     </Fragment>
//                   );
//                 })}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>

//         {/* Recent Orders & Low Stock */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//           <Card className="glass-card">
//             <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {orders.slice(-6).reverse().map((o) => (
//                   <a key={o.id} href="/orders" className="block p-3 rounded-lg hover:bg-accent/50 transition-all">
//                     <div className="flex justify-between">
//                       <div>
//                         <p className="font-medium">{o.order_number}</p>
//                         <p className="text-sm text-muted-foreground">{customerMap[o.customer_id]?.name}</p>
//                       </div>
//                       <div className="text-right">
//                         <p>₹{orderTotal(o).toLocaleString('en-IN')}</p>
//                         <Badge variant={o.status === 'pending' ? "outline" : o.status === 'cancelled' ? "destructive" : "default"}>
//                           {o.status}
//                         </Badge>
//                       </div>
//                     </div>
//                   </a>
//                 ))}
//                 {orders.length === 0 && (
//                   <p className="text-center py-8 text-muted-foreground">No orders yet</p>
//                 )}
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="glass-card">
//             <CardHeader><CardTitle>Low Stock Items</CardTitle></CardHeader>
//             <CardContent>
//               {lowStockCount > 0 ? (
//                 <div className="space-y-3">
//                   {productTypes.filter((pt) => pt.in_stock <= 3).map((pt) => (
//                     <div key={pt.id} className="flex justify-between items-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
//                       <div>
//                         <p className="font-medium">{pt.name}</p>
//                         <p className="text-xs text-muted-foreground">{pt.net_weight}g each</p>
//                       </div>
//                       <Badge variant="destructive">{pt.in_stock} left</Badge>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center py-10 text-green-600">✅ All items are well stocked</p>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }


import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useProducts,
  useProductTypes,
  useCustomers,
  useOrders,
  useBills,
  useUnreadAlerts,
} from "@/lib/queries";
import { useState, useEffect, useMemo, Fragment } from "react";
import { Package, Users, ShoppingCart, TrendingUp, AlertTriangle, Warehouse, Clock, CheckCircle, Eye } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { Product, ProductType, Customer, Order, Bill } from "@/lib/types";

// Tolerant numeric reader — handles both snake_case (API) and camelCase shapes.
const num = (v: any) => Number(v ?? 0) || 0;
const billTotal = (b: any) => num(b?.total_amount ?? b?.totalAmount);
const orderTotal = (o: any) => num(o?.total_amount ?? o?.totalAmount);

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

type CustomerMap = Record<string, Customer>;
type ProductMap = Record<string, Product>;

function DashboardPage() {
  const productTypesQ = useProductTypes();
  const ordersQ = useOrders();
  const customersQ = useCustomers();
  const billsQ = useBills();
  const alertsQ = useUnreadAlerts();
  const productsQ = useProducts();

  const productTypes: ProductType[] = productTypesQ.data ?? [];
  const orders: Order[] = ordersQ.data ?? [];
  const customers: Customer[] = customersQ.data ?? [];
  const bills: Bill[] = billsQ.data ?? [];
  const alerts: any[] = alertsQ.data ?? [];
  const products: Product[] = productsQ.data ?? [];

  const loading =
    productTypesQ.isLoading ||
    ordersQ.isLoading ||
    customersQ.isLoading ||
    billsQ.isLoading ||
    productsQ.isLoading;

  const customerMap = useMemo<CustomerMap>(() => {
    const m: CustomerMap = {};
    customers.forEach((c) => { m[c.id] = c; });
    return m;
  }, [customers]);

  const productMap = useMemo<ProductMap>(() => {
    const m: ProductMap = {};
    products.forEach((p) => { p && (m[p.id] = p); });
    return m;
  }, [products]);

  // Countdown ticker (1s)
  const [, setNowTick] = useState(0);
  useEffect(() => {
    const ticker = setInterval(() => setNowTick((n) => n + 1), 1000);
    return () => clearInterval(ticker);
  }, []);


  // ── Derived values (all synchronous from state) ─────────
  // Derived values — tolerate snake_case and camelCase API shapes.
  const totalRevenue = bills.reduce((s, b: any) => s + billTotal(b), 0);
  const totalStockWeight = productTypes.reduce((s, pt) => s + pt.in_stock * pt.net_weight, 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
  const lowStockCount = productTypes.filter((pt) => pt.in_stock <= 3).length;


  const stats = [
    { label: "Total Product Types", value: productTypes.length, icon: Package, color: "text-primary" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-chart-2" },
    { label: "Total Orders", value: orders.length, icon: ShoppingCart, color: "text-chart-3" },
    { label: "Revenue", value: `₹${Number(totalRevenue).toLocaleString()}`, icon: TrendingUp, color: "text-chart-1" },
    { label: "Total Stock Weight", value: `${totalStockWeight.toFixed(1)}g`, icon: Warehouse, color: "text-chart-5" },
    { label: "Pending Orders", value: pendingOrdersCount, icon: AlertTriangle, color: "text-warning" },
  ];

  const orderStatusData = [
    { name: 'Pending', value: orders.filter((o) => o.status === 'pending').length },
    { name: 'Approved', value: orders.filter((o) => o.status === 'approved').length },
    { name: 'Delivered', value: orders.filter((o) => o.status === 'delivered').length },
    { name: 'Cancelled', value: orders.filter((o) => o.status === 'cancelled').length },
  ].filter((d) => d.value > 0);

  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-5)'];


  // ── Inventory table data ────────────────────────────────
  const inventoryData = productTypes.map((pt) => {
    const orderedQty = orders
      .filter((o) => ['pending', 'approved'].includes(o.status))
      .reduce((sum, order) => {
        const items = order.items ?? [];
        const item = items.find((i) => i.product_type_id === pt.id);
        return sum + (item?.quantity || 0);
      }, 0);
    return {
      ...pt,
      productName: productMap[pt.product_id]?.name || 'Unknown',
      ordered: orderedQty,
      availableAfterOrders: Math.max(0, pt.in_stock - orderedQty),
      totalQuantity: pt.quantity,
    };
  });


  // ── Reserved stock items ────────────────────────────────
  const reservedStockItems = orders
    .filter((o) => ['pending', 'approved'].includes(o.status))
    .flatMap((order) =>
      (order.items ?? []).map((item) => {
        const pt = productTypes.find((p) => p.id === item.product_type_id);
        return {
          orderNumber: order.order_number,
          customerName: customerMap[order.customer_id]?.name || 'Unknown',
          productTypeName: pt?.name || 'Unknown',
          quantity: item.quantity,
          netWeight: pt?.net_weight || 0,
        };
      })
    );

  // ── Expandable inventory rows ───────────────────────────
  const [expandedPt, setExpandedPt] = useState<string | null>(null);

  const getOrdersForProductType = (productTypeId: string) =>
    orders
      .filter((o) => ['pending', 'approved'].includes(o.status))
      .filter((o) => (o.items ?? []).some((item) => item.product_type_id === productTypeId))
      .map((order) => {
        const item = (order.items ?? []).find((i) => i.product_type_id === productTypeId);
        return {
          orderNumber: order.order_number,
          customerName: customerMap[order.customer_id]?.name || 'Unknown',
          customerPhone: customerMap[order.customer_id]?.phone,
          quantity: item?.quantity || 0,
          status: order.status,
        };
      });

  // ── Countdown helpers ───────────────────────────────────
  const fmtCountdown = (ms: number) => {
    if (ms <= 0) return '0s';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };
  const fmtLate = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h late`;
    if (h > 0) return `${h}h ${m}m late`;
    return `${m}m late`;
  };

  // ── Loading state ───────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading dashboard…
        </div>
      </AppLayout>
    );
  }

  const now = new Date();
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);

  const pendingWithDue = orders.filter((o) => o.status === 'pending' && o.payment_due_date);
  const dueToday = pendingWithDue.filter((o) => {
    const due = new Date(o.payment_due_date!);
    return due >= startOfToday && due <= endOfToday && due >= now;
  });
  const overdue = pendingWithDue.filter((o) => new Date(o.payment_due_date!) < now);

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
            {alerts.slice(0, 3).map((a) => (
              <p key={a.id} className="text-sm text-muted-foreground">{a.message}</p>
            ))}
          </div>
        )}

        {/* Payment Due Today / Overdue */}
        {(dueToday.length > 0 || overdue.length > 0) && (
          <div className="space-y-3">
            {dueToday.length > 0 && (
              <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                <div className="flex items-center gap-2 text-warning mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Payment Due Today ({dueToday.length})</span>
                </div>
                <div className="space-y-1">
                  {dueToday.map((o) => {
                    const due = new Date(o.payment_due_date!);
                    const remaining = due.getTime() - now.getTime();
                    return (
                      <p key={o.id} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{customerMap[o.customer_id]?.name || 'Unknown'}</span>
                        {' '}— Order {o.order_number} — ₹{orderTotal(o).toLocaleString('en-IN')} — Due at{' '}
                        <span className="font-medium text-foreground">{due.toLocaleTimeString()}</span>
                        {' '}— <span className="text-warning font-mono">{fmtCountdown(remaining)} left</span>
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
            {overdue.length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">Payment Overdue ({overdue.length})</span>
                </div>
                <div className="space-y-1">
                  {overdue.slice(0, 5).map((o) => {
                    const due = new Date(o.payment_due_date!);
                    const lateMs = now.getTime() - due.getTime();
                    return (
                      <p key={o.id} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{customerMap[o.customer_id]?.name || 'Unknown'}</span>
                        {' '}— Order {o.order_number} — ₹{orderTotal(o).toLocaleString('en-IN')}
                        {' '}— <span className="text-destructive">Time limit is over ({fmtLate(lateMs)})</span>
                      </p>
                    );
                  })}
                  {overdue.length > 5 && (
                    <p className="text-xs text-muted-foreground">+ {overdue.length - 5} more overdue</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="glass-card">
              <CardContent className="p-4">
                <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                <p className="text-2xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Available Pieces */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Total Available Pieces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold mb-4">
                {productTypes.reduce((s, pt) => s + pt.in_stock, 0)}
              </p>
              <div className="space-y-2 max-h-60 overflow-auto pr-2">
                {productTypes
                  .filter((pt) => pt.in_stock > 0)
                  .sort((a, b) => b.in_stock - a.in_stock)
                  .map((pt) => (
                    <div key={pt.id} className="flex justify-between text-sm">
                      <span>{pt.name}</span>
                      <span className="font-medium text-green-600">{pt.in_stock} pcs</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Stock Reserved for Orders */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Stock Reserved for Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-amber-600 mb-4">
                {orders
                  .filter((o) => ['pending', 'approved'].includes(o.status))
                  .reduce((sum, o) => sum + (o.items ?? []).reduce((iSum, i) => iSum + i.quantity, 0), 0)}
              </p>
              {reservedStockItems.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-auto">
                  {reservedStockItems.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-amber-50/50 dark:bg-amber-950/30 p-2 rounded border border-amber-200/50">
                      <div>
                        <p className="text-sm font-medium">{item.productTypeName}</p>
                        <p className="text-xs text-muted-foreground">{item.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity} pcs</p>
                        <p className="text-xs text-muted-foreground">{item.netWeight * item.quantity}g</p>
                      </div>
                    </div>
                  ))}
                  {reservedStockItems.length > 8 && (
                    <p className="text-xs text-center text-muted-foreground">
                      + {reservedStockItems.length - 8} more reservations
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No stock currently reserved for orders</p>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Items */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-destructive mb-4">{lowStockCount}</p>
              {lowStockCount > 0 ? (
                <div className="space-y-2">
                  {productTypes
                    .filter((pt) => pt.in_stock <= 3)
                    .map((pt) => (
                      <div key={pt.id} className="flex justify-between p-2 bg-destructive/5 border border-destructive/20 rounded">
                        <div>
                          <p className="font-medium text-sm">{pt.name}</p>
                          <p className="text-xs text-muted-foreground">{pt.net_weight}g each</p>
                        </div>
                        <Badge variant="destructive" className="self-center">{pt.in_stock} left</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center py-10 text-green-600 font-medium">✅ All product types are well stocked</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Stock Levels by Product Type</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="in_stock" fill="var(--chart-1)" name="In Stock" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ordered" fill="var(--chart-3)" name="Ordered" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

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
              ) : (
                <p>No orders placed yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Inventory Overview Table */}
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
                {inventoryData.map((pt) => {
                  const hasOrders = pt.ordered > 0;
                  const isExpanded = expandedPt === pt.id;
                  const orderedCustomers = getOrdersForProductType(pt.id);

                  return (
                    <Fragment key={pt.id}>
                      <TableRow
                        className={hasOrders ? "cursor-pointer hover:bg-accent/50" : ""}
                        onClick={() => hasOrders && setExpandedPt(isExpanded ? null : pt.id)}
                      >
                        <TableCell className="font-medium">{pt.name}</TableCell>
                        <TableCell className="text-muted-foreground">{pt.productName}</TableCell>
                        <TableCell className="text-right font-medium">{pt.totalQuantity}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">{pt.in_stock}</TableCell>
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

                      {hasOrders && isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0 bg-muted/30">
                            <Collapsible open={isExpanded}>
                              <CollapsibleContent className="p-4 border-t">
                                <p className="text-sm font-medium mb-3">
                                  Customers who ordered <span className="text-amber-600">{pt.name}</span>
                                </p>
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
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Orders & Low Stock */} 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(-6).reverse().map((o) => (
                  <a key={o.id} href="/orders" className="block p-3 rounded-lg hover:bg-accent/50 transition-all">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-sm text-muted-foreground">{customerMap[o.customer_id]?.name}</p>
                      </div>
                      <div className="text-right">
                        <p>₹{orderTotal(o).toLocaleString('en-IN')}</p>
                        <Badge variant={o.status === 'pending' ? "outline" : o.status === 'cancelled' ? "destructive" : "default"}>
                          {o.status}
                        </Badge>
                      </div>
                    </div>
                  </a>
                ))}
                {orders.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No orders yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader><CardTitle>Low Stock Items</CardTitle></CardHeader>
            <CardContent>
              {lowStockCount > 0 ? (
                <div className="space-y-3">
                  {productTypes.filter((pt) => pt.in_stock <= 3).map((pt) => (
                    <div key={pt.id} className="flex justify-between items-center p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
                      <div>
                        <p className="font-medium">{pt.name}</p>
                        <p className="text-xs text-muted-foreground">{pt.net_weight}g each</p>
                      </div>
                      <Badge variant="destructive">{pt.in_stock} left</Badge>
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