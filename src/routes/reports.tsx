// import { createFileRoute } from "@tanstack/react-router";
// import { AppLayout } from "@/components/AppLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useOrders, useBills, useCustomers, useProductTypes, useProducts } from "@/lib/queries";
// import type { Order, Bill, Customer, ProductType, Product } from "@/lib/types";
// import { useState } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
// import { Loader2 } from "lucide-react";

// export const Route = createFileRoute("/reports")({
//   component: ReportsPage,
// });

// function ReportsPage() {
//   const [reportType, setReportType] = useState<'sales' | 'customer' | 'product' | 'orders'>('sales');

//   const ordersQ = useOrders();
//   const billsQ = useBills();
//   const customersQ = useCustomers();
//   const productTypesQ = useProductTypes();
//   const productsQ = useProducts();

//   const orders: Order[] = ordersQ.data ?? [];
//   const bills: Bill[] = billsQ.data ?? [];
//   const customers: Customer[] = customersQ.data ?? [];
//   const productTypes: ProductType[] = productTypesQ.data ?? [];
//   const products: Product[] = productsQ.data ?? [];

//   const loading =
//     ordersQ.isLoading || billsQ.isLoading || customersQ.isLoading || productTypesQ.isLoading || productsQ.isLoading;



//   // Sales Summary
//   const totalSales = bills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
//   const totalGST = bills.reduce((sum, b) => sum + (Number(b.gst_amount) || 0), 0);
//   const totalDiscount = bills.reduce((sum, b) => sum + (Number(b.discount) || 0), 0);
//   const totalPending = bills.reduce((sum, b) => sum + (Number(b.balance_amount) || 0), 0);

//   // Sales by Customer
//   const salesByCustomer = customers
//     .map(c => {
//       const customerBills = bills.filter((b: any) => (b.customer_id ?? b.customerId) === c.id);
//       return {
//         name: c.name,
//         total: customerBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
//         orders: customerBills.length,
//       };
//     })
//     .filter(c => c.total > 0)
//     .sort((a, b) => b.total - a.total);

//   // Sales by Product Type
//   const salesByProduct = productTypes
//     .map(pt => {
//       const product = products.find(p => p.id === pt.product_id);
//       let totalQty = 0;
//       let totalAmt = 0;

//       // orders.forEach(order => {
//       //   order.items.forEach(item => {
//       //     if (item.product_type_id === pt.id) {
//       //       totalQty += item.quantity;
//       //       totalAmt += Number(item.amount) || 0;
//       //     }
//       //   });
//       // });

//       orders.forEach(order => {
//         (order.items ?? []).forEach(item => {
//           if (item.product_type_id === pt.id) {
//             totalQty += item.quantity;
//             totalAmt += Number(item.amount) || 0;
//           }
//         });
//       });

//       return {
//         name: pt.name,
//         metal: product?.name || '',
//         qty: totalQty,
//         amount: totalAmt,
//       };
//     })
//     .filter(p => p.qty > 0);

//   // Order Status Summary
//   const statusSummary = ['pending', 'approved', 'dispatched', 'delivered', 'cancelled', 'returned'].map(status => ({
//     status,
//     count: orders.filter(o => o.status === status).length,
//   }));

//   const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

//   if (loading) {
//     return (
//       <AppLayout>
//         <div className="flex items-center justify-center h-96">
//           <Loader2 className="h-8 w-8 animate-spin" />
//         </div>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between flex-wrap gap-2">
//           <div>
//             <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Reports</h1>
//             <p className="text-muted-foreground text-sm mt-1">Business analytics and reports</p>
//           </div>
//           <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
//             <SelectTrigger className="w-52">
//               <SelectValue />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="sales">Sales Report</SelectItem>
//               <SelectItem value="customer">Customer Report</SelectItem>
//               <SelectItem value="product">Product Report</SelectItem>
//               <SelectItem value="orders">Order Status</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>

//         {/* Sales Report */}
//         {reportType === 'sales' && (
//           <>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {[
//                 { label: "Total Sales", value: `₹${totalSales.toLocaleString('en-IN')}` },
//                 { label: "GST Collected", value: `₹${totalGST.toLocaleString('en-IN')}` },
//                 { label: "Discounts", value: `₹${totalDiscount.toLocaleString('en-IN')}` },
//                 { label: "Pending Payments", value: `₹${totalPending.toLocaleString('en-IN')}` },
//               ].map(item => (
//                 <Card key={item.label} className="glass-card border-border/50">
//                   <CardContent className="p-6 text-center">
//                     <p className="text-2xl font-bold font-heading">{item.value}</p>
//                     <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>

//             <Card className="glass-card border-border/50">
//               <CardHeader>
//                 <CardTitle>Sales by Customer</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-80">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <BarChart data={salesByCustomer}>
//                       <CartesianGrid strokeDasharray="3 3" />
//                       <XAxis dataKey="name" />
//                       <YAxis />
//                       <Tooltip />
//                       <Bar dataKey="total" fill="#3b82f6" radius={8} />
//                     </BarChart>
//                   </ResponsiveContainer>
//                 </div>
//               </CardContent>
//             </Card>
//           </>
//         )}

//         {/* Customer Report */}
//         {reportType === 'customer' && (
//           <Card className="glass-card border-border/50">
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Customer</TableHead>
//                       <TableHead>Phone</TableHead>
//                       <TableHead>Total Orders</TableHead>
//                       <TableHead>Total Amount</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {salesByCustomer.map(c => {
//                       const customer = customers.find(cu => cu.name === c.name);
//                       return (
//                         <TableRow key={c.name}>
//                           <TableCell className="font-medium">{c.name}</TableCell>
//                           <TableCell>{customer?.phone}</TableCell>
//                           <TableCell>{c.orders}</TableCell>
//                           <TableCell className="font-medium">₹{c.total.toLocaleString('en-IN')}</TableCell>
//                         </TableRow>
//                       );
//                     })}
//                     {salesByCustomer.length === 0 && (
//                       <TableRow>
//                         <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
//                           No sales data available
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>
//         )}

//         {/* Product Report */}
//         {reportType === 'product' && (
//           <>
//             <Card className="glass-card border-border/50">
//               <CardHeader>
//                 <CardTitle>Sales by Product Type</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <div className="h-80 flex items-center justify-center">
//                   {salesByProduct.length > 0 ? (
//                     <ResponsiveContainer width="100%" height="100%">
//                       <PieChart>
//                         <Pie
//                           data={salesByProduct}
//                           cx="50%"
//                           cy="50%"
//                           innerRadius={60}
//                           outerRadius={100}
//                           dataKey="amount"
//                           nameKey="name"
//                         >
//                           {salesByProduct.map((_, index) => (
//                             <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
//                           ))}
//                         </Pie>
//                         <Tooltip />
//                       </PieChart>
//                     </ResponsiveContainer>
//                   ) : (
//                     <p className="text-muted-foreground">No product sales data</p>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>

//             <Card className="glass-card border-border/50">
//               <CardContent className="p-0">
//                 <div className="overflow-x-auto">
//                   <Table>
//                     <TableHeader>
//                       <TableRow>
//                         <TableHead>Product Type</TableHead>
//                         <TableHead>Metal</TableHead>
//                         <TableHead>Quantity Sold</TableHead>
//                         <TableHead>Total Amount</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {salesByProduct.map(p => (
//                         <TableRow key={p.name}>
//                           <TableCell className="font-medium">{p.name}</TableCell>
//                           <TableCell>{p.metal}</TableCell>
//                           <TableCell>{p.qty}</TableCell>
//                           <TableCell>₹{p.amount.toLocaleString('en-IN')}</TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   </Table>
//                 </div>
//               </CardContent>
//             </Card>
//           </>
//         )}

//         {/* Order Status Report */}
//         {reportType === 'orders' && (
//           <Card className="glass-card border-border/50">
//             <CardHeader>
//               <CardTitle>Order Status Summary</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="h-80">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={statusSummary}>
//                     <CartesianGrid strokeDasharray="3 3" />
//                     <XAxis dataKey="status" className="capitalize" />
//                     <YAxis />
//                     <Tooltip />
//                     <Bar dataKey="count" fill="#8b5cf6" radius={8} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </CardContent>
//           </Card>
//         )}
//       </div>
//     </AppLayout>
//   );
// }

// const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];


import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrders, useBills, useCustomers, useProductTypes, useProducts } from "@/lib/queries";
import type { Order, Bill, Customer, ProductType, Product } from "@/lib/types";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'customer' | 'product' | 'orders'>('sales');

  const ordersQ = useOrders();
  const billsQ = useBills();
  const customersQ = useCustomers();
  const productTypesQ = useProductTypes();
  const productsQ = useProducts();

  const orders: Order[] = ordersQ.data ?? [];
  const bills: Bill[] = billsQ.data ?? [];
  const customers: Customer[] = customersQ.data ?? [];
  const productTypes: ProductType[] = productTypesQ.data ?? [];
  const products: Product[] = productsQ.data ?? [];

  const loading =
    ordersQ.isLoading || billsQ.isLoading || customersQ.isLoading || productTypesQ.isLoading || productsQ.isLoading;



  // Sales Summary — voided bills are excluded from every revenue figure;
  // they're kept in the underlying `bills` list only for audit trails.
  const activeBills = bills.filter((b: any) => b.status !== 'void');
  const totalSales = activeBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
  const totalGST = activeBills.reduce((sum, b) => sum + (Number(b.gst_amount) || 0), 0);
  const totalDiscount = activeBills.reduce((sum, b) => sum + (Number(b.discount) || 0), 0);
  const totalPending = activeBills.reduce((sum, b) => sum + (Number(b.balance_amount) || 0), 0);

  // Sales by Customer
  const salesByCustomer = customers
    .map(c => {
      const customerBills = activeBills.filter((b: any) => (b.customer_id ?? b.customerId) === c.id);
      return {
        name: c.name,
        total: customerBills.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0),
        orders: customerBills.length,
      };
    })
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Sales by Product Type
  const salesByProduct = productTypes
    .map(pt => {
      const product = products.find(p => p.id === pt.product_id);
      let totalQty = 0;
      let totalAmt = 0;

      // orders.forEach(order => {
      //   order.items.forEach(item => {
      //     if (item.product_type_id === pt.id) {
      //       totalQty += item.quantity;
      //       totalAmt += Number(item.amount) || 0;
      //     }
      //   });
      // });

      orders.forEach(order => {
        (order.items ?? []).forEach(item => {
          if (item.product_type_id === pt.id) {
            totalQty += item.quantity;
            totalAmt += Number(item.amount) || 0;
          }
        });
      });

      return {
        name: pt.name,
        metal: product?.name || '',
        qty: totalQty,
        amount: totalAmt,
      };
    })
    .filter(p => p.qty > 0);

  // Order Status Summary
  const statusSummary = ['pending', 'approved', 'dispatched', 'delivered', 'cancelled', 'returned'].map(status => ({
    status,
    count: orders.filter(o => o.status === status).length,
  }));

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">Business analytics and reports</p>
          </div>
          <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales Report</SelectItem>
              <SelectItem value="customer">Customer Report</SelectItem>
              <SelectItem value="product">Product Report</SelectItem>
              <SelectItem value="orders">Order Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sales Report */}
        {reportType === 'sales' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Sales", value: `₹${totalSales.toLocaleString('en-IN')}` },
                { label: "GST Collected", value: `₹${totalGST.toLocaleString('en-IN')}` },
                { label: "Discounts", value: `₹${totalDiscount.toLocaleString('en-IN')}` },
                { label: "Pending Payments", value: `₹${totalPending.toLocaleString('en-IN')}` },
              ].map(item => (
                <Card key={item.label} className="glass-card border-border/50">
                  <CardContent className="p-6 text-center">
                    <p className="text-2xl font-bold font-heading">{item.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Sales by Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesByCustomer}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="total" fill="#3b82f6" radius={8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Customer Report */}
        {reportType === 'customer' && (
          <Card className="glass-card border-border/50">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByCustomer.map(c => {
                      const customer = customers.find(cu => cu.name === c.name);
                      return (
                        <TableRow key={c.name}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{customer?.phone}</TableCell>
                          <TableCell>{c.orders}</TableCell>
                          <TableCell className="font-medium">₹{c.total.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                    {salesByCustomer.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                          No sales data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Report */}
        {reportType === 'product' && (
          <>
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Sales by Product Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-center justify-center">
                  {salesByProduct.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesByProduct}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="amount"
                          nameKey="name"
                        >
                          {salesByProduct.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground">No product sales data</p>
                  )}
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
                        <TableHead>Quantity Sold</TableHead>
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

        {/* Order Status Report */}
        {reportType === 'orders' && (
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Order Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusSummary}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" className="capitalize" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={8} />
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

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];