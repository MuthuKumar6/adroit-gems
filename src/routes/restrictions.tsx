import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { restrictionStore, customerStore, productStore } from "@/lib/store";
import type { Restriction } from "@/lib/types";
import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";

export const Route = createFileRoute("/restrictions")({
  component: RestrictionsPage,
});

function RestrictionsPage() {
  const [restrictions, setRestrictions] = useState<Restriction[]>(restrictionStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ customerId: '', productId: '', dailyGramLimit: '50' });

  const customers = customerStore.getAll();
  const products = productStore.getAll();
  const refresh = () => setRestrictions(restrictionStore.getAll());

  const handleAdd = () => {
    restrictionStore.add({
      customerId: form.customerId,
      productId: form.productId,
      dailyGramLimit: Number(form.dailyGramLimit),
      isActive: true,
    });
    refresh();
    setDialogOpen(false);
    setForm({ customerId: '', productId: '', dailyGramLimit: '50' });
  };

  const toggleActive = (id: string, isActive: boolean) => {
    restrictionStore.update(id, { isActive });
    refresh();
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete restriction?')) {
      restrictionStore.delete(id);
      refresh();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Restrictions</h1>
            <p className="text-muted-foreground text-sm mt-1">Set daily gram limits per customer per product</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Restriction
          </Button>
        </div>

        <Card className="glass-card border-border/50 border-warning/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">How restrictions work</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• Set a daily gram limit for a specific customer on a specific metal (Gold/Silver).</p>
            <p>• When placing an order, the system checks if the customer has exceeded their daily limit.</p>
            <p>• If exceeded, the order will be blocked with a warning message.</p>
            <p>• Toggle restrictions on/off without deleting them.</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Daily Limit (g)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restrictions.map(r => {
                    const customer = customerStore.getById(r.customerId);
                    const product = productStore.getById(r.productId);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{customer?.name || 'Unknown'}</TableCell>
                        <TableCell>{product?.name || 'Unknown'} ({product?.purity})</TableCell>
                        <TableCell className="font-mono">{r.dailyGramLimit}g</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch checked={r.isActive} onCheckedChange={(v) => toggleActive(r.id, v)} />
                            <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {restrictions.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No restrictions set</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Restriction</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={form.customerId} onValueChange={v => setForm(f => ({ ...f, customerId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Product (Metal)</Label>
                <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.purity})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Daily Gram Limit</Label>
                <Input type="number" value={form.dailyGramLimit} onChange={e => setForm(f => ({ ...f, dailyGramLimit: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={!form.customerId || !form.productId}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
