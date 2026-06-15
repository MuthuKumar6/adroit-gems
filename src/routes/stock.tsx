import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts, useProductTypes } from "@/lib/queries";
import type { ProductType, Product } from "@/lib/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useTableData } from "@/hooks/useTableData";
import { TableToolbar } from "@/components/TableToolbar";
import { TablePagination } from "@/components/TablePagination";
import type { ExportColumn } from "@/lib/exportUtils";

export const Route = createFileRoute("/stock")({
  component: StockPage,
});

function StockPage() {
  const productTypesQ = useProductTypes();
  const productsQ = useProducts();
  const productTypes: ProductType[] = productTypesQ.data ?? [];
  const products: Product[] = productsQ.data ?? [];
  const loading = productTypesQ.isLoading || productsQ.isLoading;

  const totalStock = productTypes.reduce((sum, pt) => sum + (pt.in_stock || 0), 0);
  const totalWeight = productTypes.reduce((sum, pt) => sum + (pt.in_stock || 0) * (pt.net_weight || 0), 0);
  const lowStock = productTypes.filter(pt => (pt.in_stock || 0) <= 3);
  const outOfStock = productTypes.filter(pt => (pt.in_stock || 0) <= 0);

  const chartData = productTypes.map(pt => ({
    name: pt.name.length > 15 ? pt.name.slice(0, 15) + '…' : pt.name,
    stock: pt.in_stock || 0,
    capacity: pt.quantity || 0,
  }));

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const productOf = (pt: ProductType) => products.find(p => p.id === pt.product_id);
  const exportColumns: ExportColumn<ProductType>[] = [
    { header: "Product Type", accessor: (pt) => pt.name },
    { header: "Metal", accessor: (pt) => { const pr = productOf(pt); return `${pr?.name ?? ""} ${pr?.purity ?? ""}`.trim(); } },
    { header: "Net Weight/pc (g)", accessor: (pt) => Number(pt.net_weight || 0) },
    { header: "In Stock", accessor: (pt) => Number(pt.in_stock || 0) },
    { header: "Total Qty", accessor: (pt) => Number(pt.quantity || 0) },
    { header: "Stock Weight (g)", accessor: (pt) => +((pt.in_stock || 0) * (pt.net_weight || 0)).toFixed(2) },
    { header: "Status", accessor: (pt) => (pt.in_stock <= 0 ? "Out of Stock" : pt.in_stock <= 3 ? "Low Stock" : "Good") },
  ];
  const table = useTableData<ProductType>(
    productTypes,
    (pt, q) => {
      const pr = productOf(pt);
      return (
        pt.name.toLowerCase().includes(q) ||
        (pr?.name || "").toLowerCase().includes(q) ||
        (pr?.purity || "").toLowerCase().includes(q)
      );
    },
    10,
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Stock Monitor</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time inventory tracking</p>
        </div>


        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="glass-card border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-heading">{totalStock}</p>
              <p className="text-xs text-muted-foreground">Total Pieces</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-heading">{totalWeight.toFixed(1)}g</p>
              <p className="text-xs text-muted-foreground">Total Weight</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-heading text-warning">{lowStock.length}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold font-heading text-destructive">{outOfStock.length}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stock Level Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} 
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--card)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      color: 'var(--foreground)' 
                    }} 
                  />
                  <Bar dataKey="stock" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Current Stock" />
                  <Bar dataKey="capacity" fill="var(--chart-5)" radius={[4, 4, 0, 0]} opacity={0.3} name="Total Capacity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          placeholder="Search by product type or metal..."
          exportRows={table.filtered}
          exportColumns={exportColumns}
          exportFilename="stock"
          exportTitle="Stock Report"
        />

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Stock Details</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Type</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>Net Weight/pc</TableHead>
                    <TableHead>In Stock</TableHead>
                    <TableHead>Total Qty</TableHead>
                    <TableHead>Stock Weight</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.paged.map(pt => {
                    const product = products.find(p => p.id === pt.product_id);
                    return (
                      <TableRow key={pt.id}>
                        <TableCell className="font-medium">{pt.name}</TableCell>
                        <TableCell>{product?.name} {product?.purity}</TableCell>
                        <TableCell>{pt.net_weight}g</TableCell>
                        <TableCell className="font-mono font-semibold">{pt.in_stock}</TableCell>
                        <TableCell className="font-mono">{pt.quantity}</TableCell>
                        <TableCell>{(pt.in_stock * pt.net_weight).toFixed(1)}g</TableCell>
                        <TableCell>
                          {pt.in_stock <= 0 ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" /> Out of Stock
                            </Badge>
                          ) : pt.in_stock <= 3 ? (
                            <Badge variant="outline" className="gap-1 border-warning text-warning">
                              <AlertTriangle className="h-3 w-3" /> Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" /> Good
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {table.paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No stock data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}