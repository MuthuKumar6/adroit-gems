import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderStore, customerStore, productTypeStore, productStore, billStore } from "@/lib/store";
import type { Bill, Order } from "@/lib/types";
import { useState } from "react";
import { Receipt, Eye, Printer } from "lucide-react";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

function BillingPage() {
  const [bills, setBills] = useState<Bill[]>(billStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);

  const deliveredOrders = orderStore.getAll().filter(o => o.status === 'delivered' || o.status === 'approved');
  const billedOrderIds = bills.map(b => b.orderId);
  const unbilledOrders = deliveredOrders.filter(o => !billedOrderIds.includes(o.id));

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Bill['paymentMethod']>('cash');

  const refresh = () => setBills(billStore.getAll());

  const selectedOrder = orderStore.getById(selectedOrderId);

  const handleCreate = () => {
    if (!selectedOrder) return;
    const disc = Number(discount);
    const total = selectedOrder.totalAmount - disc;
    const paid = Number(paidAmount) || total;

    billStore.add({
      orderId: selectedOrder.id,
      customerId: selectedOrder.customerId,
      items: selectedOrder.items,
      subtotal: selectedOrder.subtotal,
      gstAmount: selectedOrder.gstAmount,
      gstPercentage: 3,
      discount: disc,
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: total - paid,
      paymentMethod,
      status: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
    });
    refresh();
    setDialogOpen(false);
    setSelectedOrderId('');
    setDiscount('0');
    setPaidAmount('');
  };

  const detailCustomer = detailBill ? customerStore.getById(detailBill.customerId) : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate bills from approved/delivered orders</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={unbilledOrders.length === 0}>
            <Receipt className="h-4 w-4 mr-2" /> Create Bill
          </Button>
        </div>

        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill #</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map(b => {
                    const customer = customerStore.getById(b.customerId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">{b.billNumber}</TableCell>
                        <TableCell className="font-mono text-sm">{orderStore.getById(b.orderId)?.orderNumber || '-'}</TableCell>
                        <TableCell className="font-medium">{customer?.name}</TableCell>
                        <TableCell>₹{b.totalAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>₹{b.paidAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>₹{b.balanceAmount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="capitalize text-xs">{b.paymentMethod.replace('_', ' ')}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'paid' ? 'default' : b.status === 'partial' ? 'outline' : 'destructive'} className="capitalize">
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDetailBill(b)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {bills.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No bills yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Bill Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Bill</DialogTitle>
              <DialogDescription>Select an order to generate bill</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Order</Label>
                <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                  <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                  <SelectContent>
                    {unbilledOrders.map(o => {
                      const c = customerStore.getById(o.customerId);
                      return <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {c?.name} (₹{o.totalAmount.toLocaleString('en-IN')})</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrder && (
                <>
                  <div className="p-3 rounded-lg bg-accent/20 text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">GST (3%)</span><span>₹{selectedOrder.gstAmount.toLocaleString('en-IN')}</span></div>
                    <div className="flex justify-between font-bold"><span>Total</span><span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2"><Label>Discount (₹)</Label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
                    <div className="grid gap-2"><Label>Paid Amount (₹)</Label><Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={String(selectedOrder.totalAmount - Number(discount))} /></div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as Bill['paymentMethod'])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!selectedOrderId}>Create Bill</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bill Detail */}
        <Dialog open={!!detailBill} onOpenChange={() => setDetailBill(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bill {detailBill?.billNumber}</DialogTitle>
              <DialogDescription>{detailBill ? new Date(detailBill.createdAt).toLocaleString() : ''}</DialogDescription>
            </DialogHeader>
            {detailBill && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{detailCustomer?.name}</p></div>
                  <div><p className="text-muted-foreground">GSTIN</p><p>{detailCustomer?.gstin || '-'}</p></div>
                </div>
                <div className="border-t border-border pt-3">
                  {detailBill.items.map(item => {
                    const pt = productTypeStore.getById(item.productTypeId);
                    return (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>{pt?.name} × {item.quantity}</span>
                        <span>₹{item.amount.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{detailBill.subtotal.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST ({detailBill.gstPercentage}%)</span><span>₹{detailBill.gstAmount.toLocaleString('en-IN')}</span></div>
                  {detailBill.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-₹{detailBill.discount.toLocaleString('en-IN')}</span></div>}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span><span className="text-primary">₹{detailBill.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>₹{detailBill.paidAmount.toLocaleString('en-IN')}</span></div>
                  {detailBill.balanceAmount > 0 && (
                    <div className="flex justify-between text-destructive"><span>Balance</span><span>₹{detailBill.balanceAmount.toLocaleString('en-IN')}</span></div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
