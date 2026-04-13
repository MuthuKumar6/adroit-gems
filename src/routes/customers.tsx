import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { customerStore, orderStore } from "@/lib/store";
import type { Customer } from "@/lib/types";
import { useState } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";

export const Route = createFileRoute("/customers")({
  component: CustomersPage,
});

const emptyForm = { name: '', phone: '', email: '', address: '', gstin: '', dailyGramLimit: '100' };

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>(customerStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const refresh = () => setCustomers(customerStore.getAll());

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, gstin: c.gstin, dailyGramLimit: String(c.dailyGramLimit) });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const data = { ...form, dailyGramLimit: Number(form.dailyGramLimit) };
    if (editing) { customerStore.update(editing.id, data); }
    else { customerStore.add(data); }
    refresh(); setDialogOpen(false);
  };

  const handleDelete = (id: string) => { if (confirm('Delete?')) { customerStore.delete(id); refresh(); } };

  const customerOrders = detailCustomer ? orderStore.getByCustomer(detailCustomer.id) : [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Customers</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your wholesale customers</p>
          </div>
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" /> Add Customer</Button>
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
                  {customers.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell className="text-xs font-mono">{c.gstin || '-'}</TableCell>
                      <TableCell>{c.dailyGramLimit}g</TableCell>
                      <TableCell>{orderStore.getByCustomer(c.id).length}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => setDetailCustomer(c)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No customers</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Customer</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="grid gap-2"><Label>Address</Label><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>GSTIN</Label><Input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} /></div>
                <div className="grid gap-2"><Label>Daily Gram Limit</Label><Input type="number" value={form.dailyGramLimit} onChange={e => setForm(f => ({ ...f, dailyGramLimit: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{editing ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customer Detail Dialog */}
        <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{detailCustomer?.name} — Order History</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-muted-foreground">Phone:</span> {detailCustomer?.phone}</p>
                <p><span className="text-muted-foreground">Email:</span> {detailCustomer?.email}</p>
                <p><span className="text-muted-foreground">GSTIN:</span> {detailCustomer?.gstin || '-'}</p>
                <p><span className="text-muted-foreground">Daily Limit:</span> {detailCustomer?.dailyGramLimit}g</p>
              </div>
              <div className="border-t border-border pt-3">
                <p className="text-sm font-medium mb-2">Orders ({customerOrders.length})</p>
                {customerOrders.map(o => (
                  <div key={o.id} className="flex items-center justify-between p-2 rounded bg-accent/30 mb-2">
                    <div>
                      <p className="text-sm font-medium">{o.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">₹{o.totalAmount.toLocaleString('en-IN')}</p>
                      <p className="text-xs capitalize text-muted-foreground">{o.status}</p>
                    </div>
                  </div>
                ))}
                {customerOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet</p>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
