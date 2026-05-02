import { createFileRoute } from '@tanstack/react-router'
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    initializeSeedData();
    setHydrated(true);
  }, []);

  const productTypes = hydrated ? productTypeStore.getAll() : [];
  const orders = hydrated ? orderStore.getAll() : [];
  const customers = hydrated ? customerStore.getAll() : [];
  const bills = hydrated ? billStore.getAll() : [];
  const alerts = hydrated ? alertStore.getUnread() : [];

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

  // For "Stock Reserved for Orders" section
  const reservedStockItems = orders
    .filter(o => ['pending', 'approved'].includes(o.status))
    .flatMap(order => {
      const customer = customerStore.getById(order.customerId);
      return order.items.map(item => {
        const pt = productTypes.find(p => p.id === item.productTypeId);
        return {
          orderNumber: order.orderNumber,
          customerName: customer?.name || 'Unknown',
          productTypeName: pt?.name || 'Unknown',
          quantity: item.quantity,
          netWeight: pt?.netWeight || 0,
        };
      });
    });

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

        {/* Payment Overdue Alerts */}
        {(() => {
          const today = new Date(); today.setHours(0,0,0,0);
          const overdue = orders.filter(o => o.status === 'pending' && o.paymentDueDate && new Date(o.paymentDueDate) < today);
          if (overdue.length === 0) return null;
          return (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Payment Overdue ({overdue.length})</span>
              </div>
              <div className="space-y-1">
                {overdue.slice(0, 5).map(o => {
                  const c = customerStore.getById(o.customerId);
                  const due = new Date(o.paymentDueDate!);
                  const daysLate = Math.floor((today.getTime() - due.getTime()) / 86400000);
                  return (
                    <p key={o.id} className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{c?.name || 'Unknown'}</span> — Order {o.orderNumber} — ₹{o.totalAmount.toLocaleString('en-IN')} — <span className="text-destructive">Time limit is over ({daysLate}d late)</span>
                    </p>
                  );
                })}
                {overdue.length > 5 && <p className="text-xs text-muted-foreground">+ {overdue.length - 5} more overdue</p>}
              </div>
            </div>
          );
        })()}

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
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div> */}

        {/* === DETAILED SUMMARY CARDS === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Total Available Pieces - Detailed */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Total Available Pieces
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold mb-4">
                {productTypes.reduce((s, pt) => s + pt.inStock, 0)}
              </p>
              <div className="space-y-2 max-h-60 overflow-auto pr-2">
                {productTypes
                  .filter(pt => pt.inStock > 0)
                  .sort((a, b) => b.inStock - a.inStock)
                  .map(pt => (
                    <div key={pt.id} className="flex justify-between text-sm">
                      <span>{pt.name}</span>
                      <span className="font-medium text-green-600">{pt.inStock} pcs</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* 2. Stock Reserved for Orders - Detailed */}
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
                  .filter(o => ['pending', 'approved'].includes(o.status))
                  .reduce((sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0), 0)}
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
                    <p className="text-xs text-center text-muted-foreground">+ {reservedStockItems.length - 8} more reservations</p>
                  )}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No stock currently reserved for orders</p>
              )}
            </CardContent>
          </Card>

          {/* 3. Low Stock Items - Detailed */}
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
                    .filter(pt => pt.inStock <= 3)
                    .map(pt => (
                      <div key={pt.id} className="flex justify-between p-2 bg-destructive/5 border border-destructive/20 rounded">
                        <div>
                          <p className="font-medium text-sm">{pt.name}</p>
                          <p className="text-xs text-muted-foreground">{pt.netWeight}g each</p>
                        </div>
                        <Badge variant="destructive" className="self-center">{pt.inStock} left</Badge>
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