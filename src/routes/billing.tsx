// import { createFileRoute } from "@tanstack/react-router";
// import { AppLayout } from "@/components/AppLayout";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { orderStore, customerStore, productTypeStore, productStore, billStore } from "@/lib/store";
// import type { Bill, Order } from "@/lib/types";
// import { useState } from "react";
// import { Receipt, Eye, Printer } from "lucide-react";

// export const Route = createFileRoute("/billing")({
//   component: BillingPage,
// });

// function BillingPage() {
//   const [bills, setBills] = useState<Bill[]>(billStore.getAll());
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [detailBill, setDetailBill] = useState<Bill | null>(null);

//   const deliveredOrders = orderStore.getAll().filter(o => o.status === 'delivered' || o.status === 'approved');
//   const billedOrderIds = bills.map(b => b.orderId);
//   const unbilledOrders = deliveredOrders.filter(o => !billedOrderIds.includes(o.id));

//   const [selectedOrderId, setSelectedOrderId] = useState('');
//   const [discount, setDiscount] = useState('0');
//   const [paidAmount, setPaidAmount] = useState('');
//   const [paymentMethod, setPaymentMethod] = useState<Bill['paymentMethod']>('cash');

//   const refresh = () => setBills(billStore.getAll());

//   const selectedOrder = orderStore.getById(selectedOrderId);

//   const handleCreate = () => {
//     if (!selectedOrder) return;
//     const disc = Number(discount);
//     const total = selectedOrder.totalAmount - disc;
//     const paid = Number(paidAmount) || total;

//     billStore.add({
//       orderId: selectedOrder.id,
//       customerId: selectedOrder.customerId,
//       items: selectedOrder.items,
//       subtotal: selectedOrder.subtotal,
//       gstAmount: selectedOrder.gstAmount,
//       gstPercentage: 3,
//       discount: disc,
//       totalAmount: total,
//       paidAmount: paid,
//       balanceAmount: total - paid,
//       paymentMethod,
//       status: paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
//     });
//     refresh();
//     setDialogOpen(false);
//     setSelectedOrderId('');
//     setDiscount('0');
//     setPaidAmount('');
//   };

//   const detailCustomer = detailBill ? customerStore.getById(detailBill.customerId) : null;

//   return (
//     <AppLayout>
//       <div className="space-y-6">
//         <div className="flex items-center justify-between flex-wrap gap-2">
//           <div>
//             <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Billing</h1>
//             <p className="text-muted-foreground text-sm mt-1">Generate bills from approved/delivered orders</p>
//           </div>
//           <Button onClick={() => setDialogOpen(true)} disabled={unbilledOrders.length === 0}>
//             <Receipt className="h-4 w-4 mr-2" /> Create Bill
//           </Button>
//         </div>

//         <Card className="glass-card border-border/50">
//           <CardContent className="p-0">
//             <div className="overflow-x-auto">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Bill #</TableHead>
//                     <TableHead>Order #</TableHead>
//                     <TableHead>Customer</TableHead>
//                     <TableHead>Amount</TableHead>
//                     <TableHead>Paid</TableHead>
//                     <TableHead>Balance</TableHead>
//                     <TableHead>Payment</TableHead>
//                     <TableHead>Status</TableHead>
//                     <TableHead className="text-right">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {bills.map(b => {
//                     const customer = customerStore.getById(b.customerId);
//                     return (
//                       <TableRow key={b.id}>
//                         <TableCell className="font-mono text-sm">{b.billNumber}</TableCell>
//                         <TableCell className="font-mono text-sm">{orderStore.getById(b.orderId)?.orderNumber || '-'}</TableCell>
//                         <TableCell className="font-medium">{customer?.name}</TableCell>
//                         <TableCell>₹{b.totalAmount.toLocaleString('en-IN')}</TableCell>
//                         <TableCell>₹{b.paidAmount.toLocaleString('en-IN')}</TableCell>
//                         <TableCell>₹{b.balanceAmount.toLocaleString('en-IN')}</TableCell>
//                         <TableCell className="capitalize text-xs">{b.paymentMethod.replace('_', ' ')}</TableCell>
//                         <TableCell>
//                           <Badge variant={b.status === 'paid' ? 'default' : b.status === 'partial' ? 'outline' : 'destructive'} className="capitalize">
//                             {b.status}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <Button variant="ghost" size="icon" onClick={() => setDetailBill(b)}><Eye className="h-4 w-4" /></Button>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })}
//                   {bills.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No bills yet</TableCell></TableRow>}
//                 </TableBody>
//               </Table>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Create Bill Dialog */}
//         <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Create Bill</DialogTitle>
//               <DialogDescription>Select an order to generate bill</DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-2">
//               <div className="grid gap-2">
//                 <Label>Order</Label>
//                 <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
//                   <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
//                   <SelectContent>
//                     {unbilledOrders.map(o => {
//                       const c = customerStore.getById(o.customerId);
//                       return <SelectItem key={o.id} value={o.id}>{o.orderNumber} — {c?.name} (₹{o.totalAmount.toLocaleString('en-IN')})</SelectItem>;
//                     })}
//                   </SelectContent>
//                 </Select>
//               </div>
//               {selectedOrder && (
//                 <>
//                   <div className="p-3 rounded-lg bg-accent/20 text-sm space-y-1">
//                     <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span></div>
//                     <div className="flex justify-between"><span className="text-muted-foreground">GST (3%)</span><span>₹{selectedOrder.gstAmount.toLocaleString('en-IN')}</span></div>
//                     <div className="flex justify-between font-bold"><span>Total</span><span>₹{selectedOrder.totalAmount.toLocaleString('en-IN')}</span></div>
//                   </div>
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="grid gap-2"><Label>Discount (₹)</Label><Input type="number" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
//                     <div className="grid gap-2"><Label>Paid Amount (₹)</Label><Input type="number" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder={String(selectedOrder.totalAmount - Number(discount))} /></div>
//                   </div>
//                   <div className="grid gap-2">
//                     <Label>Payment Method</Label>
//                     <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as Bill['paymentMethod'])}>
//                       <SelectTrigger><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="cash">Cash</SelectItem>
//                         <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
//                         <SelectItem value="cheque">Cheque</SelectItem>
//                         <SelectItem value="upi">UPI</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </>
//               )}
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
//               <Button onClick={handleCreate} disabled={!selectedOrderId}>Create Bill</Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>

//         {/* Bill Detail */}
//         <Dialog open={!!detailBill} onOpenChange={() => setDetailBill(null)}>
//           <DialogContent className="max-w-lg">
//             <DialogHeader>
//               <DialogTitle>Bill {detailBill?.billNumber}</DialogTitle>
//               <DialogDescription>{detailBill ? new Date(detailBill.createdAt).toLocaleString() : ''}</DialogDescription>
//             </DialogHeader>
//             {detailBill && (
//               <div className="space-y-4 text-sm">
//                 <div className="grid grid-cols-2 gap-2">
//                   <div><p className="text-muted-foreground">Customer</p><p className="font-medium">{detailCustomer?.name}</p></div>
//                   <div><p className="text-muted-foreground">GSTIN</p><p>{detailCustomer?.gstin || '-'}</p></div>
//                 </div>
//                 <div className="border-t border-border pt-3">
//                   {detailBill.items.map(item => {
//                     const pt = productTypeStore.getById(item.productTypeId);
//                     return (
//                       <div key={item.id} className="flex justify-between py-1">
//                         <span>{pt?.name} × {item.quantity}</span>
//                         <span>₹{item.amount.toLocaleString('en-IN')}</span>
//                       </div>
//                     );
//                   })}
//                 </div>
//                 <div className="border-t border-border pt-3 space-y-1">
//                   <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{detailBill.subtotal.toLocaleString('en-IN')}</span></div>
//                   <div className="flex justify-between"><span className="text-muted-foreground">GST ({detailBill.gstPercentage}%)</span><span>₹{detailBill.gstAmount.toLocaleString('en-IN')}</span></div>
//                   {detailBill.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-₹{detailBill.discount.toLocaleString('en-IN')}</span></div>}
//                   <div className="flex justify-between font-bold text-base border-t border-border pt-2">
//                     <span>Total</span><span className="text-primary">₹{detailBill.totalAmount.toLocaleString('en-IN')}</span>
//                   </div>
//                   <div className="flex justify-between"><span className="text-muted-foreground">Paid</span><span>₹{detailBill.paidAmount.toLocaleString('en-IN')}</span></div>
//                   {detailBill.balanceAmount > 0 && (
//                     <div className="flex justify-between text-destructive"><span>Balance</span><span>₹{detailBill.balanceAmount.toLocaleString('en-IN')}</span></div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </DialogContent>
//         </Dialog>
//       </div>
//     </AppLayout>
//   );
// }



import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  orderStore, customerStore, productTypeStore, productStore, billStore,
} from "@/lib/store";
import type { Bill, Order } from "@/lib/types";
import { useState, useRef } from "react";
import { Receipt, Eye, Printer } from "lucide-react";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
});

/* ─── helpers ─────────────────────────────────────────── */
function toWords(n: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const num = Math.round(n);
  if (num === 0) return "Zero";
  const convert = (x: number): string => {
    if (x < 20) return a[x];
    if (x < 100) return b[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : "");
    if (x < 1000) return a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " + convert(x % 100) : "");
    if (x < 100000) return convert(Math.floor(x / 1000)) + " Thousand" + (x % 1000 ? " " + convert(x % 1000) : "");
    if (x < 10000000) return convert(Math.floor(x / 100000)) + " Lakh" + (x % 100000 ? " " + convert(x % 100000) : "");
    return convert(Math.floor(x / 10000000)) + " Crore" + (x % 10000000 ? " " + convert(x % 10000000) : "");
  };
  return convert(num) + " Only";
}

/* ─── CUS Invoice component (full A4 page) ────────────── */
function CusInvoice({ bill }: { bill: Bill }) {
  const customer = customerStore.getById(bill.customerId);

  const sgst = +(bill.gstAmount / 2).toFixed(2);
  const cgst = +(bill.gstAmount / 2).toFixed(2);
  const roundOff = +(Math.round(bill.totalAmount) - bill.totalAmount).toFixed(2);
  const finalTotal = Math.round(bill.totalAmount);

  /* shared cell style */
  const td = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "8px 10px",
    verticalAlign: "top",
    ...extra,
  });

  return (
    <div
      id="cus-invoice-print"
      style={{
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "13px",
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        padding: "14mm 16mm 12mm",
        color: "#000",
        background: "#fff",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ══ HEADER ══════════════════════════════════════════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2mm" }}>
        <tbody>
          <tr>
            <td style={{ fontSize: "12px", paddingBottom: "1mm" }}>
              GSTIN : <strong>33BNFPS1282R1ZE</strong>
            </td>
            <td style={{ textAlign: "right", fontSize: "12px", paddingBottom: "1mm" }}>
              Phone : <strong>94423 28128</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        style={{
          textAlign: "center",
          borderTop: "3px double #000",
          borderBottom: "3px double #000",
          padding: "4mm 0",
          marginBottom: "4mm",
        }}
      >
        <div style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "4px", textTransform: "uppercase" }}>
          Sridhar Jewellers
        </div>
        <div style={{ fontSize: "13px", marginTop: "2mm" }}>
          215, Swamy Viveganandar Salai, Ramanadhapuram – 623503
        </div>
      </div>

      {/* ══ INVOICE TITLE ════════════════════════════════════ */}
      <div
        style={{
          textAlign: "center",
          fontSize: "15px",
          fontWeight: "bold",
          letterSpacing: "3px",
          borderBottom: "1px solid #000",
          paddingBottom: "3mm",
          marginBottom: "4mm",
        }}
      >
        TAX INVOICE
      </div>

      {/* ══ CUSTOMER / META ══════════════════════════════════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5mm", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={td({ width: "55%", borderBottom: "1px solid #ccc" })}>
              <strong>Name :</strong>&nbsp; {customer?.name || "—"}
            </td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>
              <strong>Date :</strong>&nbsp;
              {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              })}
            </td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}>
              <strong>Address :</strong>&nbsp; {(customer as any)?.address || "—"}
            </td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>
              <strong>Bill No :</strong>&nbsp; {bill.billNumber}
            </td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}>
              <strong>Gold Rate :</strong>&nbsp; —
            </td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>
              {(customer as any)?.city || "Ramanathapuram"}
            </td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}>
              <strong>Silver Rate :</strong>&nbsp; —
            </td>
            <td style={td({ borderBottom: "1px solid #ccc" })}></td>
          </tr>
          <tr>
            <td style={td()}>
              <strong>PAN No. :</strong>&nbsp; {(customer as any)?.pan || "—"}
            </td>
            <td style={td({ textAlign: "right" })}>
              <strong>HSN NO :</strong>&nbsp; 7113
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ ITEMS TABLE ══════════════════════════════════════ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          flexGrow: 1,
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            {[
              { label: "S.No", align: "center" },
              { label: "Description", align: "left" },
              { label: "HUID", align: "center" },
              { label: "Qty", align: "center" },
              { label: "Weight", align: "right" },
              { label: "Wastage", align: "right" },
              { label: "MC", align: "right" },
              { label: "Amount", align: "right" },
            ].map(({ label, align }) => (
              <th
                key={label}
                style={{
                  padding: "7px 10px",
                  textAlign: align as any,
                  fontWeight: "bold",
                  border: "1px solid #000",
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                }}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => {
            const pt = productTypeStore.getById(item.productTypeId);
            const even = idx % 2 === 0;
            return (
              <tr key={item.id} style={{ background: even ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{idx + 1}</td>
                <td style={{ padding: "9px 10px", border: "1px solid #ddd" }}>{pt?.name || item.productTypeId}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{pt?.huids}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{item.weightGrams}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>-</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{item.makingCharges}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd", fontWeight: "500" }}>
                  ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}

          {/* Filler rows to push totals to bottom */}
          {Array.from({ length: Math.max(0, 10 - bill.items.length) }).map((_, i) => (
            <tr key={`filler-${i}`}>
              {Array.from({ length: 8 }).map((__, j) => (
                <td key={j} style={{ padding: "9px 10px", border: "1px solid #ddd", color: "transparent" }}>.</td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
            <td colSpan={3} style={{ padding: "8px 10px", border: "1px solid #000" }}>Total</td>
            <td style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #000" }}>
              {bill.items.reduce((s, i) => s + i.quantity, 0)}
            </td>
            <td style={{ padding: "8px 10px", border: "1px solid #000" }}></td>
            <td style={{ padding: "8px 10px", border: "1px solid #000" }}></td>
            <td style={{ padding: "8px 10px", border: "1px solid #000" }}></td>
            <td style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #000" }}>
              ₹{bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ══ PAYMENT SUMMARY ══════════════════════════════════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5mm", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "5px 10px", width: "65%" }}>Cash Received</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>
              ₹{bill.paidAmount.toLocaleString("en-IN")}
            </td>
          </tr>
          {bill.discount > 0 && (
            <tr>
              <td style={{ padding: "5px 10px" }}>Discount</td>
              <td style={{ padding: "5px 10px", textAlign: "right" }}>
                – ₹{bill.discount.toLocaleString("en-IN")}
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 10px" }}>Add SGST @ 1.5 %</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>
              ₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td style={{ padding: "5px 10px" }}>Add CGST @ 1.5 %</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>
              ₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
          </tr>
          {bill.balanceAmount > 0 && (
            <tr>
              <td style={{ padding: "5px 10px" }}>Balance Amount</td>
              <td style={{ padding: "5px 10px", textAlign: "right" }}>
                ₹{bill.balanceAmount.toLocaleString("en-IN")}
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 10px" }}>Round Off</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>
              {roundOff >= 0 ? "+" : ""}
              {roundOff.toFixed(2)}
            </td>
          </tr>
          <tr
            style={{
              borderTop: "2px solid #000",
              borderBottom: "2px solid #000",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            <td style={{ padding: "7px 10px", fontStyle: "italic", fontSize: "12px", fontWeight: "normal" }}>
              {toWords(finalTotal)}
            </td>
            <td style={{ padding: "7px 10px", textAlign: "right" }}>
              Total &nbsp;₹{finalTotal.toLocaleString("en-IN")}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ SIGNATURES ═══════════════════════════════════════ */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "18mm",
          fontSize: "13px",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                borderTop: "1px solid #000",
                paddingTop: "3mm",
                width: "45%",
                textAlign: "center",
              }}
            >
              Customer Signature
            </td>
            <td style={{ width: "10%" }}></td>
            <td
              style={{
                borderTop: "1px solid #000",
                paddingTop: "3mm",
                textAlign: "center",
              }}
            >
              For Sridhar Jewellers
            </td>
          </tr>
        </tbody>
      </table>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <div
        style={{
          textAlign: "center",
          marginTop: "8mm",
          borderTop: "1px dashed #000",
          paddingTop: "4mm",
          fontSize: "12px",
          letterSpacing: "2px",
          color: "#333",
        }}
      >
        ✦&nbsp;&nbsp;THANK YOU FOR YOUR PURCHASE — PLEASE VISIT AGAIN&nbsp;&nbsp;✦
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────── */
function BillingPage() {
  const [bills, setBills] = useState<Bill[]>(billStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);
  const [invoiceBill, setInvoiceBill] = useState<Bill | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const deliveredOrders = orderStore
    .getAll()
    .filter((o) => o.status === "delivered" || o.status === "approved");
  const billedOrderIds = bills.map((b) => b.orderId);
  const unbilledOrders = deliveredOrders.filter(
    (o) => !billedOrderIds.includes(o.id)
  );

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<Bill["paymentMethod"]>("cash");

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
      status: paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid",
    });
    refresh();
    setDialogOpen(false);
    setSelectedOrderId("");
    setDiscount("0");
    setPaidAmount("");
  };

  /* Print handler */
  const handlePrint = () => {
    const content = document.getElementById("cus-invoice-print");
    if (!content) return;

    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) return;

    win.document.write(`
    <html>
    <head>
      <title>Invoice ${invoiceBill?.billNumber}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html, body {
          width: 210mm;
          height: 297mm;
          background: #fff;
          overflow: hidden;
        }

        #print-wrapper {
          width: 210mm;
          height: 297mm;
          padding: 14mm 16mm 12mm;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        #print-content {
          width: 100%;
          transform-origin: top left;
        }

        @page {
          size: A4 portrait;
          margin: 0;
        }

        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>

    <body>
      <div id="print-wrapper">
        <div id="print-content">
          ${content.outerHTML}
        </div>
      </div>

      <script>
        function fitToPage() {
          const content = document.getElementById("print-content");
          const wrapper = document.getElementById("print-wrapper");

          const scaleX = wrapper.clientWidth / content.scrollWidth;
          const scaleY = wrapper.clientHeight / content.scrollHeight;

          const scale = Math.min(scaleX, scaleY, 1);

          content.style.transform = "scale(" + scale + ")";
        }

        window.onload = () => {
          fitToPage();
          setTimeout(() => {
            window.print();
            window.close();
          }, 300);
        };
      <\/script>
    </body>
    </html>
  `);

    win.document.close();
  };

  const detailCustomer = detailBill
    ? customerStore.getById(detailBill.customerId)
    : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">
              Billing
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate bills from approved/delivered orders
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            disabled={unbilledOrders.length === 0}
          >
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
                  {bills.map((b) => {
                    const customer = customerStore.getById(b.customerId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">
                          {b.billNumber}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {orderStore.getById(b.orderId)?.orderNumber || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {customer?.name}
                        </TableCell>
                        <TableCell>
                          ₹{b.totalAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          ₹{b.paidAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          ₹{b.balanceAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="capitalize text-xs">
                          {b.paymentMethod.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              b.status === "paid"
                                ? "default"
                                : b.status === "partial"
                                  ? "outline"
                                  : "destructive"
                            }
                            className="capitalize"
                          >
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Eye button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailBill(b)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* ── CUS Invoice button ── */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 px-2 text-xs font-bold tracking-wide border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                            onClick={() => setInvoiceBill(b)}
                          >
                            CUS
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {bills.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center text-muted-foreground py-8"
                      >
                        No bills yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Create Bill Dialog ──────────────────────────────── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Bill</DialogTitle>
              <DialogDescription>
                Select an order to generate bill
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Order</Label>
                <Select
                  value={selectedOrderId}
                  onValueChange={setSelectedOrderId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select order" />
                  </SelectTrigger>
                  <SelectContent>
                    {unbilledOrders.map((o) => {
                      const c = customerStore.getById(o.customerId);
                      return (
                        <SelectItem key={o.id} value={o.id}>
                          {o.orderNumber} — {c?.name} (₹
                          {o.totalAmount.toLocaleString("en-IN")})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrder && (
                <>
                  <div className="p-3 rounded-lg bg-accent/20 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        ₹{selectedOrder.subtotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (3%)</span>
                      <span>
                        ₹{selectedOrder.gstAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        ₹{selectedOrder.totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Discount (₹)</Label>
                      <Input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Paid Amount (₹)</Label>
                      <Input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder={String(
                          selectedOrder.totalAmount - Number(discount)
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) =>
                        setPaymentMethod(v as Bill["paymentMethod"])
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!selectedOrderId}>
                Create Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Bill Detail Dialog ──────────────────────────────── */}
        <Dialog open={!!detailBill} onOpenChange={() => setDetailBill(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bill {detailBill?.billNumber}</DialogTitle>
              <DialogDescription>
                {detailBill
                  ? new Date(detailBill.createdAt).toLocaleString()
                  : ""}
              </DialogDescription>
            </DialogHeader>
            {detailBill && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-muted-foreground">Customer</p>
                    <p className="font-medium">{detailCustomer?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GSTIN</p>
                    <p>{detailCustomer?.gstin || "-"}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  {detailBill.items.map((item) => {
                    const pt = productTypeStore.getById(item.productTypeId);
                    return (
                      <div
                        key={item.id}
                        className="flex justify-between py-1"
                      >
                        <span>
                          {pt?.name} × {item.quantity}
                        </span>
                        <span>₹{item.amount.toLocaleString("en-IN")}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="border-t border-border pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{detailBill.subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      GST ({detailBill.gstPercentage}%)
                    </span>
                    <span>
                      ₹{detailBill.gstAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {detailBill.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>
                        -₹{detailBill.discount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">
                      ₹{detailBill.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>
                      ₹{detailBill.paidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {detailBill.balanceAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Balance</span>
                      <span>
                        ₹{detailBill.balanceAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── CUS Invoice Dialog ──────────────────────────────── */}
        <Dialog
          open={!!invoiceBill}
          onOpenChange={() => setInvoiceBill(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Customer Invoice — {invoiceBill?.billNumber}
              </DialogTitle>
              <DialogDescription>
                Sridhar Jewellers style invoice • ready to print
              </DialogDescription>
            </DialogHeader>

            {/* Invoice preview */}
            <div
              ref={printRef}
              className="border border-border rounded-md overflow-auto max-h-[65vh] bg-white p-2"
            >
              {invoiceBill && <CusInvoice bill={invoiceBill} />}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceBill(null)}>
                Close
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}