import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useEffect, useMemo, useState } from "react";
import { localDb, newId, inr } from "@/lib/localDb";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/rates")({
  component: () => (
    <AppLayout>
      <RatesPage />
    </AppLayout>
  ),
});

type RateEntry = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  gold24k: number;
  gold22k: number;
  gold18k: number;
  silver: number;
  createdAt: string;
};

const STORAGE_KEY = "rate_history";

function RatesPage() {
  const [entries, setEntries] = useState<RateEntry[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    gold24k: "",
    gold22k: "",
    gold18k: "",
    silver: "",
  });

  useEffect(() => {
    setEntries(localDb.read<RateEntry[]>(STORAGE_KEY, []));
  }, []);

  const latest = entries[0];
  const previous = entries[1];

  const trend = (k: keyof RateEntry) => {
    if (!latest || !previous) return 0;
    const a = Number(latest[k] || 0);
    const b = Number(previous[k] || 0);
    return b ? ((a - b) / b) * 100 : 0;
  };

  const saveRate = () => {
    if (!form.gold22k && !form.silver) {
      alert("Enter at least Gold 22K or Silver rate");
      return;
    }
    const entry: RateEntry = {
      id: newId(),
      date: form.date,
      gold24k: Number(form.gold24k) || 0,
      gold22k: Number(form.gold22k) || 0,
      gold18k: Number(form.gold18k) || 0,
      silver: Number(form.silver) || 0,
      createdAt: new Date().toISOString(),
    };
    const next = [entry, ...entries.filter((e) => e.date !== entry.date)];
    next.sort((a, b) => (a.date < b.date ? 1 : -1));
    localDb.write(STORAGE_KEY, next);
    setEntries(next);
    setForm({ ...form, gold24k: "", gold22k: "", gold18k: "", silver: "" });
  };

  const deleteEntry = (id: string) => {
    if (!confirm("Delete this rate entry?")) return;
    const next = localDb.remove<RateEntry>(STORAGE_KEY, id);
    setEntries(next as RateEntry[]);
  };

  const chartData = useMemo(
    () =>
      [...entries]
        .reverse()
        .slice(-30)
        .map((e) => ({
          date: new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          "22K Gold": e.gold22k,
          "24K Gold": e.gold24k,
          Silver: e.silver,
        })),
    [entries]
  );

  const TrendBadge = ({ pct }: { pct: number }) => {
    if (!pct) return <span className="text-xs text-muted-foreground">—</span>;
    const up = pct > 0;
    return (
      <Badge variant={up ? "default" : "destructive"} className="gap-1">
        {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {Math.abs(pct).toFixed(2)}%
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Live Rate Board</h1>
        <p className="text-muted-foreground">Daily gold &amp; silver rates per gram</p>
      </div>

      {/* Today's rates */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Gold 24K", key: "gold24k" as const, accent: "text-primary" },
          { label: "Gold 22K", key: "gold22k" as const, accent: "text-primary" },
          { label: "Gold 18K", key: "gold18k" as const, accent: "text-primary" },
          { label: "Silver 999", key: "silver" as const, accent: "text-foreground" },
        ].map((c) => (
          <Card key={c.key}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <IndianRupee className={`h-5 w-5 ${c.accent}`} />
                <span className={`text-2xl font-bold ${c.accent}`}>
                  {latest ? Number(latest[c.key] || 0).toLocaleString("en-IN") : "—"}
                </span>
              </div>
              <div className="mt-2"><TrendBadge pct={trend(c.key)} /></div>
              <p className="text-xs text-muted-foreground mt-1">per gram</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entry form */}
      <Card>
        <CardHeader><CardTitle>Update Today's Rates</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-6">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <Label>Gold 24K</Label>
              <Input type="number" placeholder="₹/gm" value={form.gold24k} onChange={(e) => setForm({ ...form, gold24k: e.target.value })} />
            </div>
            <div>
              <Label>Gold 22K</Label>
              <Input type="number" placeholder="₹/gm" value={form.gold22k} onChange={(e) => setForm({ ...form, gold22k: e.target.value })} />
            </div>
            <div>
              <Label>Gold 18K</Label>
              <Input type="number" placeholder="₹/gm" value={form.gold18k} onChange={(e) => setForm({ ...form, gold18k: e.target.value })} />
            </div>
            <div>
              <Label>Silver 999</Label>
              <Input type="number" placeholder="₹/gm" value={form.silver} onChange={(e) => setForm({ ...form, silver: e.target.value })} />
            </div>
            <div className="flex items-end">
              <Button onClick={saveRate} className="w-full">Save Rates</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader><CardTitle>30-Day Rate Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="22K Gold" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="24K Gold" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="Silver" stroke="#94a3b8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Rate History</CardTitle></CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">No rates yet. Add today's rates above.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Gold 24K</TableHead>
                  <TableHead className="text-right">Gold 22K</TableHead>
                  <TableHead className="text-right">Gold 18K</TableHead>
                  <TableHead className="text-right">Silver 999</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                    <TableCell className="text-right">{e.gold24k ? inr(e.gold24k) : "—"}</TableCell>
                    <TableCell className="text-right font-medium">{e.gold22k ? inr(e.gold22k) : "—"}</TableCell>
                    <TableCell className="text-right">{e.gold18k ? inr(e.gold18k) : "—"}</TableCell>
                    <TableCell className="text-right">{e.silver ? inr(e.silver) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteEntry(e.id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
