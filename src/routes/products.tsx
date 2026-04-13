import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { productStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(productStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', purity: '', currentRate: '', gstPercentage: '3', unit: 'gram' });

  const refresh = () => setProducts(productStore.getAll());

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', purity: '', currentRate: '', gstPercentage: '3', unit: 'gram' });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, purity: p.purity, currentRate: String(p.currentRate), gstPercentage: String(p.gstPercentage), unit: p.unit });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = { name: form.name, purity: form.purity, currentRate: Number(form.currentRate), gstPercentage: Number(form.gstPercentage), unit: form.unit };
    if (editing) {
      productStore.update(editing.id, data);
    } else {
      productStore.add(data);
    }
    refresh();
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this product?')) {
      productStore.delete(id);
      refresh();
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
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
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
                {products.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.purity}</TableCell>
                    <TableCell>₹{p.currentRate.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{p.gstPercentage}%</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No products yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold, Silver" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Purity</Label>
                  <Input value={form.purity} onChange={e => setForm(f => ({ ...f, purity: e.target.value }))} placeholder="e.g. 22K, 925" />
                </div>
                <div className="grid gap-2">
                  <Label>Rate per gram (₹)</Label>
                  <Input type="number" value={form.currentRate} onChange={e => setForm(f => ({ ...f, currentRate: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>GST %</Label>
                  <Input type="number" value={form.gstPercentage} onChange={e => setForm(f => ({ ...f, gstPercentage: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Unit</Label>
                  <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
