import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { productStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [form, setForm] = useState({
    name: '',
    purity: '',
    currentRate: '',
    gstPercentage: '3',
    unit: 'gram'
  });

  // Fetch Products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productStore.getAll();
      setProducts(data);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      purity: '',
      currentRate: '',
      gstPercentage: '3',
      unit: 'gram'
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      purity: p.purity,
      currentRate: String(p.current_rate),
      gstPercentage: String(p.gst_percentage),
      unit: p.unit || 'gram'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.purity.trim()) {
      alert("Name and Purity are required");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      purity: form.purity.trim(),
      currentRate: Number(form.currentRate) || 0,
      gstPercentage: Number(form.gstPercentage) || 3,
      unit: form.unit.trim() || 'gram'
    };

    try {
      if (editing) {
        await productStore.update(editing.id, payload);
      } else {
        await productStore.add(payload);
      }

      await fetchProducts();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productStore.delete(id);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    }
  };


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
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No products yet
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.purity}</TableCell>
                      <TableCell>₹{(p.current_rate ?? 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{p.gst_percentage}%</TableCell>
                      <TableCell>{p.unit}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gold, Silver"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Purity *</Label>
                  <Input
                    value={form.purity}
                    onChange={(e) => setForm(f => ({ ...f, purity: e.target.value }))}
                    placeholder="e.g. 22K, 999, 925"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Rate per gram (₹) *</Label>
                  <Input
                    type="number"
                    value={form.currentRate}
                    onChange={(e) => setForm(f => ({ ...f, currentRate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>GST %</Label>
                  <Input
                    type="number"
                    value={form.gstPercentage}
                    onChange={(e) => setForm(f => ({ ...f, gstPercentage: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Input
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}