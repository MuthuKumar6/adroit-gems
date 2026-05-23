// src/routes/billing.tsx
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
  orderStore, customerStore, productTypeStore, billStore,
} from "@/lib/store";
import type { Bill, Order, Customer, ProductType } from "@/lib/types";
import { useState, useRef, useEffect, useCallback } from "react";
import { Receipt, Eye, Printer } from "lucide-react";
import { auth } from "@/lib/auth";

// Reads the active shop from localStorage and falls back to legacy hardcoded
// values so existing tenants keep printing correctly until they fill in their
// own shop profile (gstin / phone / address).
function getShopHeader() {
  const shop = auth.getCurrentShop() || {};
  return {
    name: shop.shopName || shop.name || "Sridhar Jewellers",
    gstin: shop.gstin || "33BNFPS1282R1ZE",
    phone: shop.phone || "94423 28128",
    address: shop.address || "215, Swamy Viveganandar Salai, Ramanadhapuram – 623503",
  };
}

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

/* ─── lookup map types ─────────────────────────────────── */
type CustomerMap = Record<string, Customer>;
type ProductTypeMap = Record<string, ProductType>;
type OrderMap = Record<string, Order>;

/* ─── normalise a raw DB bill row into a consistent Bill shape ── */
function normaliseBill(b: any, oMap: OrderMap): Bill {
  const orderId = b.order_id ?? b.orderId ?? "";
  const order = oMap[orderId];

  // items live on the order, not the bill row
  const items = (order?.items ?? b.items ?? []).map((item: any) => ({
    ...item,
    // alias snake_case item fields to camelCase
    id: item.id,
    productTypeId: item.product_type_id ?? item.productTypeId ?? "",
    quantity: Number(item.quantity ?? 0),
    weightGrams: Number(item.weight_grams ?? item.weightGrams ?? 0),
    makingCharges: Number(item.making_charges ?? item.makingCharges ?? 0),
    amount: Number(item.amount ?? 0),
    huids: item.huids ?? [],
  }));

  return {
    ...b,
    // camelCase aliases expected by invoice components
    billNumber: b.bill_number ?? b.billNumber ?? "",
    orderId,
    customerId: b.customer_id ?? b.customerId ?? "",
    gstAmount: Number(b.gst_amount ?? b.gstAmount ?? 0),
    gstPercentage: Number(b.gst_percentage ?? b.gstPercentage ?? 3),
    subtotal: Number(b.subtotal ?? 0),
    discount: Number(b.discount ?? 0),
    totalAmount: Number(b.total_amount ?? b.totalAmount ?? 0),
    paidAmount: Number(b.paid_amount ?? b.paidAmount ?? 0),
    balanceAmount: Number(b.balance_amount ?? b.balanceAmount ?? 0),
    paymentMethod: b.payment_method ?? b.paymentMethod ?? "cash",
    createdAt: b.created_at ?? b.createdAt ?? new Date().toISOString(),
    status: b.status ?? "unpaid",
    items,
  };
}

/* ─── CUS Invoice ──────────────────────────────────────── */
function CusInvoice({
  bill,
  customerMap,
  productTypeMap,
}: {
  bill: Bill;
  customerMap: CustomerMap;
  productTypeMap: ProductTypeMap;
}) {
  const customer = customerMap[bill.customerId];
  const shop = getShopHeader();
  const sgst = +(bill.gstAmount / 2).toFixed(2);
  const cgst = +(bill.gstAmount / 2).toFixed(2);
  const roundOff = +(Math.round(bill.totalAmount) - bill.totalAmount).toFixed(2);
  const finalTotal = Math.round(bill.totalAmount);

  // Derive gold/silver rate from this bill's items (rate_per_gram on the order item).
  const rateFor = (metalKeyword: string) => {
    const it = bill.items.find((i: any) => {
      const pt = productTypeMap[i.productTypeId];
      const metal = (pt as any)?.metal || (pt as any)?.product_name || pt?.name || '';
      return String(metal).toLowerCase().includes(metalKeyword);
    });
    const rate = (it as any)?.ratePerGram ?? (it as any)?.rate_per_gram;
    return rate ? `₹${Number(rate).toLocaleString('en-IN')}` : '—';
  };
  const goldRate = rateFor('gold');
  const silverRate = rateFor('silver');

  const td = (extra?: React.CSSProperties): React.CSSProperties => ({
    padding: "8px 10px",
    verticalAlign: "top",
    ...extra,
  });

  function parseHuids(huids: any): string[] {
    if (Array.isArray(huids)) return huids;
    if (typeof huids === "string") {
      try { return JSON.parse(huids); } catch { return [huids]; }
    }
    return [];
  }

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
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2mm" }}>
        <tbody>
          <tr>
            <td style={{ fontSize: "12px", paddingBottom: "1mm" }}>
              GSTIN : <strong>{shop.gstin}</strong>
            </td>
            <td style={{ textAlign: "right", fontSize: "12px", paddingBottom: "1mm" }}>
              Phone : <strong>{shop.phone}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", borderTop: "3px double #000", borderBottom: "3px double #000", padding: "4mm 0", marginBottom: "4mm" }}>
        <div style={{ fontSize: "28px", fontWeight: "bold", letterSpacing: "4px", textTransform: "uppercase" }}>
          {shop.name}
        </div>
        <div style={{ fontSize: "13px", marginTop: "2mm" }}>
          {shop.address}
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: "15px", fontWeight: "bold", letterSpacing: "3px", borderBottom: "1px solid #000", paddingBottom: "3mm", marginBottom: "4mm" }}>
        TAX INVOICE
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "5mm", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={td({ width: "55%", borderBottom: "1px solid #ccc" })}>
              <strong>Name :</strong>&nbsp;{customer?.name || "—"}
            </td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>
              <strong>Date :</strong>&nbsp;
              {new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}>
              <strong>Address :</strong>&nbsp;{(customer as any)?.address || "—"}
            </td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>
              <strong>Bill No :</strong>&nbsp;{bill.billNumber}
            </td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}><strong>Gold Rate :</strong>&nbsp;{goldRate}</td>
            <td style={td({ borderBottom: "1px solid #ccc", textAlign: "right" })}>{(customer as any)?.city || "Ramanathapuram"}</td>
          </tr>
          <tr>
            <td style={td({ borderBottom: "1px solid #ccc" })}><strong>Silver Rate :</strong>&nbsp;{silverRate}</td>
            <td style={td({ borderBottom: "1px solid #ccc" })}></td>
          </tr>
          <tr>
            <td style={td()}><strong>PAN No. :</strong>&nbsp;{(customer as any)?.pan || "—"}</td>
            <td style={td({ textAlign: "right" })}><strong>HSN NO :</strong>&nbsp;7113</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", flexGrow: 1 }}>
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
              <th key={label} style={{ padding: "7px 10px", textAlign: align as any, fontWeight: "bold", border: "1px solid #000", whiteSpace: "nowrap", fontSize: "12px" }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, idx) => {
            const pt = productTypeMap[item.productTypeId];
            return (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{idx + 1}</td>
                <td style={{ padding: "9px 10px", border: "1px solid #ddd" }}>{pt?.name || item.productTypeId}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{parseHuids((item as any).huids).join(", ") || parseHuids(pt?.huids).join(", ")}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{item.weightGrams}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{pt?.wastage_percentage}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{item.makingCharges}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd", fontWeight: "500" }}>
                  ₹{(item.amount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
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
              ₹{(bill.subtotal ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "5mm", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ padding: "5px 10px", width: "65%" }}>Cash Received</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>₹{bill.paidAmount.toLocaleString("en-IN")}</td>
          </tr>
          {bill.discount > 0 && (
            <tr>
              <td style={{ padding: "5px 10px" }}>Discount</td>
              <td style={{ padding: "5px 10px", textAlign: "right" }}>– ₹{bill.discount.toLocaleString("en-IN")}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 10px" }}>Add SGST @ 1.5 %</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          <tr>
            <td style={{ padding: "5px 10px" }}>Add CGST @ 1.5 %</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
          {bill.balanceAmount > 0 && (
            <tr>
              <td style={{ padding: "5px 10px" }}>Balance Amount</td>
              <td style={{ padding: "5px 10px", textAlign: "right" }}>₹{bill.balanceAmount.toLocaleString("en-IN")}</td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "5px 10px" }}>Round Off</td>
            <td style={{ padding: "5px 10px", textAlign: "right" }}>{roundOff >= 0 ? "+" : ""}{roundOff.toFixed(2)}</td>
          </tr>
          <tr style={{ borderTop: "2px solid #000", borderBottom: "2px solid #000", fontWeight: "bold", fontSize: "14px" }}>
            <td style={{ padding: "7px 10px", fontStyle: "italic", fontSize: "12px", fontWeight: "normal" }}>{toWords(finalTotal)}</td>
            <td style={{ padding: "7px 10px", textAlign: "right" }}>Total &nbsp;₹{finalTotal.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "18mm", fontSize: "13px" }}>
        <tbody>
          <tr>
            <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", width: "45%", textAlign: "center" }}>Customer Signature</td>
            <td style={{ width: "10%" }}></td>
            <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", textAlign: "center" }}>For Sridhar Jewellers</td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign: "center", marginTop: "8mm", borderTop: "1px dashed #000", paddingTop: "4mm", fontSize: "12px", letterSpacing: "2px", color: "#333" }}>
        ✦&nbsp;&nbsp;THANK YOU FOR YOUR PURCHASE — PLEASE VISIT AGAIN&nbsp;&nbsp;✦
      </div>
    </div>
  );
}

/* ─── VYB Invoice ──────────────────────────────────────── */
const VYB_ROWS_FIRST = 20;
const VYB_ROWS_OTHER = 28;
const VYB_ROWS_LAST_MIN = 6;

function VyabariShopHeader({ bill, customer, page, totalPages, goldRate, silverRate }: {
  bill: Bill; customer: Customer | undefined; page: number; totalPages: number; goldRate: string; silverRate: string;
}) {
  const shop = getShopHeader();
  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1mm" }}>
        <tbody><tr>
          <td style={{ fontSize: "11px" }}>GSTIN : <strong>{shop.gstin}</strong></td>
          <td style={{ textAlign: "right", fontSize: "11px" }}>Phone : <strong>{shop.phone}</strong></td>
        </tr></tbody>
      </table>
      <div style={{ textAlign: "center", borderTop: "3px double #000", borderBottom: "3px double #000", padding: "3mm 0", marginBottom: "3mm" }}>
        <div style={{ fontSize: "26px", fontWeight: "bold", letterSpacing: "4px", textTransform: "uppercase" }}>{shop.name}</div>
        <div style={{ fontSize: "12px", marginTop: "1mm" }}>{shop.address}</div>
      </div>
      <div style={{ textAlign: "center", fontSize: "14px", fontWeight: "bold", letterSpacing: "3px", borderBottom: "1px solid #000", paddingBottom: "2mm", marginBottom: "3mm" }}>
        SALES BILL{totalPages > 1 ? `  (Page ${page} of ${totalPages})` : ""}
      </div>
      {page === 1 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3mm", fontSize: "12.5px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 8px", width: "55%", borderBottom: "1px solid #ccc" }}><strong>Name :</strong>&nbsp;{customer?.name || "—"}</td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}><strong>Sales Bill</strong></td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}><strong>Address :</strong>&nbsp;{(customer as any)?.address || "—"}</td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}>
                <strong>Date :</strong>&nbsp;{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}><strong>Bill No :</strong>&nbsp;{bill.billNumber}</td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}>{(customer as any)?.city || "Ramanathapuram"}</td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}><strong>Gold Rate :</strong>&nbsp;{goldRate}</td>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}></td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px" }}><strong>Silver Rate :</strong>&nbsp;{silverRate}</td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}><strong>HSN NO :</strong>&nbsp;711319</td>
            </tr>
          </tbody>
        </table>
      )}
      {page > 1 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3mm", fontSize: "12px" }}>
          <tbody><tr>
            <td style={{ padding: "3px 8px" }}><strong>Name :</strong>&nbsp;{customer?.name || "—"}</td>
            <td style={{ padding: "3px 8px", textAlign: "center" }}><strong>Bill No :</strong>&nbsp;{bill.billNumber}</td>
            <td style={{ padding: "3px 8px", textAlign: "right" }}>
              <strong>Date :</strong>&nbsp;{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
            </td>
          </tr></tbody>
        </table>
      )}
    </>
  );
}

function VyabariInvoice({
  bill,
  customerMap,
  productTypeMap,
}: {
  bill: Bill;
  customerMap: CustomerMap;
  productTypeMap: ProductTypeMap;
}) {
  const customer = customerMap[bill.customerId];
  const sgst = +(bill.gstAmount / 2).toFixed(2);
  const cgst = +(bill.gstAmount / 2).toFixed(2);
  const roundOff = +(Math.round(bill.totalAmount) - bill.totalAmount).toFixed(2);
  const finalTotal = Math.round(bill.totalAmount);

  const rateFor = (metalKeyword: string) => {
    const it = bill.items.find((i: any) => {
      const pt = productTypeMap[i.productTypeId];
      const metal = (pt as any)?.metal || (pt as any)?.product_name || pt?.name || '';
      return String(metal).toLowerCase().includes(metalKeyword);
    });
    const rate = (it as any)?.ratePerGram ?? (it as any)?.rate_per_gram;
    return rate ? `₹${Number(rate).toLocaleString('en-IN')}` : '—';
  };
  const goldRate = rateFor('gold');
  const silverRate = rateFor('silver');

  const allItems = bill.items;
  const chunks: typeof allItems[] = [];
  let idx = 0;
  while (idx < allItems.length) {
    const limit = chunks.length === 0 ? VYB_ROWS_FIRST : VYB_ROWS_OTHER;
    chunks.push(allItems.slice(idx, idx + limit));
    idx += limit;
  }
  if (chunks.length === 0) chunks.push([]);
  if (chunks.length > 1 && chunks[chunks.length - 1].length < VYB_ROWS_LAST_MIN) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...last];
  }

  const totalPages = chunks.length;
  const runningSubtotals: number[] = [];
  let acc = 0;
  chunks.forEach((chunk) => {
    acc += chunk.reduce((s, i) => s + i.amount, 0);
    runningSubtotals.push(acc);
  });

  const thStyle = (align: "center" | "left" | "right"): React.CSSProperties => ({
    padding: "6px 8px", textAlign: align, fontWeight: "bold",
    border: "1px solid #000", whiteSpace: "nowrap", fontSize: "11.5px", background: "#f0f0f0",
  });

  function parseHuids(huids: any): string[] {
    if (Array.isArray(huids)) return huids;
    if (typeof huids === "string") {
      try { return JSON.parse(huids); } catch { return [huids]; }
    }
    return [];
  }

  return (
    <div id="vyb-invoice-print" style={{ fontFamily: "'Times New Roman', Times, serif", color: "#000", background: "#fff" }}>
      {chunks.map((pageItems, pIdx) => {
        const isLast = pIdx === totalPages - 1;
        const pageNum = pIdx + 1;
        const startNo = chunks.slice(0, pIdx).reduce((s, c) => s + c.length, 0) + 1;
        const fillerCount = isLast ? Math.max(0, 8 - pageItems.length) : 0;

        return (
          <div key={pIdx} style={{ width: "210mm", minHeight: "297mm", padding: "12mm 15mm 10mm", boxSizing: "border-box", display: "flex", flexDirection: "column", pageBreakAfter: isLast ? "auto" : "always", breakAfter: isLast ? "auto" : "page" }}>
            <VyabariShopHeader bill={bill} customer={customer} page={pageNum} totalPages={totalPages} goldRate={goldRate} silverRate={silverRate} />
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", flexGrow: isLast ? 0 : 1 }}>
              <thead>
                <tr>
                  <th style={thStyle("center")}>S.No</th>
                  <th style={thStyle("left")}>Description</th>
                  <th style={thStyle("center")}>HUID</th>
                  <th style={thStyle("center")}>Qty</th>
                  <th style={thStyle("right")}>Weight (g)</th>
                  <th style={thStyle("right")}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, i) => {
                  const pt = productTypeMap[item.productTypeId];
                  return (
                    <tr key={item.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{startNo + i}</td>
                      <td style={{ padding: "7px 8px", border: "1px solid #ddd" }}>{pt?.name || item.productTypeId}</td>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{parseHuids((item as any).huids).join(", ") || parseHuids(pt?.huids).join(", ")}</td>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid #ddd" }}>{item.weightGrams}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid #ddd", fontWeight: "500" }}>
                        {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: fillerCount }).map((_, fi) => (
                  <tr key={`f${fi}`}>
                    {[...Array(6)].map((__, ci) => (
                      <td key={ci} style={{ padding: "7px 8px", border: "1px solid #ddd", color: "transparent" }}>.</td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {!isLast ? (
                  <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
                    <td colSpan={4} style={{ padding: "6px 8px", border: "1px solid #000", fontStyle: "italic", fontSize: "11px" }}>Subtotal carried forward…</td>
                    <td style={{ padding: "6px 8px", border: "1px solid #000" }}></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", border: "1px solid #000" }}>
                      {runningSubtotals[pIdx].toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ) : (
                  <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
                    <td colSpan={3} style={{ padding: "6px 8px", border: "1px solid #000" }}>Total</td>
                    <td style={{ padding: "6px 8px", textAlign: "center", border: "1px solid #000" }}>
                      {bill.items.reduce((s, i) => s + i.quantity, 0)}
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #000" }}></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", border: "1px solid #000" }}>
                      {bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>

            {isLast && (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4mm", fontSize: "12.5px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px 8px", width: "50%", verticalAlign: "top" }}>Cash Received</td>
                      <td style={{ padding: "5px 8px", width: "30%" }}>Add SGST @ 1.5 %</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    {bill.discount > 0 && (
                      <tr>
                        <td style={{ padding: "5px 8px" }}>Discount : ₹{bill.discount.toLocaleString("en-IN")}</td>
                        <td></td><td></td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: "5px 8px" }}></td>
                      <td style={{ padding: "5px 8px" }}>Add CGST @ 1.5 %</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 8px" }}></td>
                      <td style={{ padding: "5px 8px" }}>Round Off</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>{roundOff >= 0 ? "+" : ""}{roundOff.toFixed(2)}</td>
                    </tr>
                    <tr style={{ borderTop: "2px solid #000", borderBottom: "2px solid #000", fontWeight: "bold", fontSize: "14px" }}>
                      {bill.balanceAmount > 0
                        ? <td style={{ padding: "6px 8px" }}>Balance Amt &nbsp;{bill.balanceAmount.toLocaleString("en-IN")}</td>
                        : <td style={{ padding: "6px 8px" }}></td>}
                      <td style={{ padding: "6px 8px" }}>Total</td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>{finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: "5px 8px", fontStyle: "italic", fontSize: "12px" }}>{toWords(finalTotal)}</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16mm", fontSize: "12.5px" }}>
                  <tbody><tr>
                    <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", width: "45%", textAlign: "center" }}>Customer Signature</td>
                    <td style={{ width: "10%" }}></td>
                    <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", textAlign: "center" }}>For Sridhar Jewellery</td>
                  </tr></tbody>
                </table>
                <div style={{ textAlign: "center", marginTop: "8mm", borderTop: "1px dashed #000", paddingTop: "4mm", fontSize: "12px", letterSpacing: "2px" }}>
                  ✦&nbsp;&nbsp;THANK YOU FOR YOUR PURCHASE — PLEASE VISIT AGAIN&nbsp;&nbsp;✦
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────── */
function BillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerMap, setCustomerMap] = useState<CustomerMap>({});
  const [productTypeMap, setProductTypeMap] = useState<ProductTypeMap>({});
  const [orderMap, setOrderMap] = useState<OrderMap>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);
  const [invoiceBill, setInvoiceBill] = useState<Bill | null>(null);
  const [vybBill, setVybBill] = useState<Bill | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<Bill["paymentMethod"]>("cash");

  /* ── Single loader: fetch everything in parallel, then normalise ── */
  const loadAll = useCallback(async () => {
    const [billsRes, ordersRes, customersRes, productTypesRes] = await Promise.all([
      billStore.getAll(),
      orderStore.getAll(),
      customerStore.getAll(),
      productTypeStore.getAll(),
    ]);

    const rawOrders: Order[] = Array.isArray(ordersRes) ? ordersRes : [];

    // Build order map first so normaliseBill can attach items
    const oMap: OrderMap = {};
    rawOrders.forEach((o: Order) => { oMap[o.id] = o; });
    setOrderMap(oMap);

    // Normalise bills: snake_case → camelCase + attach items from order
    const normalisedBills: Bill[] = (Array.isArray(billsRes) ? billsRes : []).map(
      (b: any) => normaliseBill(b, oMap)
    );
    setBills(normalisedBills);
    setOrders(rawOrders);

    const cMap: CustomerMap = {};
    (Array.isArray(customersRes) ? customersRes : []).forEach((c: Customer) => { cMap[c.id] = c; });
    setCustomerMap(cMap);

    const ptMap: ProductTypeMap = {};
    (Array.isArray(productTypesRes) ? productTypesRes : []).forEach((pt: ProductType) => { ptMap[pt.id] = pt; });
    setProductTypeMap(ptMap);

    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  /* ── Derived data ── */
  const deliveredOrders = orders.filter(
    (o) => o.status === "delivered" || o.status === "approved"
  );
  const billedOrderIds = new Set(bills.map((b) => b.orderId));
  const unbilledOrders = deliveredOrders.filter((o) => !billedOrderIds.has(o.id));
  const selectedOrder = orderMap[selectedOrderId];

  const handleCreate = async () => {
    if (!selectedOrder) return;
    const disc = Number(discount);
    const total = Number(selectedOrder.total_amount) - disc;
    const paid = Number(paidAmount) || total;
    const fullyPaid = paid >= total;

    await billStore.add({
      orderId: selectedOrder.id,
      customerId: selectedOrder.customer_id,
      items: selectedOrder.items,
      subtotal: Number(selectedOrder.subtotal),
      gstAmount: Number(selectedOrder.gst_amount),
      gstPercentage: 3,
      discount: disc,
      totalAmount: total,
      paidAmount: paid,
      balanceAmount: total - paid,
      paymentMethod,
      status: fullyPaid ? "paid" : paid > 0 ? "partial" : "unpaid",
    });

    // Sync payment_received on the parent order so the dashboard / orders
    // page reflects payment state. Backend may ignore unknown fields — that's
    // a soft failure, the bill itself is still the source of truth.
    if (fullyPaid) {
      try {
        await orderStore.update(selectedOrder.id, { payment_received: true, paymentReceived: true });
      } catch (e) {
        console.warn('Could not sync payment_received on order', e);
      }
    }

    await loadAll();
    setDialogOpen(false);
    setSelectedOrderId("");
    setDiscount("0");
    setPaidAmount("");
  };

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
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; background: #fff; font-family: 'Times New Roman', serif; overflow: hidden; }
          #cus-invoice-print { width: 210mm !important; height: 297mm !important; padding: 10mm 12mm !important; overflow: hidden; }
          table { width: 100%; border-collapse: collapse; page-break-inside: avoid; }
          tr, td, th { page-break-inside: avoid; }
          td, th { padding: 6px 8px !important; font-size: 12px !important; }
          @page { size: A4 portrait; margin: 0; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const handleVybPrint = () => {
    const content = document.getElementById("vyb-invoice-print");
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=1100");
    if (!win) return;
    win.document.write(`
      <html>
      <head>
        <title>Sales Bill ${vybBill?.billNumber}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { width: 210mm; background: #fff; }
          @page { size: A4 portrait; margin: 0; }
          @media print { html, body { width: 210mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        ${content.outerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const detailCustomer = detailBill ? customerMap[detailBill.customerId] : null;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Loading billing data…
        </div>
      </AppLayout>
    );
  }


  function parseHuids(huids: any): string[] {
    if (Array.isArray(huids)) return huids;
    if (typeof huids === "string") {
      try { return JSON.parse(huids); } catch { return [huids]; }
    }
    return [];
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Billing</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate bills from approved/delivered orders</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
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
                    const customer = customerMap[b.customerId];
                    const order = orderMap[b.orderId];
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-sm">{b.billNumber}</TableCell>
                        <TableCell className="font-mono text-sm">{order?.order_number || "-"}</TableCell>
                        <TableCell className="font-medium">{customer?.name || "—"}</TableCell>
                        <TableCell>₹{b.totalAmount.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{b.paidAmount.toLocaleString("en-IN")}</TableCell>
                        <TableCell>₹{b.balanceAmount.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="capitalize text-xs">
                          {b.paymentMethod?.replace("_", " ") || "cash"}
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
                            {b.status || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => setDetailBill(b)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 px-2 text-xs font-bold tracking-wide border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                            onClick={() => setInvoiceBill(b)}
                          >
                            CUS
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-1 h-8 px-2 text-xs font-bold tracking-wide border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => setVybBill(b)}
                          >
                            VYB
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {bills.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No bills yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ── Create Bill Dialog ── */}
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
                    {unbilledOrders.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.order_number} — {customerMap[o.customer_id]?.name} (₹{Number(o.total_amount).toLocaleString("en-IN")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedOrder && (
                <>
                  <div className="p-3 rounded-lg bg-accent/20 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{Number(selectedOrder.subtotal).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (3%)</span>
                      <span>₹{Number(selectedOrder.gst_amount).toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>₹{Number(selectedOrder.total_amount).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Discount (₹)</Label>
                      <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Paid Amount (₹)</Label>
                      <Input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder={String(Number(selectedOrder.total_amount) - Number(discount))}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as Bill["paymentMethod"])}>
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

        {/* ── Bill Detail Dialog ── */}
        <Dialog open={!!detailBill} onOpenChange={() => setDetailBill(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bill {detailBill?.billNumber}</DialogTitle>
              <DialogDescription>
                {detailBill ? new Date(detailBill.createdAt).toLocaleString() : ""}
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
                    <p>{(detailCustomer as any)?.gstin || "-"}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3">
                  {(detailBill.items ?? []).map((item) => {
                    const pt = productTypeMap[item.productTypeId];
                    return (
                      <div key={item.id} className="flex justify-between py-1">
                        <span>{pt?.name} × {item.quantity}</span>
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
                    <span className="text-muted-foreground">GST ({detailBill.gstPercentage}%)</span>
                    <span>₹{detailBill.gstAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {detailBill.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span>-₹{detailBill.discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">₹{detailBill.totalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid</span>
                    <span>₹{detailBill.paidAmount.toLocaleString("en-IN")}</span>
                  </div>
                  {detailBill.balanceAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Balance</span>
                      <span>₹{detailBill.balanceAmount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── CUS Invoice Dialog ── */}
        <Dialog open={!!invoiceBill} onOpenChange={() => setInvoiceBill(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Customer Invoice — {invoiceBill?.billNumber}
              </DialogTitle>
              <DialogDescription>Sridhar Jewellers style invoice • ready to print</DialogDescription>
            </DialogHeader>
            <div ref={printRef} className="border border-border rounded-md overflow-auto max-h-[65vh] bg-white p-2">
              {invoiceBill && (
                <CusInvoice bill={invoiceBill} customerMap={customerMap} productTypeMap={productTypeMap} />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceBill(null)}>Close</Button>
              <Button onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> Print Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── VYB Sales Bill Dialog ── */}
        <Dialog open={!!vybBill} onOpenChange={() => setVybBill(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Sales Bill (Vyabari) — {vybBill?.billNumber}
              </DialogTitle>
              <DialogDescription>Multi-page Sales Bill • auto-paginates for large orders</DialogDescription>
            </DialogHeader>
            <div className="border border-border rounded-md overflow-auto max-h-[65vh] bg-white p-2">
              {vybBill && (
                <VyabariInvoice bill={vybBill} customerMap={customerMap} productTypeMap={productTypeMap} />
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVybBill(null)}>Close</Button>
              <Button onClick={handleVybPrint} className="gap-2">
                <Printer className="h-4 w-4" /> Print Sales Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}