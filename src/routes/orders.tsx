import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderStore, customerStore, productTypeStore, productStore, restrictionStore, billStore } from "@/lib/store";
import type { Order, OrderItem } from "@/lib/types";
import { useState } from "react";
import { Plus, Eye, ChevronRight, AlertTriangle, Pencil } from "lucide-react";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

const statusColors: Record<string, string> = {
  pending: 'outline',
  approved: 'default',
  dispatched: 'secondary',
  delivered: 'default',
  cancelled: 'destructive',
  returned: 'destructive',
};

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(orderStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [limitWarning, setLimitWarning] = useState('');

  // New order form
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productTypeId: string; quantity: number; huids: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');

  const customers = customerStore.getAll();
  const productTypes = productTypeStore.getAll();
  const refresh = () => setOrders(orderStore.getAll());

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const addItem = () => setOrderItems([...orderItems, { productTypeId: '', quantity: 1, huids: '' }]);
  const removeItem = (i: number) => setOrderItems(orderItems.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    (updated[i] as any)[field] = value;
    setOrderItems(updated);
  };

  const handleCreate = () => {
    if (!customerId || orderItems.length === 0) return;

    // Check restrictions
    let totalWeight = 0;
    const items: OrderItem[] = orderItems.map(oi => {
      const pt = productTypeStore.getById(oi.productTypeId);
      const product = pt ? productStore.getById(pt.productId) : null;
      const weight = pt ? pt.netWeight * oi.quantity : 0;
      const rate = product ? product.currentRate : 0;
      const making = pt ? (pt.makingChargeType === 'per_gram' ? pt.makingCharges * weight : pt.makingCharges * oi.quantity) : 0;
      const amount = (weight * rate) + making;
      totalWeight += weight;
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        productTypeId: oi.productTypeId,
        quantity: oi.quantity,
        huids: oi.huids.split(',').map(h => h.trim()).filter(Boolean),
        weightGrams: weight,
        ratePerGram: rate,
        makingCharges: making,
        amount,
      };
    });

    // Check each product restriction
    for (const item of items) {
      const pt = productTypeStore.getById(item.productTypeId);
      if (pt) {
        const check = restrictionStore.checkLimit(customerId, pt.productId, item.weightGrams);
        if (!check.allowed && check.limit > 0) {
          setLimitWarning(`Limit exceeded! Customer used ${check.usedToday.toFixed(1)}g today out of ${check.limit}g limit. Cannot add ${item.weightGrams}g more.`);
          return;
        }
        if (pt.inStock < item.quantity) {
          setLimitWarning(`Insufficient stock for ${pt.name}. Available: ${pt.inStock}, Requested: ${item.quantity}`);
          return;
        }
      }
    }

    const gstPct = 3;
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const gstAmount = subtotal * (gstPct / 100);

    orderStore.add({
      customerId,
      items,
      status: 'pending',
      totalWeight,
      subtotal,
      gstAmount,
      totalAmount: subtotal + gstAmount,
      notes,
      paymentDueDate: paymentDueDate || undefined,
      paymentReceived: false,
    });

    refresh();
    setDialogOpen(false);
    setCustomerId('');
    setOrderItems([]);
    setNotes('');
    setPaymentDueDate('');
    setLimitWarning('');
  };

  const handleStatusChange = (orderId: string, status: Order['status']) => {
    orderStore.updateStatus(orderId, status);
    refresh();
  };

  const detailCustomer = detailOrder ? customerStore.getById(detailOrder.customerId) : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage wholesale orders with status tracking</p>
          </div>
          <Button onClick={() => { setDialogOpen(true); setLimitWarning(''); addItem(); }}>
            <Plus className="h-4 w-4 mr-2" /> New Order
          </Button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'dispatched', 'delivered', 'cancelled'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s}
            </Button>
          ))}
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Due</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(o => {
                    const customer = customerStore.getById(o.customerId);
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.orderNumber}</TableCell>
                        <TableCell className="font-medium">{customer?.name || 'Unknown'}</TableCell>
                        <TableCell>{o.items.length}</TableCell>
                        <TableCell>{o.totalWeight.toFixed(1)}g</TableCell>
                        <TableCell>₹{o.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v as Order['status'])}>
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['pending', 'approved', 'dispatched', 'delivered', 'cancelled', 'returned'].map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs">
                          {o.paymentDueDate ? (() => {
                            const due = new Date(o.paymentDueDate);
                            const today = new Date(); today.setHours(0,0,0,0);
                            const overdue = o.status === 'pending' && due < today;
                            return (
                              <Badge variant={overdue ? 'destructive' : 'outline'}>
                                {due.toLocaleDateString()}{overdue ? ' • Overdue' : ''}
                              </Badge>
                            );
                          })() : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDetailOrder(o)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No orders</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* New Order Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setOrderItems([]); setLimitWarning(''); } }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items and assign to a customer</DialogDescription>
            </DialogHeader>

            {limitWarning && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {limitWarning}
              </div>
            )}

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.phone})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
                </div>
                {orderItems.map((oi, i) => {
                  const pt = productTypeStore.getById(oi.productTypeId);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-accent/20">
                      <div className="col-span-5 grid gap-1">
                        <Label className="text-xs">Product Type</Label>
                        <Select value={oi.productTypeId} onValueChange={v => updateItem(i, 'productTypeId', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {productTypes.filter(p => p.inStock > 0).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.inStock})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 grid gap-1">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" className="h-8 text-xs" value={oi.quantity} min={1} max={pt?.inStock || 99}
                          onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="col-span-4 grid gap-1">
                        <Label className="text-xs">HUIDs (comma sep)</Label>
                        <Input className="h-8 text-xs" value={oi.huids} onChange={e => updateItem(i, 'huids', e.target.value)}
                          placeholder={pt?.huids.slice(0, oi.quantity).join(', ')} />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => removeItem(i)}>✕</Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." />
                </div>
                <div className="grid gap-2">
                  <Label>Payment Due Date</Label>
                  <Input type="date" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  <p className="text-[10px] text-muted-foreground">Alert shown on dashboard if pending past this date</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Detail */}
        <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order {detailOrder?.orderNumber}</DialogTitle>
              <DialogDescription>Created {detailOrder ? new Date(detailOrder.createdAt).toLocaleString() : ''}</DialogDescription>
            </DialogHeader>
            {detailOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{detailCustomer?.name}</p>
                    <p className="text-xs text-muted-foreground">{detailCustomer?.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={statusColors[detailOrder.status] as any} className="capitalize">{detailOrder.status}</Badge>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-sm font-medium mb-2">Items</p>
                  {detailOrder.items.map(item => {
                    const pt = productTypeStore.getById(item.productTypeId);
                    return (
                      <div key={item.id} className="flex justify-between p-2 rounded bg-accent/20 mb-2 text-sm">
                        <div>
                          <p className="font-medium">{pt?.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} • {item.weightGrams}g • HUIDs: {item.huids.join(', ') || 'N/A'}</p>
                        </div>
                        <p className="font-medium">₹{item.amount.toLocaleString('en-IN')}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{detailOrder.subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST (3%)</span><span>₹{detailOrder.gstAmount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span><span className="text-primary">₹{detailOrder.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {detailOrder.notes && (
                  <div className="text-sm"><span className="text-muted-foreground">Notes:</span> {detailOrder.notes}</div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
