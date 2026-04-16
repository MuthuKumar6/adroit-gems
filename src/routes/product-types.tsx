import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { productStore, productTypeStore } from "@/lib/store";
import type { ProductType } from "@/lib/types";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/product-types")({
  component: ProductTypesPage,
});

const emptyForm = {
  productId: '', name: '', huids: '', grossWeight: '', netWeight: '', stoneWeight: '0',
  wastagePercentage: '', makingCharges: '', makingChargeType: 'per_gram' as 'per_gram' | 'flat',
  description: '', quantity: '', inStock: '',
};

function ProductTypesPage() {
  const [items, setItems] = useState<ProductType[]>(productTypeStore.getAll());
  const products = productStore.getAll();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = () => setItems(productTypeStore.getAll());

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (pt: ProductType) => {
    setEditing(pt);
    setForm({
      productId: pt.productId, name: pt.name, huids: pt.huids.join(', '),
      grossWeight: String(pt.grossWeight), netWeight: String(pt.netWeight), stoneWeight: String(pt.stoneWeight),
      wastagePercentage: String(pt.wastagePercentage), makingCharges: String(pt.makingCharges),
      makingChargeType: pt.makingChargeType, description: pt.description,
      quantity: String(pt.quantity), inStock: String(pt.inStock),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = {
      productId: form.productId, name: form.name,
      huids: form.huids.split(',').map(h => h.trim()).filter(Boolean),
      grossWeight: Number(form.grossWeight), netWeight: Number(form.netWeight),
      stoneWeight: Number(form.stoneWeight), wastagePercentage: Number(form.wastagePercentage),
      makingCharges: Number(form.makingCharges), makingChargeType: form.makingChargeType,
      description: form.description, quantity: Number(form.quantity), inStock: Number(form.inStock),
    };
    if (editing) { productTypeStore.update(editing.id, data); }
    else { productTypeStore.add(data); }
    refresh(); setDialogOpen(false);
  };

  const handleDelete = (id: string) => { if (confirm('Delete?')) { productTypeStore.delete(id); refresh(); } };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Product Types</h1>
            <p className="text-muted-foreground text-sm mt-1">Bangles, Chains, Rings with HUID tracking</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Type</Button>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>HUIDs</TableHead>
                    <TableHead>Net Wt (g)</TableHead>
                    <TableHead>Wastage %</TableHead>
                    <TableHead>Making</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(pt => {
                    const product = productStore.getById(pt.productId);
                    return (
                      <TableRow key={pt.id}>
                        <TableCell className="font-medium">{pt.name}</TableCell>
                        <TableCell><Badge variant="outline">{product?.name} {product?.purity}</Badge></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {pt.huids.slice(0, 3).map(h => <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>)}
                            {pt.huids.length > 3 && <Badge variant="secondary" className="text-[10px]">+{pt.huids.length - 3}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>{pt.netWeight}g</TableCell>
                        <TableCell>{pt.wastagePercentage}%</TableCell>
                        <TableCell>₹{pt.makingCharges}/{pt.makingChargeType === 'per_gram' ? 'g' : 'flat'}</TableCell>
                        <TableCell>
                          <Badge variant={pt.inStock <= 0 ? 'destructive' : pt.inStock <= 3 ? 'outline' : 'default'}>
                            {pt.inStock} / {pt.quantity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(pt)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(pt.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No product types</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Product Type</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Base Metal</Label>
                <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select metal" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.purity})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Type Name</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Gold Ring, Silver Anklet" />
              </div>
              <div className="grid gap-2">
                <Label>HUIDs (comma separated)</Label>
                <Input value={form.huids} onChange={e => setForm(f => ({ ...f, huids: e.target.value }))} placeholder="HUID001, HUID002" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>Gross Wt (g)</Label><Input type="number" value={form.grossWeight} onChange={e => setForm(f => ({ ...f, grossWeight: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Net Wt (g)</Label><Input type="number" value={form.netWeight} onChange={e => setForm(f => ({ ...f, netWeight: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Stone Wt (g)</Label><Input type="number" value={form.stoneWeight} onChange={e => setForm(f => ({ ...f, stoneWeight: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>Wastage %</Label><Input type="number" value={form.wastagePercentage} onChange={e => setForm(f => ({ ...f, wastagePercentage: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Making ₹</Label><Input type="number" value={form.makingCharges} onChange={e => setForm(f => ({ ...f, makingCharges: e.target.value }))} /></div>
                <div className="grid gap-2">
                  <Label>Charge Type</Label>
                  <Select value={form.makingChargeType} onValueChange={(v) => setForm(f => ({ ...f, makingChargeType: v as 'per_gram' | 'flat' }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_gram">Per Gram</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>In Stock</Label><Input type="number" value={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
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
