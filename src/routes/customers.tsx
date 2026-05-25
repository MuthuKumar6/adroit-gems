import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { customerStore } from "@/lib/store";
import { useCustomers, useOrders, useEntityMutation, qk } from "@/lib/queries";
import { customerSchema, type CustomerFormValues } from "@/lib/schemas";
import type { Customer, Order } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

const defaultValues: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  dailyGramLimit: 100,
};

function CustomersPage() {
  const customersQ = useCustomers();
  const ordersQ = useOrders();

  const customers = customersQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const loading = customersQ.isLoading;

  // Per-customer order count
  const orderCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o: Order) => {
      map[o.customer_id] = (map[o.customer_id] ?? 0) + 1;
    });
    return map;
  }, [orders]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const detailOrders = useMemo(
    () => (detailCustomer ? orders.filter((o: Order) => o.customer_id === detailCustomer.id) : []),
    [detailCustomer, orders],
  );

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues,
    mode: "onBlur",
  });

  const saveMut = useEntityMutation(
    async (values: CustomerFormValues) => {
      const payload = { ...values };
      if (editing) return customerStore.update(editing.id, payload);
      return customerStore.add(payload);
    },
    {
      successMsg: "Customer saved",
      errorMsg: "Failed to save customer",
      invalidate: [qk.customers],
    },
  );

  const deleteMut = useEntityMutation((id: string) => customerStore.delete(id), {
    successMsg: "Customer deleted",
    errorMsg: "Failed to delete customer",
    invalidate: [qk.customers],
  });

  const openAdd = () => {
    setEditing(null);
    form.reset(defaultValues);
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    form.reset({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      gstin: c.gstin || "",
      dailyGramLimit: c.daily_gram_limit || 100,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    deleteMut.mutate(id);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await saveMut.mutateAsync(values).catch(() => {});
    if (!saveMut.isError) setDialogOpen(false);
  });

  const errors = form.formState.errors;
  const saving = saveMut.isPending;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Customers</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your wholesale customers</p>
          </div>
          <Button onClick={openAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>GSTIN</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Orders</TableHead>
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
                  ) : customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                        No customers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((c: Customer) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="text-xs font-mono">{c.gstin || "-"}</TableCell>
                        <TableCell>{c.daily_gram_limit}g</TableCell>
                        <TableCell>{orderCountMap[c.id] ?? 0}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailCustomer(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} disabled={deleteMut.isPending}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <form onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input {...form.register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Phone *</Label>
                    <Input {...form.register("phone")} />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" {...form.register("email")} />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Input {...form.register("address")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>GSTIN</Label>
                    <Input {...form.register("gstin")} />
                    {errors.gstin && <p className="text-xs text-destructive">{errors.gstin.message}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label>Daily Gram Limit (grams)</Label>
                    <Input type="number" {...form.register("dailyGramLimit")} />
                    {errors.dailyGramLimit && <p className="text-xs text-destructive">{errors.dailyGramLimit.message}</p>}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editing ? "Update Customer" : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Customer Detail Dialog */}
        <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{detailCustomer?.name} — Order History</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Phone:</span> {detailCustomer?.phone}</p>
                <p><span className="text-muted-foreground">Email:</span> {detailCustomer?.email || "-"}</p>
                <p><span className="text-muted-foreground">GSTIN:</span> {detailCustomer?.gstin || "-"}</p>
                <p><span className="text-muted-foreground">Daily Limit:</span> {detailCustomer?.daily_gram_limit}g</p>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">Recent Orders ({detailOrders.length})</p>
                {detailOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  detailOrders.map((o: Order) => (
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-lg bg-accent/50 mb-2">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{Number(o.total_amount ?? 0).toLocaleString("en-IN")}</p>
                        <p className="text-xs capitalize">{o.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
