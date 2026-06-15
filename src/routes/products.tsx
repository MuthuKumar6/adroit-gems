import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productStore } from "@/lib/store";
import { useProducts, useEntityMutation, qk } from "@/lib/queries";
import { productSchema, type ProductFormValues } from "@/lib/schemas";
import type { Product } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useTableData } from "@/hooks/useTableData";
import { TableToolbar } from "@/components/TableToolbar";
import { TablePagination } from "@/components/TablePagination";
import type { ExportColumn } from "@/lib/exportUtils";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

const defaultValues: ProductFormValues = {
  name: "",
  purity: "",
  currentRate: 0,
  gstPercentage: 3,
  unit: "gram",
};

function ProductsPage() {
  const productsQ = useProducts();
  const products = productsQ.data ?? [];
  const loading = productsQ.isLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
    mode: "onBlur",
  });

  const saveMut = useEntityMutation(
    async (values: ProductFormValues) => {
      if (editing) return productStore.update(editing.id, values);
      return productStore.add(values);
    },
    { successMsg: "Product saved", errorMsg: "Failed to save product", invalidate: [qk.products] },
  );

  const deleteMut = useEntityMutation((id: string) => productStore.delete(id), {
    successMsg: "Product deleted",
    errorMsg: "Failed to delete product",
    invalidate: [qk.products],
  });

  const openAdd = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    form.reset({
      name: p.name,
      purity: p.purity,
      currentRate: Number(p.current_rate) || 0,
      gstPercentage: Number(p.gst_percentage) || 3,
      unit: p.unit || "gram",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    deleteMut.mutate(id);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await saveMut.mutateAsync(values).catch(() => {});
    if (!saveMut.isError) setDialogOpen(false);
  });

  const errors = form.formState.errors;
  const saving = saveMut.isPending;

  const exportColumns: ExportColumn<Product>[] = [
    { header: "Name", accessor: (p) => p.name },
    { header: "Purity", accessor: (p) => p.purity },
    { header: "Rate/gram", accessor: (p) => Number(p.current_rate ?? 0) },
    { header: "GST %", accessor: (p) => Number(p.gst_percentage ?? 0) },
    { header: "Unit", accessor: (p) => p.unit ?? "" },
  ];
  const table = useTableData<Product>(
    products,
    (p, q) =>
      p.name.toLowerCase().includes(q) ||
      (p.purity || "").toLowerCase().includes(q) ||
      (p.unit || "").toLowerCase().includes(q),
    10,
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Products</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage base metals (Gold, Silver) with GST</p>
          </div>
          <Button onClick={openAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          placeholder="Search products..."
          exportRows={table.filtered}
          exportColumns={exportColumns}
          exportFilename="products"
          exportTitle="Products"
        />

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Purity</TableHead>
                  <TableHead>Rate/gram</TableHead>
                  <TableHead>GST %</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <Loader2 className="animate-spin mx-auto h-6 w-6" />
                    </TableCell>
                  </TableRow>
                ) : table.paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  table.paged.map((p: Product) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.purity}</TableCell>
                      <TableCell>₹{(p.current_rate ?? 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell>{p.gst_percentage}%</TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={deleteMut.isPending}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Product" : "Add New Product"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input {...form.register("name")} placeholder="e.g. Gold, Silver" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Purity *</Label>
                    <Input {...form.register("purity")} placeholder="e.g. 22K, 999, 925" />
                    {errors.purity && <p className="text-xs text-destructive">{errors.purity.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Rate per gram (₹) *</Label>
                    <Input type="number" step="0.01" {...form.register("currentRate")} />
                    {errors.currentRate && <p className="text-xs text-destructive">{errors.currentRate.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>GST %</Label>
                    <Input type="number" step="0.01" {...form.register("gstPercentage")} />
                    {errors.gstPercentage && <p className="text-xs text-destructive">{errors.gstPercentage.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Input {...form.register("unit")} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Update Product" : "Add Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
