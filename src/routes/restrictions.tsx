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
import { restrictionStore } from "@/lib/store";
import { useRestrictions, useCustomers, useProducts, useEntityMutation, qk } from "@/lib/queries";
import { restrictionSchema, firstError } from "@/lib/schemas";
import type { Restriction, Customer, Product } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Shield, Loader2 } from "lucide-react";

export const Route = createFileRoute("/restrictions")({
  component: RestrictionsPage,
});

function RestrictionsPage() {
  const restrictionsQ = useRestrictions();
  const customersQ = useCustomers();
  const productsQ = useProducts();

  const restrictions: Restriction[] = restrictionsQ.data ?? [];
  const customers: Customer[] = customersQ.data ?? [];
  const products: Product[] = productsQ.data ?? [];
  const loading = restrictionsQ.isLoading || customersQ.isLoading || productsQ.isLoading;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ customer_id: "", product_id: "", daily_gram_limit: "50" });

  const addMut = useEntityMutation(
    async (payload: { customerId: string; productId: string; dailyGramLimit: number; isActive: boolean }) =>
      restrictionStore.add(payload),
    { successMsg: "Restriction added", errorMsg: "Failed to add restriction", invalidate: [qk.restrictions] },
  );
  const toggleMut = useEntityMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) => restrictionStore.update(id, { isActive }),
    { errorMsg: "Failed to update restriction", invalidate: [qk.restrictions] },
  );
  const deleteMut = useEntityMutation((id: string) => restrictionStore.delete(id), {
    successMsg: "Restriction deleted",
    errorMsg: "Failed to delete restriction",
    invalidate: [qk.restrictions],
  });

  const handleAdd = async () => {
    const parsed = restrictionSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(firstError(parsed.error));
      return;
    }
    await addMut
      .mutateAsync({
        customerId: parsed.data.customer_id,
        productId: parsed.data.product_id,
        dailyGramLimit: parsed.data.daily_gram_limit,
        isActive: true,
      })
      .catch(() => {});
    if (!addMut.isError) {
      setDialogOpen(false);
      setForm({ customer_id: "", product_id: "", daily_gram_limit: "50" });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this restriction?")) return;
    deleteMut.mutate(id);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Restrictions</h1>
            <p className="text-muted-foreground text-sm mt-1">Set daily gram limits per customer per product</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={loading}>
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto h-6 w-6" />
                      </TableCell>
                    </TableRow>
                  ) : restrictions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        No restrictions set yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    restrictions.map((r) => {
                      const customer = customers.find((c) => c.id === r.customer_id);
                      const product = products.find((p) => p.id === r.product_id);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{customer?.name || "Unknown"}</TableCell>
                          <TableCell>{product?.name} ({product?.purity})</TableCell>
                          <TableCell className="font-mono font-medium">{r.daily_gram_limit}g</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={r.is_active}
                                onCheckedChange={(v) => toggleMut.mutate({ id: r.id, isActive: v })}
                              />
                              <Badge variant={r.is_active ? "default" : "secondary"}>
                                {r.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} disabled={deleteMut.isPending}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Restriction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer *</Label>
                <Select value={form.customer_id} onValueChange={(v) => setForm((f) => ({ ...f, customer_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Product (Metal) *</Label>
                <Select value={form.product_id} onValueChange={(v) => setForm((f) => ({ ...f, product_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.purity})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Daily Gram Limit (grams) *</Label>
                <Input
                  type="number"
                  value={form.daily_gram_limit}
                  onChange={(e) => setForm((f) => ({ ...f, daily_gram_limit: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={addMut.isPending || !form.customer_id || !form.product_id}>
                {addMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Restriction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
