import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderStore, customerStore, productTypeStore, productStore, billStore } from "@/lib/store";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [, setTick] = useState(0);
  useEffect(() => setTick(1), []);

  const [reportType, setReportType] = useState('sales');
  const orders = orderStore.getAll();
  const bills = billStore.getAll();
  const customers = customerStore.getAll();
  const productTypes = productTypeStore.getAll();

  // Sales summary
  const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
  const totalGST = bills.reduce((s, b) => s + b.gstAmount, 0);
  const totalDiscount = bills.reduce((s, b) => s + b.discount, 0);
  const totalPending = bills.reduce((s, b) => s + b.balanceAmount, 0);

  // Sales by customer
  const salesByCustomer = customers.map(c => {
    const cBills = bills.filter(b => b.customerId === c.id);
    return { name: c.name, total: cBills.reduce((s, b) => s + b.totalAmount, 0), orders: cBills.length };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Sales by product type
  const salesByProduct = productTypes.map(pt => {
    const product = productStore.getById(pt.productId);
    let totalQty = 0, totalAmt = 0;
    orders.forEach(o => o.items.forEach(i => { if (i.productTypeId === pt.id) { totalQty += i.quantity; totalAmt += i.amount; } }));
    return { name: pt.name, metal: product?.name || '', qty: totalQty, amount: totalAmt };
  }).filter(p => p.qty > 0);

  // Order status
  const statusSummary = ['pending', 'approved', 'dispatched', 'delivered', 'cancelled'].map(s => ({
    status: s, count: orders.filter(o => o.status === s).length,
  }));

  const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Business analytics and reports</p>
          </div>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="customer">Customer Report</SelectItem>
              <SelectItem value="product">Product Report</SelectItem>
              <SelectItem value="orders">Order Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {reportType === 'sales' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}` },
                { label: 'GST Collected', value: `₹${totalGST.toLocaleString('en-IN')}` },
                { label: 'Discounts Given', value: `₹${totalDiscount.toLocaleString('en-IN')}` },
                { label: 'Pending Payments', value: `₹${totalPending.toLocaleString('en-IN')}` },
              ].map(s => (
                <Card key={s.label} className="glass-card border-border/50">
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold font-heading">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sales by Customer</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCustomer}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                      <Bar dataKey="total" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Sales (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === 'customer' && (
          <Card className="glass-card border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByCustomer.map(c => (
                      <TableRow key={c.name}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{customers.find(cu => cu.name === c.name)?.phone}</TableCell>
                        <TableCell>{c.orders}</TableCell>
                        <TableCell>₹{c.total.toLocaleString('en-IN')}</TableCell>
                      </TableRow>
                    ))}
                    {salesByCustomer.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {reportType === 'product' && (
          <>
            <Card className="glass-card border-border/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Sales by Product Type</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  {salesByProduct.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={salesByProduct} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="amount" nameKey="name">
                          {salesByProduct.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground">No sales data</p>}
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-border/50">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Type</TableHead>
                        <TableHead>Metal</TableHead>
                        <TableHead>Qty Sold</TableHead>
                        <TableHead>Total Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesByProduct.map(p => (
                        <TableRow key={p.name}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.metal}</TableCell>
                          <TableCell>{p.qty}</TableCell>
                          <TableCell>₹{p.amount.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {reportType === 'orders' && (
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Order Status Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="status" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} className="capitalize" />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }} />
                    <Bar dataKey="count" fill="var(--chart-3)" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
