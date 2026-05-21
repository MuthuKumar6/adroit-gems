import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { customerStore, orderStore } from "@/lib/store";
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

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  gstin: "",
  dailyGramLimit: "100",
};

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ── Per-customer order count map (customerId → count) ──
  const [orderCountMap, setOrderCountMap] = useState<Record<string, number>>({});

  // ── Orders shown in the detail dialog ──
  const [detailOrders, setDetailOrders] = useState<Order[]>([]);
  const [detailOrdersLoading, setDetailOrdersLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // ── Fetch customers + build order-count map in parallel ──
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const [customersData, allOrders] = await Promise.all([
        customerStore.getAll(),
        orderStore.getAll(),
      ]);

      const customers: Customer[] = Array.isArray(customersData) ? customersData : [];
      const orders: Order[] = Array.isArray(allOrders) ? allOrders : [];

      setCustomers(customers);

      // Build count map from all orders client-side
      const countMap: Record<string, number> = {};
      orders.forEach((o) => {
        countMap[o.customer_id] = (countMap[o.customer_id] ?? 0) + 1;
      });
      setOrderCountMap(countMap);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // ── Load orders for the detail dialog when a customer is selected ──
  useEffect(() => {
    if (!detailCustomer) {
      setDetailOrders([]);
      return;
    }
    setDetailOrdersLoading(true);
    orderStore
      .getAll()
      .then((all: Order[]) => {
        const orders = Array.isArray(all) ? all : [];
        setDetailOrders(orders.filter((o) => o.customer_id === detailCustomer.id));
      })
      .catch(console.error)
      .finally(() => setDetailOrdersLoading(false));
  }, [detailCustomer]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      gstin: c.gstin || "",
      dailyGramLimit: String(c.daily_gram_limit || 100),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      alert("Name and Phone are required fields");
      return;
    }
    setSaving(true);
    const payload = { ...form, dailyGramLimit: Number(form.dailyGramLimit) || 0 };
    try {
      if (editing) {
        await customerStore.update(editing.id, payload);
      } else {
        await customerStore.add(payload);
      }
      await fetchCustomers();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      await customerStore.delete(id);
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete customer");
    }
  };


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
                    customers.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.phone}</TableCell>
                        <TableCell className="text-xs font-mono">{c.gstin || "-"}</TableCell>
                        <TableCell>{c.daily_gram_limit}g</TableCell>
                        {/* ✅ Per-customer count from the map */}
                        <TableCell>{orderCountMap[c.id] ?? 0}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => setDetailCustomer(c)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
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
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>GSTIN</Label>
                  <Input value={form.gstin} onChange={(e) => setForm((f) => ({ ...f, gstin: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Daily Gram Limit (grams)</Label>
                  <Input
                    type="number"
                    value={form.dailyGramLimit}
                    onChange={(e) => setForm((f) => ({ ...f, dailyGramLimit: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update Customer" : "Create Customer"}
              </Button>
            </DialogFooter>
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
                <p className="text-sm font-medium mb-3">
                  Recent Orders ({detailOrdersLoading ? "…" : detailOrders.length})
                </p>
                {detailOrdersLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin h-5 w-5 text-muted-foreground" />
                  </div>
                ) : detailOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                ) : (
                  detailOrders.map((o) => (
                    <div key={o.id} className="flex justify-between items-center p-3 rounded-lg bg-accent/50 mb-2">
                      <div>
                        <p className="font-medium">{o.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{o.total_amount?.toLocaleString("en-IN")}</p>
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