import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { customerStore, billStore } from "@/lib/store";
import { localDb, newId, inr } from "@/lib/localDb";
import { Wallet, ArrowDownLeft, ArrowUpRight, Coins } from "lucide-react";
import type { Customer, Bill } from "@/lib/types";

export const Route = createFileRoute("/ledger")({
  component: () => (
    <AppLayout>
      <LedgerPage />
    </AppLayout>
  ),
});

// Manual entries (payments received, old-gold exchanges, advance deposits)
type LedgerEntry = {
  id: string;
  customerId: string;
  date: string;
  type: "payment" | "exchange" | "advance" | "adjustment";
  amount: number;
  notes: string;
  // For old-gold exchange
  oldGoldGrams?: number;
  oldGoldPurity?: string;
  oldGoldRate?: number;
  createdAt: string;
};

const L_KEY = "ledger_entries";

function LedgerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [dlg, setDlg] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    date: new Date().toISOString().slice(0, 10),
    type: "payment" as LedgerEntry["type"],
    amount: "",
    notes: "",
    oldGoldGrams: "",
    oldGoldPurity: "22K",
    oldGoldRate: "",
  });

  useEffect(() => {
    (async () => {
      const [c, b] = await Promise.all([customerStore.getAll(), billStore.getAll()]);
      setCustomers(c);
      setBills(b);
      setEntries(localDb.read<LedgerEntry[]>(L_KEY, []));
      if (c.length && !selected) setSelected(c[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cust = customers.find((c) => c.id === selected);

  // Build per-customer summary
  const summaries = useMemo(() => {
    return customers.map((c) => {
      const cBills = bills.filter((b) => (b.customerId || (b as any).customer_id) === c.id);
      const billed = cBills.reduce((s, b) => s + Number(b.totalAmount || (b as any).total_amount || 0), 0);
      const paidViaBill = cBills.reduce((s, b) => s + Number(b.paidAmount || (b as any).paid_amount || 0), 0);
      const cEntries = entries.filter((e) => e.customerId === c.id);
      const credits = cEntries
        .filter((e) => e.type === "payment" || e.type === "exchange" || e.type === "advance")
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      const adjustments = cEntries.filter((e) => e.type === "adjustment").reduce((s, e) => s + Number(e.amount || 0), 0);
      const outstanding = billed - paidViaBill - credits + adjustments;
      return { customer: c, billed, paid: paidViaBill + credits, outstanding };
    });
  }, [customers, bills, entries]);

  const totalOutstanding = summaries.reduce((s, x) => s + Math.max(0, x.outstanding), 0);
  const totalAdvance = summaries.reduce((s, x) => s + Math.max(0, -x.outstanding), 0);

  // Detailed transactions for selected customer (bills + ledger entries) sorted by date desc
  const detailRows = useMemo(() => {
    if (!cust) return [] as Array<{ date: string; label: string; debit: number; credit: number; type: string }>;
    const rows: Array<{ date: string; label: string; debit: number; credit: number; type: string }> = [];
    bills
      .filter((b) => (b.customerId || (b as any).customer_id) === cust.id)
      .forEach((b) => {
        const total = Number(b.totalAmount || (b as any).total_amount || 0);
        const paid = Number(b.paidAmount || (b as any).paid_amount || 0);
        rows.push({
          date: String(b.createdAt || (b as any).created_at || new Date().toISOString()),
          label: `Bill ${b.billNumber || (b as any).bill_number || ""}`,
          debit: total,
          credit: paid,
          type: "bill",
        });
      });
    entries
      .filter((e) => e.customerId === cust.id)
      .forEach((e) => {
        const labels: Record<string, string> = {
          payment: "Payment received",
          exchange: `Old gold exchange${e.oldGoldGrams ? ` (${e.oldGoldGrams}g ${e.oldGoldPurity})` : ""}`,
          advance: "Advance deposit",
          adjustment: "Adjustment",
        };
        rows.push({
          date: e.date,
          label: e.notes ? `${labels[e.type]} — ${e.notes}` : labels[e.type],
          debit: e.type === "adjustment" ? Number(e.amount || 0) : 0,
          credit: e.type !== "adjustment" ? Number(e.amount || 0) : 0,
          type: e.type,
        });
      });
    return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [cust, bills, entries]);

  const openDialog = () => {
    setForm({ ...form, customerId: selected, amount: "", notes: "", oldGoldGrams: "", oldGoldRate: "" });
    setDlg(true);
  };

  const computedExchangeAmount = useMemo(() => {
    if (form.type !== "exchange") return 0;
    return (Number(form.oldGoldGrams) || 0) * (Number(form.oldGoldRate) || 0);
  }, [form]);

  const save = () => {
    if (!form.customerId) return alert("Select a customer");
    const amount =
      form.type === "exchange" && !form.amount
        ? computedExchangeAmount
        : Number(form.amount) || 0;
    if (!amount) return alert("Amount required");
    const entry: LedgerEntry = {
      id: newId(),
      customerId: form.customerId,
      date: form.date,
      type: form.type,
      amount,
      notes: form.notes,
      oldGoldGrams: form.type === "exchange" ? Number(form.oldGoldGrams) || 0 : undefined,
      oldGoldPurity: form.type === "exchange" ? form.oldGoldPurity : undefined,
      oldGoldRate: form.type === "exchange" ? Number(form.oldGoldRate) || 0 : undefined,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...entries];
    localDb.write(L_KEY, next);
    setEntries(next);
    setDlg(false);
  };

  const deleteEntry = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const next = localDb.remove<LedgerEntry>(L_KEY, id) as LedgerEntry[];
    setEntries(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Customer Ledger</h1>
        <p className="text-muted-foreground">Outstanding balances, payments &amp; old-gold exchanges</p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/15 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold">{inr(totalOutstanding)}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer Advance</p>
              <p className="text-2xl font-bold">{inr(totalAdvance)}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customers Tracked</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      {/* Outstanding list */}
      <Card>
        <CardHeader><CardTitle>Outstanding by Customer</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Billed</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No customers yet.</TableCell></TableRow>
              ) : summaries.map(({ customer, billed, paid, outstanding }) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone || "—"}</TableCell>
                  <TableCell className="text-right">{inr(billed)}</TableCell>
                  <TableCell className="text-right">{inr(paid)}</TableCell>
                  <TableCell className="text-right">
                    {outstanding > 0.5 ? (
                      <Badge variant="destructive">{inr(outstanding)} due</Badge>
                    ) : outstanding < -0.5 ? (
                      <Badge className="bg-emerald-500">{inr(-outstanding)} advance</Badge>
                    ) : (
                      <Badge variant="outline">Settled</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(customer.id)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="shrink-0">Statement —</CardTitle>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Pick customer" /></SelectTrigger>
              <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={openDialog} disabled={!cust}>
            <Coins className="h-4 w-4 mr-1" /> Record Payment / Exchange
          </Button>
        </CardHeader>
        <CardContent>
          {!cust ? (
            <p className="text-muted-foreground text-sm">Select a customer to view statement.</p>
          ) : detailRows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions for this customer.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit (Bill)</TableHead>
                  <TableHead className="text-right">Credit (Paid)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(r.date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>{r.label}</TableCell>
                    <TableCell className="text-right">{r.debit ? inr(r.debit) : "—"}</TableCell>
                    <TableCell className="text-right">{r.credit ? inr(r.credit) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual entries list with delete */}
      {entries.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Recent Manual Entries</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.slice(0, 10).map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell>{customers.find((c) => c.id === e.customerId)?.name || "—"}</TableCell>
                    <TableCell className="capitalize">{e.type}</TableCell>
                    <TableCell className="text-right">{inr(e.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.notes || "—"}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteEntry(e.id)}>Delete</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={dlg} onOpenChange={setDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment / Exchange</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment received</SelectItem>
                  <SelectItem value="exchange">Old gold exchange</SelectItem>
                  <SelectItem value="advance">Advance deposit</SelectItem>
                  <SelectItem value="adjustment">Adjustment (debit)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "exchange" && (
              <>
                <div><Label>Old Gold (grams)</Label><Input type="number" step="0.001" value={form.oldGoldGrams} onChange={(e) => setForm({ ...form, oldGoldGrams: e.target.value })} /></div>
                <div><Label>Purity</Label><Input value={form.oldGoldPurity} onChange={(e) => setForm({ ...form, oldGoldPurity: e.target.value })} /></div>
                <div><Label>Rate per gram</Label><Input type="number" value={form.oldGoldRate} onChange={(e) => setForm({ ...form, oldGoldRate: e.target.value })} /></div>
                <div className="md:col-span-2 text-sm text-muted-foreground">
                  Computed value: <span className="font-semibold text-foreground">{inr(computedExchangeAmount)}</span>
                  {" "}— overridden by Amount field if you fill it in.
                </div>
              </>
            )}
            <div><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={form.type === "exchange" ? "Auto from grams × rate" : ""} /></div>
            <div className="md:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlg(false)}>Cancel</Button>
            <Button onClick={save}>Save Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
