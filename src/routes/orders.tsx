
import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderStore, customerStore, productTypeStore, productStore, restrictionStore, billStore } from "@/lib/store";
import type { Order, OrderItem, Customer, ProductType, Product, OrderStatus } from "@/lib/types";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queries";
import { toast } from "sonner";
import { Plus, Eye, Pencil, AlertTriangle, Loader2, Lock } from "lucide-react";
import {
  ORDER_STATUSES,
  allowedNextStatuses,
  isDestructiveTransition,
  shouldReverseStock,
  isOrderLocked,
  validateTransition,
} from "@/lib/orderFlow";

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
  const qc = useQueryClient();
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: qk.orders });
    qc.invalidateQueries({ queryKey: qk.productTypes });
    qc.invalidateQueries({ queryKey: qk.bills });
  };
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [billedOrderIds, setBilledOrderIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStatus, setEditStatus] = useState<Order['status']>('pending');

  const [statusFilter, setStatusFilter] = useState('all');
  const [limitWarning, setLimitWarning] = useState('');

  // New Order Form
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<{ productTypeId: string; quantity: number; huids: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');

  // (Removed pointless 1s ticker — countdowns live only on the dashboard.)

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, customersData, productTypesData, productsData, billsData] = await Promise.all([
        orderStore.getAll(),
        customerStore.getAll(),
        productTypeStore.getAll(),
        productStore.getAll(),
        billStore.getAll(),
      ]);

      setOrders(ordersData);
      setCustomers(customersData);
      setProductTypes(productTypesData);
      setProducts(productsData);
      setBilledOrderIds(new Set(
        (Array.isArray(billsData) ? billsData : []).map((b: any) => b.order_id ?? b.orderId).filter(Boolean)
      ));
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const addItem = () => setOrderItems([...orderItems, { productTypeId: '', quantity: 1, huids: '' }]);

  const removeItem = (index: number) => setOrderItems(orderItems.filter((_, i) => i !== index));

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    setOrderItems(updated);
  };

  const handleCreate = async () => {
    if (!customerId || orderItems.length === 0) {
      alert("Please select customer and add at least one item");
      return;
    }

    // Customer must belong to this shop's loaded list
    if (!customers.find(c => c.id === customerId)) {
      alert("Selected customer is not valid for this shop");
      return;
    }

    // Per-item structural validation
    for (const oi of orderItems) {
      if (!oi.productTypeId) {
        alert("Every item must have a product selected");
        return;
      }
      if (!productTypes.find(p => p.id === oi.productTypeId)) {
        alert("One of the selected products is not valid for this shop");
        return;
      }
      const qty = Number(oi.quantity);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
        alert(`Quantity must be a positive whole number (got "${oi.quantity}")`);
        return;
      }
    }

    // Warn (don't block) if payment due date is in the past
    if (paymentDueDate) {
      const due = new Date(paymentDueDate);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (due < today) {
        if (!confirm("Payment due date is in the past — the order will appear overdue immediately. Continue?")) {
          return;
        }
      }
    }

    setSaving(true);
    setLimitWarning('');

    try {
      // Refresh products + types at submit time — protects against stale rate
      // and stale stock captured when the form was opened.
      let freshProducts = products;
      let freshTypes = productTypes;
      try {
        freshProducts = await productStore.getAll();
        setProducts(freshProducts);
      } catch (e) {
        console.warn('Failed to refresh product rates, using cached values', e);
      }
      try {
        freshTypes = await productTypeStore.getAll();
        setProductTypes(freshTypes);
      } catch (e) {
        console.warn('Failed to refresh product types, using cached values', e);
      }

      let totalWeight = 0;
      const finalItems: OrderItem[] = [];

      for (const oi of orderItems) {
        const pt = freshTypes.find(p => p.id === oi.productTypeId);
        if (!pt) {
          setLimitWarning(`A selected product is no longer available`);
          return;
        }

        const product = freshProducts.find((p: Product) => p.id === pt.product_id);
        const weight = (pt.net_weight || 0) * oi.quantity;
        const rate = Number(product?.current_rate || 0);

        if (rate <= 0) {
          setLimitWarning(`Rate for ${pt.name} is not set — update the product rate before ordering`);
          return;
        }
        if (weight <= 0) {
          setLimitWarning(`Weight for ${pt.name} is zero — check the product's net weight`);
          return;
        }

        const making = pt.making_charge_type === 'per_gram'
          ? (pt.making_charges || 0) * weight
          : (pt.making_charges || 0) * oi.quantity;
        const amount = (weight * rate) + making;

        if (amount <= 0) {
          setLimitWarning(`Item amount is zero for ${pt.name}`);
          return;
        }

        totalWeight += weight;

        const check = await restrictionStore.checkLimit(customerId, pt.product_id, weight);
        if (!check.allowed && check.limit > 0) {
          setLimitWarning(`Daily limit exceeded for this customer!`);
          return;
        }

        if (pt.in_stock < oi.quantity) {
          setLimitWarning(`Not enough stock for ${pt.name} (have ${pt.in_stock}, need ${oi.quantity})`);
          return;
        }

        finalItems.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          productTypeId: oi.productTypeId,
          quantity: oi.quantity,
          huids: oi.huids.split(',').map(h => h.trim()).filter(Boolean),
          weightGrams: weight,
          ratePerGram: rate,
          makingCharges: making,
          amount,
          product_type_id: oi.productTypeId,
        });
      }

      if (finalItems.length === 0) {
        setLimitWarning('No valid items to order');
        return;
      }

      const subtotal = finalItems.reduce((sum, i) => sum + i.amount, 0);
      const gstAmount = subtotal * 0.03;

      const orderCreateRes = await orderStore.add({
        customerId,
        items: finalItems,
        status: 'pending',
        totalWeight,
        subtotal,
        gstAmount,
        totalAmount: Number(subtotal) + Number(gstAmount),
        notes: notes.trim(),
        paymentDueDate: paymentDueDate ? new Date(paymentDueDate).toISOString() : undefined,
        paymentReceived: false,
      });

      console.log('Created order:', orderCreateRes);

      await fetchData();
      setDialogOpen(false);
      setCustomerId('');
      setOrderItems([]);
      setNotes('');
      setPaymentDueDate('');
    } catch (err) {
      console.error(err);
      alert("Failed to create order");
    } finally {
      setSaving(false);
    }
  };

  // Add stock back for each item — used when cancelling/returning an order.
  const reverseStockForOrder = async (order: Order) => {
    for (const item of order.items || []) {
      const ptId = (item as any).product_type_id || (item as any).productTypeId;
      const qty = Number((item as any).quantity || 0);
      if (!ptId || qty <= 0) continue;
      try {
        await productTypeStore.updateStock(ptId, qty);
      } catch (e) {
        console.warn('Failed to reverse stock for', ptId, e);
      }
    }
  };

  const applyStatusChange = async (current: Order, status: OrderStatus): Promise<boolean> => {
    const err = validateTransition(current, status, billedOrderIds);
    if (err) { alert(err); return false; }

    if (isDestructiveTransition(current.status, status)) {
      const reversal = shouldReverseStock(current.status, status) ? '\n\nStock for this order will be returned to inventory.' : '';
      if (!window.confirm(`Change status from "${current.status}" to "${status}"?${reversal}\n\nThis cannot be undone.`)) {
        return false;
      }
    }

    await orderStore.updateStatus(current.id, status);
    if (shouldReverseStock(current.status, status)) {
      await reverseStockForOrder(current);
    }
    return true;
  };

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      const current = orders.find(o => o.id === orderId);
      if (!current) return;
      const ok = await applyStatusChange(current, status);
      if (ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const detailCustomer = detailOrder ? customers.find(c => c.id === detailOrder.customer_id) : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Orders</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage wholesale orders with status tracking</p>
          </div>
          <Button onClick={() => {
            setDialogOpen(true);
            setLimitWarning('');
            setOrderItems([{ productTypeId: '', quantity: 1, huids: '' }]);
          }}>
            <Plus className="h-4 w-4 mr-2" /> New Order
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'dispatched', 'delivered', 'cancelled', 'returned'].map(s => (
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
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto h-6 w-6" />
                      </TableCell>
                    </TableRow>
                  ) : filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-12">No orders found</TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(o => {
                      const customer = customers.find(c => c.id === o.customer_id);
                      const locked = isOrderLocked(o.id, billedOrderIds);
                      const nextOptions = allowedNextStatuses(o.status);
                      return (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                          <TableCell className="font-medium">{customer?.name || 'Unknown'}</TableCell>
                          <TableCell>{o.items?.length ?? 0}</TableCell>
                          <TableCell>{o.total_weight || '0.0'}g</TableCell>
                          <TableCell>₹{o.total_amount?.toLocaleString('en-IN') ?? '0.00'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v as OrderStatus)}>
                                <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {nextOptions.map(s => {
                                    const isDestructive = isDestructiveTransition(o.status, s);
                                    const disabled = locked && isDestructive;
                                    return (
                                      <SelectItem key={s} value={s} disabled={disabled} className="capitalize">
                                        {s}{disabled ? ' (locked)' : ''}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {locked && <Lock className="h-3 w-3 text-muted-foreground" aria-label="Order has a bill — locked from destructive changes" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {o.payment_due_date ? new Date(o.payment_due_date).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => setDetailOrder(o)}><Eye className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditOrder(o);
                              setEditNotes(o.notes || '');
                              setEditDueDate(o.payment_due_date ? new Date(o.payment_due_date).toISOString().slice(0, 16) : '');
                              setEditStatus(o.status);
                            }}><Pencil className="h-4 w-4" /></Button>
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

        {/* New Order Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setOrderItems([]);
            setLimitWarning('');
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>Add items and assign to a customer</DialogDescription>
            </DialogHeader>

            {limitWarning && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />{limitWarning}
              </div>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Customer *</Label>
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
                  const pt = productTypes.find(p => p.id === oi.productTypeId);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-accent/30">
                      <div className="col-span-5">
                        <Label className="text-xs">Product Type</Label>
                        <Select value={oi.productTypeId} onValueChange={v => updateItem(i, 'productTypeId', v)}>
                          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {productTypes.filter(p => p.in_stock > 0).map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.in_stock})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" value={oi.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                      </div>
                      <div className="col-span-4">
                        <Label className="text-xs">HUIDs</Label>
                        <Input value={oi.huids} onChange={e => updateItem(i, 'huids', e.target.value)} placeholder="HUID001,HUID002" />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="sm" className="text-destructive mt-5" onClick={() => removeItem(i)}>✕</Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes" />
                </div>
                <div className="grid gap-2">
                  <Label>Payment Due Date</Label>
                  <Input type="datetime-local" value={paymentDueDate} onChange={e => setPaymentDueDate(e.target.value)} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Order Detail Dialog */}
        <Dialog open={!!detailOrder} onOpenChange={(open) => { if (!open) setDetailOrder(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order Details — {detailOrder?.order_number}</DialogTitle>
              <DialogDescription>
                Customer: <strong>{detailCustomer?.name || 'Unknown'}</strong> &nbsp;|&nbsp; Status: <strong className="capitalize">{detailOrder?.status}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Weight</p>
                  <p className="font-medium">{detailOrder?.total_weight || 0}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">₹{detailOrder?.subtotal?.toLocaleString('en-IN') ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">GST (3%)</p>
                  <p className="font-medium">₹{detailOrder?.gst_amount?.toLocaleString('en-IN') ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-base">₹{detailOrder?.total_amount?.toLocaleString('en-IN') ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Due</p>
                  <p className="font-medium">
                    {detailOrder?.payment_due_date ? new Date(detailOrder.payment_due_date).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="font-medium">{detailOrder?.notes || '—'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Items</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Rate/g</TableHead>
                      <TableHead>Making</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(detailOrder?.items ?? []).map((item: any) => {
                      const pt = productTypes.find(p => p.id === (item.product_type_id || item.productTypeId));
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{pt?.name || item.product_type_id || '—'}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.weight_grams ?? item.weightGrams}g</TableCell>
                          <TableCell>₹{item.rate_per_gram ?? item.ratePerGram}</TableCell>
                          <TableCell>₹{item.making_charges ?? item.makingCharges}</TableCell>
                          <TableCell>₹{item.amount?.toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOrder(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={!!editOrder} onOpenChange={(open) => { if (!open) setEditOrder(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Order — {editOrder?.order_number}</DialogTitle>
              <DialogDescription>Update status, notes, or payment due date</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as OrderStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(editOrder ? allowedNextStatuses(editOrder.status) : ORDER_STATUSES).map(s => {
                      const locked = editOrder ? isOrderLocked(editOrder.id, billedOrderIds) : false;
                      const isDestructive = editOrder ? isDestructiveTransition(editOrder.status, s) : false;
                      const disabled = locked && isDestructive;
                      return (
                        <SelectItem key={s} value={s} disabled={disabled} className="capitalize">
                          {s}{disabled ? ' (locked — bill exists)' : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {editOrder && isOrderLocked(editOrder.id, billedOrderIds) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> A bill exists for this order — cancel/return is disabled.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Additional notes" />
              </div>
              <div className="grid gap-2">
                <Label>Payment Due Date</Label>
                <Input type="datetime-local" value={editDueDate} onChange={e => setEditDueDate(e.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOrder(null)}>Cancel</Button>
              <Button onClick={async () => {
                if (!editOrder) return;
                setSaving(true);
                try {
                  if (editStatus !== editOrder.status) {
                    const ok = await applyStatusChange(editOrder, editStatus);
                    if (!ok) { setSaving(false); return; }
                  }
                  await fetchData();
                  setEditOrder(null);
                } catch (err) {
                  console.error(err);
                  alert("Failed to update order");
                } finally {
                  setSaving(false);
                }
              }} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}