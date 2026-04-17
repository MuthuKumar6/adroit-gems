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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useRef, useEffect } from "react";
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

            console.log("items", pt)
            console.log("data", item)
            const even = idx % 2 === 0;
            return (
              <tr key={item.id} style={{ background: even ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{idx + 1}</td>
                <td style={{ padding: "9px 10px", border: "1px solid #ddd" }}>{pt?.name || item.productTypeId}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{pt?.huids?.join(", ")}</td>
                <td style={{ padding: "9px 10px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{item.weightGrams}</td>
                <td style={{ padding: "9px 10px", textAlign: "right", border: "1px solid #ddd" }}>{pt?.wastagePercentage}</td>
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

/* ─── Vyabari (Sales Bill) Invoice — dynamic multi-page ── */
const VYB_ROWS_FIRST = 20; // item rows on page 1 (header is taller)
const VYB_ROWS_OTHER = 28; // item rows on pages 2+
const VYB_ROWS_LAST_MIN = 6; // if last-page rows < this, merge with previous page

function VyabariShopHeader({ bill, customer, page, totalPages }: {
  bill: Bill; customer: any; page: number; totalPages: number;
}) {
  return (
    <>
      {/* GSTIN / Phone */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1mm" }}>
        <tbody><tr>
          <td style={{ fontSize: "11px" }}>GSTIN : <strong>33BNFPS1282R1ZE</strong></td>
          <td style={{ textAlign: "right", fontSize: "11px" }}>Phone : <strong>94423 28128</strong></td>
        </tr></tbody>
      </table>

      {/* Shop name */}
      <div style={{ textAlign: "center", borderTop: "3px double #000", borderBottom: "3px double #000", padding: "3mm 0", marginBottom: "3mm" }}>
        <div style={{ fontSize: "26px", fontWeight: "bold", letterSpacing: "4px" }}>SRIDHAR JEWELLERS</div>
        <div style={{ fontSize: "12px", marginTop: "1mm" }}>215, Swamy Viveganandar Salai, Ramanadhapuram – 623501</div>
      </div>

      {/* Sales Bill title */}
      <div style={{ textAlign: "center", fontSize: "14px", fontWeight: "bold", letterSpacing: "3px", borderBottom: "1px solid #000", paddingBottom: "2mm", marginBottom: "3mm" }}>
        SALES BILL{totalPages > 1 ? `  (Page ${page} of ${totalPages})` : ""}
      </div>

      {/* Customer / Meta — only on first page */}
      {page === 1 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3mm", fontSize: "12.5px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "4px 8px", width: "55%", borderBottom: "1px solid #ccc" }}>
                <strong>Name :</strong>&nbsp;{customer?.name || "—"}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}>
                <strong>Sales Bill</strong>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}>
                <strong>Address :</strong>&nbsp;{(customer as any)?.address || "—"}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}>
                <strong>Date :</strong>&nbsp;{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}>
                <strong>Bill No :</strong>&nbsp;{bill.billNumber}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", borderBottom: "1px solid #ccc" }}>
                {(customer as any)?.city || "Ramanathapuram"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}>
                <strong>Gold Rate :</strong>&nbsp;—
              </td>
              <td style={{ padding: "4px 8px", borderBottom: "1px solid #ccc" }}></td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px" }}>
                <strong>Silver Rate :</strong>&nbsp;—
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                <strong>HSN NO :</strong>&nbsp;711319
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* Continuation header for pages 2+ */}
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

function VyabariInvoice({ bill }: { bill: Bill }) {
  const customer = customerStore.getById(bill.customerId);
  const sgst = +(bill.gstAmount / 2).toFixed(2);
  const cgst = +(bill.gstAmount / 2).toFixed(2);
  const roundOff = +(Math.round(bill.totalAmount) - bill.totalAmount).toFixed(2);
  const finalTotal = Math.round(bill.totalAmount);

  /* ── chunk items into pages ── */
  const allItems = bill.items;
  // const allItems = [
  //   { id: "1", productTypeId: "pt-necklace", quantity: 1, weightGrams: 18.50, makingCharges: 1250, amount: 45200 },
  //   { id: "2", productTypeId: "pt-bangle", quantity: 2, weightGrams: 9.25, makingCharges: 680, amount: 21400 },
  //   { id: "3", productTypeId: "pt-ring", quantity: 1, weightGrams: 4.80, makingCharges: 450, amount: 12800 },
  //   { id: "4", productTypeId: "pt-earring", quantity: 1, weightGrams: 6.35, makingCharges: 520, amount: 15600 },
  //   { id: "5", productTypeId: "pt-pendant", quantity: 1, weightGrams: 7.90, makingCharges: 890, amount: 19800 },
  //   { id: "6", productTypeId: "pt-chain", quantity: 1, weightGrams: 22.40, makingCharges: 1450, amount: 52800 },
  //   { id: "7", productTypeId: "pt-bracelet", quantity: 1, weightGrams: 14.60, makingCharges: 980, amount: 34200 },
  //   { id: "8", productTypeId: "pt-mangalsutra", quantity: 1, weightGrams: 16.75, makingCharges: 1100, amount: 38900 },
  //   { id: "9", productTypeId: "pt-nose-pin", quantity: 2, weightGrams: 1.25, makingCharges: 180, amount: 4200 },
  //   { id: "10", productTypeId: "pt-toe-ring", quantity: 1, weightGrams: 2.80, makingCharges: 220, amount: 6800 },

  //   { id: "11", productTypeId: "pt-necklace", quantity: 1, weightGrams: 24.30, makingCharges: 1680, amount: 61200 },
  //   { id: "12", productTypeId: "pt-bangle", quantity: 4, weightGrams: 11.50, makingCharges: 750, amount: 29800 },
  //   { id: "13", productTypeId: "pt-ring", quantity: 3, weightGrams: 5.60, makingCharges: 420, amount: 17400 },
  //   { id: "14", productTypeId: "pt-earring", quantity: 1, weightGrams: 8.90, makingCharges: 680, amount: 21900 },
  //   { id: "15", productTypeId: "pt-pendant", quantity: 1, weightGrams: 5.40, makingCharges: 620, amount: 14200 },
  //   { id: "16", productTypeId: "pt-chain", quantity: 1, weightGrams: 19.80, makingCharges: 1320, amount: 47800 },
  //   { id: "17", productTypeId: "pt-bracelet", quantity: 1, weightGrams: 13.20, makingCharges: 920, amount: 31500 },
  //   { id: "18", productTypeId: "pt-mangalsutra", quantity: 1, weightGrams: 21.10, makingCharges: 1450, amount: 50200 },
  //   { id: "19", productTypeId: "pt-nose-pin", quantity: 1, weightGrams: 0.95, makingCharges: 150, amount: 3200 },
  //   { id: "20", productTypeId: "pt-toe-ring", quantity: 2, weightGrams: 3.10, makingCharges: 240, amount: 7800 },

  //   { id: "21", productTypeId: "pt-necklace", quantity: 1, weightGrams: 15.75, makingCharges: 1050, amount: 37800 },
  //   { id: "22", productTypeId: "pt-bangle", quantity: 2, weightGrams: 10.80, makingCharges: 720, amount: 25600 },
  //   { id: "23", productTypeId: "pt-ring", quantity: 1, weightGrams: 6.25, makingCharges: 480, amount: 16200 },
  //   { id: "24", productTypeId: "pt-earring", quantity: 1, weightGrams: 7.45, makingCharges: 590, amount: 18400 },
  //   { id: "25", productTypeId: "pt-pendant", quantity: 2, weightGrams: 4.60, makingCharges: 410, amount: 12400 },
  //   { id: "26", productTypeId: "pt-chain", quantity: 1, weightGrams: 25.90, makingCharges: 1720, amount: 63500 },
  //   { id: "27", productTypeId: "pt-bracelet", quantity: 1, weightGrams: 12.35, makingCharges: 850, amount: 29400 },
  //   { id: "28", productTypeId: "pt-mangalsutra", quantity: 1, weightGrams: 18.20, makingCharges: 1280, amount: 43500 },
  //   { id: "29", productTypeId: "pt-nose-pin", quantity: 1, weightGrams: 1.10, makingCharges: 160, amount: 3800 },
  //   { id: "30", productTypeId: "pt-toe-ring", quantity: 1, weightGrams: 2.45, makingCharges: 210, amount: 6200 },

  //   { id: "31", productTypeId: "pt-necklace", quantity: 1, weightGrams: 20.15, makingCharges: 1380, amount: 48900 },
  //   { id: "32", productTypeId: "pt-bangle", quantity: 3, weightGrams: 8.90, makingCharges: 610, amount: 21900 },
  //   { id: "33", productTypeId: "pt-ring", quantity: 2, weightGrams: 5.10, makingCharges: 390, amount: 13800 },
  //   { id: "34", productTypeId: "pt-earring", quantity: 1, weightGrams: 9.60, makingCharges: 720, amount: 23100 },
  //   { id: "35", productTypeId: "pt-pendant", quantity: 1, weightGrams: 6.80, makingCharges: 750, amount: 17200 },
  //   { id: "36", productTypeId: "pt-chain", quantity: 1, weightGrams: 17.40, makingCharges: 1180, amount: 41200 },
  //   { id: "37", productTypeId: "pt-bracelet", quantity: 1, weightGrams: 14.90, makingCharges: 1020, amount: 35800 },
  //   { id: "38", productTypeId: "pt-mangalsutra", quantity: 1, weightGrams: 19.50, makingCharges: 1350, amount: 46800 },
  //   { id: "39", productTypeId: "pt-nose-pin", quantity: 2, weightGrams: 1.35, makingCharges: 190, amount: 4600 },
  //   { id: "40", productTypeId: "pt-toe-ring", quantity: 1, weightGrams: 2.90, makingCharges: 230, amount: 7100 },
  // ];
  const chunks: typeof allItems[] = [];
  let idx = 0;
  while (idx < allItems.length) {
    const limit = chunks.length === 0 ? VYB_ROWS_FIRST : VYB_ROWS_OTHER;
    chunks.push(allItems.slice(idx, idx + limit));
    idx += limit;
  }
  if (chunks.length === 0) chunks.push([]);

  // merge tiny last chunk into previous page
  if (chunks.length > 1 && chunks[chunks.length - 1].length < VYB_ROWS_LAST_MIN) {
    const last = chunks.pop()!;
    chunks[chunks.length - 1] = [...chunks[chunks.length - 1], ...last];
  }

  const totalPages = chunks.length;

  /* running subtotal per page */
  const runningSubtotals: number[] = [];
  let acc = 0;
  chunks.forEach((chunk) => {
    acc += chunk.reduce((s, i) => s + i.amount, 0);
    runningSubtotals.push(acc);
  });

  const colHeaders = ["S.No", "Description", "HUID", "Qty", "Weight (g)", "Amount (₹)"];

  const thStyle = (align: "center" | "left" | "right"): React.CSSProperties => ({
    padding: "6px 8px",
    textAlign: align,
    fontWeight: "bold",
    border: "1px solid #000",
    whiteSpace: "nowrap",
    fontSize: "11.5px",
    background: "#f0f0f0",
  });

  return (
    <div id="vyb-invoice-print" style={{ fontFamily: "'Times New Roman', Times, serif", color: "#000", background: "#fff" }}>
      {chunks.map((pageItems, pIdx) => {
        const isLast = pIdx === totalPages - 1;
        const pageNum = pIdx + 1;
        // global start index for S.No
        const startNo = chunks.slice(0, pIdx).reduce((s, c) => s + c.length, 0) + 1;
        // rows this page subtotal
        const pageSubtotal = pageItems.reduce((s, i) => s + i.amount, 0);
        // filler rows to fill a nice height on non-last pages
        const targetRows = pIdx === 0 ? VYB_ROWS_FIRST : VYB_ROWS_OTHER;
        const fillerCount = isLast ? Math.max(0, 8 - pageItems.length) : 0;

        return (
          <div
            key={pIdx}
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: "12mm 15mm 10mm",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              pageBreakAfter: isLast ? "auto" : "always",
              breakAfter: isLast ? "auto" : "page",
            }}
          >
            {/* ── Shop header ── */}
            <VyabariShopHeader bill={bill} customer={customer} page={pageNum} totalPages={totalPages} />

            {/* ── Items table ── */}
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
                  const pt = productTypeStore.getById(item.productTypeId);
                  const even = i % 2 === 0;
                  return (
                    <tr key={item.id} style={{ background: even ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{startNo + i}</td>
                      <td style={{ padding: "7px 8px", border: "1px solid #ddd" }}>{pt?.name || item.productTypeId}</td>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{pt?.huids.join(",")}</td>
                      <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #ddd" }}>{item.quantity}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid #ddd" }}>{item.weightGrams}</td>
                      <td style={{ padding: "7px 8px", textAlign: "right", border: "1px solid #ddd", fontWeight: "500" }}>
                        {item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {/* Filler rows (last page only) */}
                {Array.from({ length: fillerCount }).map((_, fi) => (
                  <tr key={`f${fi}`}>
                    {[...Array(6)].map((__, ci) => (
                      <td key={ci} style={{ padding: "7px 8px", border: "1px solid #ddd", color: "transparent" }}>.</td>
                    ))}
                  </tr>
                ))}
              </tbody>

              {/* Page footer row */}
              <tfoot>
                {!isLast ? (
                  /* Intermediate page — show "carried forward" */
                  <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
                    <td colSpan={4} style={{ padding: "6px 8px", border: "1px solid #000", fontStyle: "italic", fontSize: "11px" }}>
                      Subtotal carried forward…
                    </td>
                    <td style={{ padding: "6px 8px", border: "1px solid #000" }}></td>
                    <td style={{ padding: "6px 8px", textAlign: "right", border: "1px solid #000" }}>
                      {runningSubtotals[pIdx].toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ) : (
                  /* Last page — grand total row */
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

            {/* ── Summary — last page only ── */}
            {isLast && (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4mm", fontSize: "12.5px" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "5px 8px", width: "50%", verticalAlign: "top" }}>
                        Cash Received
                      </td>
                      <td style={{ padding: "5px 8px", width: "30%" }}>Add SGST @ 1.5 %</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>
                        {sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {bill.discount > 0 && (
                      <tr>
                        <td style={{ padding: "5px 8px" }}>Discount : ₹{bill.discount.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "5px 8px" }}></td>
                        <td></td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ padding: "5px 8px" }}></td>
                      <td style={{ padding: "5px 8px" }}>Add CGST @ 1.5 %</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>
                        {cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: "5px 8px" }}></td>
                      <td style={{ padding: "5px 8px" }}>Round Off</td>
                      <td style={{ padding: "5px 8px", textAlign: "right" }}>
                        {roundOff >= 0 ? "+" : ""}{roundOff.toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderTop: "2px solid #000", borderBottom: "2px solid #000", fontWeight: "bold", fontSize: "14px" }}>
                      {bill.balanceAmount > 0 ? (
                        <td style={{ padding: "6px 8px" }}>Balance Amt &nbsp; {bill.balanceAmount.toLocaleString("en-IN")}</td>
                      ) : (
                        <td style={{ padding: "6px 8px" }}></td>
                      )}
                      <td style={{ padding: "6px 8px" }}>Total</td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>
                        {finalTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} style={{ padding: "5px 8px", fontStyle: "italic", fontSize: "12px" }}>
                        {toWords(finalTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16mm", fontSize: "12.5px" }}>
                  <tbody><tr>
                    <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", width: "45%", textAlign: "center" }}>
                      Customer Signature
                    </td>
                    <td style={{ width: "10%" }}></td>
                    <td style={{ borderTop: "1px solid #000", paddingTop: "3mm", textAlign: "center" }}>
                      For Sridhar Jewellery
                    </td>
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
  const [bills, setBills] = useState<Bill[]>(billStore.getAll());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailBill, setDetailBill] = useState<Bill | null>(null);
  const [invoiceBill, setInvoiceBill] = useState<Bill | null>(null);
  const [vybBill, setVybBill] = useState<Bill | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [orders, setOrders] = useState<Order[]>(orderStore.getAll());
  const deliveredOrders = orders.filter((o) => o.status === "delivered" || o.status === "approved");
  const billedOrderIds = bills.map((b) => b.orderId);

  console.log("All orders:", billedOrderIds);

    console.log("All orders:", deliveredOrders);

  const unbilledOrders = deliveredOrders.filter(
    (o) => !billedOrderIds.includes(o.id)
  );

  console.log("Unbilled orders:", unbilledOrders, unbilledOrders.length);

  const refreshOrders = () => setOrders(orderStore.getAll());

  // Refresh from localStorage on mount (handles navigation from orders page)
  useEffect(() => {
    setOrders(orderStore.getAll());
    setBills(billStore.getAll());
  }, []);

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
  // const handlePrint = () => {
  //   const content = document.getElementById("cus-invoice-print");
  //   if (!content) return;
  //   const win = window.open("", "_blank", "width=900,height=1100");
  //   if (!win) return;
  //   win.document.write(`
  //     <html>
  //     <head>
  //       <title>Invoice ${invoiceBill?.billNumber}</title>
  //       <style>
  //         *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  //         html, body {
  //           width: 210mm;
  //           height: 297mm;
  //           background: #fff;
  //         }
  //         body > div {
  //           width: 210mm !important;
  //           min-height: 297mm !important;
  //           padding: 14mm 16mm 12mm !important;
  //         }
  //         @page {
  //           size: A4 portrait;
  //           margin: 0;
  //         }
  //         @media print {
  //           html, body { width: 210mm; height: 297mm; }
  //           body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       ${content.outerHTML}
  //       <script>window.onload = () => { window.print(); window.close(); }<\/script>
  //     </body>
  //     </html>
  //   `);
  //   win.document.close();
  // };

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
        }

        html, body {
          margin: 0;
          padding: 0;
          width: 210mm;
          height: 297mm;
          background: #fff;
          font-family: 'Times New Roman', serif;
          overflow: hidden; /* 🔥 Prevent extra page */
        }

        #cus-invoice-print {
          width: 210mm !important;
          height: 297mm !important;
          padding: 10mm 12mm !important; /* 🔥 reduced */
          overflow: hidden; /* 🔥 key fix */
        }

        table {
          width: 100%;
          border-collapse: collapse;
          page-break-inside: avoid;
        }

        tr, td, th {
          page-break-inside: avoid;
        }

        td, th {
          padding: 6px 8px !important; /* 🔥 compact rows */
          font-size: 12px !important;
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
      ${content.outerHTML}
      <script>
        window.onload = () => {
          window.print();
          window.close();
        };
      <\/script>
    </body>
    </html>
  `);

    win.document.close();
  };


  /* Vyabari print handler — multi-page aware */
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
          @media print {
            html, body { width: 210mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
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
            onClick={() => { refreshOrders(); setDialogOpen(true); }}
            // disabled={unbilledOrders.length == 0}
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

                          {/* ── VYB Sales Bill button ── */}
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


        {/* ── VYB Sales Bill Dialog ───────────────────────────── */}
        <Dialog open={!!vybBill} onOpenChange={() => setVybBill(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Sales Bill (Vyabari) — {vybBill?.billNumber}
              </DialogTitle>
              <DialogDescription>
                Multi-page Sales Bill • auto-paginates for large orders
              </DialogDescription>
            </DialogHeader>

            <div className="border border-border rounded-md overflow-auto max-h-[65vh] bg-white p-2">
              {vybBill && <VyabariInvoice bill={vybBill} />}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setVybBill(null)}>
                Close
              </Button>
              <Button onClick={handleVybPrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Sales Bill
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}