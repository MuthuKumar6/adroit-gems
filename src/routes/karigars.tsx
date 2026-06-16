import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { localDb, newId, inr } from "@/lib/localDb";
import { Plus, ArrowUpCircle, ArrowDownCircle, Trash2, User } from "lucide-react";

export const Route = createFileRoute("/karigars")({
  component: () => (
    <AppLayout>
      <KarigarsPage />
    </AppLayout>
  ),
});

type Karigar = {
  id: string;
  name: string;
  phone: string;
  speciality: string; // chain, ring, bangle, etc.
  address: string;
  createdAt: string;
};

type IssueReceive = {
  id: string;
  karigarId: string;
  type: "issue" | "receive";
  date: string;
  metal: "gold" | "silver";
  purity: string; // 22K, 916, 999
  itemName: string;
  grossWeight: number;
  netWeight: number;
  wastagePercent: number;
  makingCharges: number;
  notes: string;
  createdAt: string;
};

const K_KEY = "karigars";
const T_KEY = "karigar_txns";

function KarigarsPage() {
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [txns, setTxns] = useState<IssueReceive[]>([]);
  const [karigarDlg, setKarigarDlg] = useState(false);
  const [txnDlg, setTxnDlg] = useState<null | "issue" | "receive">(null);
  const [selectedKarigar, setSelectedKarigar] = useState<string>("all");

  const [kForm, setKForm] = useState({ name: "", phone: "", speciality: "", address: "" });
  const [tForm, setTForm] = useState({
    karigarId: "",
    date: new Date().toISOString().slice(0, 10),
    metal: "gold" as "gold" | "silver",
    purity: "22K",
    itemName: "",
    grossWeight: "",
    netWeight: "",
    wastagePercent: "",
    makingCharges: "",
    notes: "",
  });

  useEffect(() => {
    setKarigars(localDb.read<Karigar[]>(K_KEY, []));
    setTxns(localDb.read<IssueReceive[]>(T_KEY, []));
  }, []);

  const addKarigar = () => {
    if (!kForm.name.trim()) return alert("Name required");
    const k: Karigar = { id: newId(), ...kForm, createdAt: new Date().toISOString() };
    const next = [k, ...karigars];
    localDb.write(K_KEY, next);
    setKarigars(next);
    setKForm({ name: "", phone: "", speciality: "", address: "" });
    setKarigarDlg(false);
  };

  const deleteKarigar = (id: string) => {
    if (!confirm("Delete karigar and all their transactions?")) return;
    const nextK = localDb.remove<Karigar>(K_KEY, id) as Karigar[];
    const nextT = txns.filter((t) => t.karigarId !== id);
    localDb.write(K_KEY, nextK);
    localDb.write(T_KEY, nextT);
    setKarigars(nextK); setTxns(nextT);
  };

  const openTxn = (type: "issue" | "receive") => {
    setTForm({ ...tForm, karigarId: selectedKarigar !== "all" ? selectedKarigar : (karigars[0]?.id || "") });
    setTxnDlg(type);
  };

  const saveTxn = () => {
    if (!tForm.karigarId) return alert("Select karigar");
    if (!tForm.itemName.trim()) return alert("Item name required");
    if (!tForm.grossWeight) return alert("Gross weight required");
    const t: IssueReceive = {
      id: newId(),
      karigarId: tForm.karigarId,
      type: txnDlg!,
      date: tForm.date,
      metal: tForm.metal,
      purity: tForm.purity,
      itemName: tForm.itemName,
      grossWeight: Number(tForm.grossWeight) || 0,
      netWeight: Number(tForm.netWeight) || Number(tForm.grossWeight) || 0,
      wastagePercent: Number(tForm.wastagePercent) || 0,
      makingCharges: Number(tForm.makingCharges) || 0,
      notes: tForm.notes,
      createdAt: new Date().toISOString(),
    };
    const next = [t, ...txns];
    localDb.write(T_KEY, next);
    setTxns(next);
    setTxnDlg(null);
    setTForm({ ...tForm, itemName: "", grossWeight: "", netWeight: "", wastagePercent: "", makingCharges: "", notes: "" });
  };

  const deleteTxn = (id: string) => {
    const next = localDb.remove<IssueReceive>(T_KEY, id) as IssueReceive[];
    setTxns(next);
  };

  // Balances per karigar
  const balances = useMemo(() => {
    const map = new Map<string, { issued: number; received: number; pendingMC: number }>();
    karigars.forEach((k) => map.set(k.id, { issued: 0, received: 0, pendingMC: 0 }));
    txns.forEach((t) => {
      const b = map.get(t.karigarId) || { issued: 0, received: 0, pendingMC: 0 };
      if (t.type === "issue") b.issued += t.netWeight;
      else {
        b.received += t.netWeight;
        b.pendingMC += t.makingCharges;
      }
      map.set(t.karigarId, b);
    });
    return map;
  }, [karigars, txns]);

  const filteredTxns = selectedKarigar === "all"
    ? txns
    : txns.filter((t) => t.karigarId === selectedKarigar);

  const kName = (id: string) => karigars.find((k) => k.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Karigars (Artisans)</h1>
          <p className="text-muted-foreground">Track raw gold issued, finished ornaments received &amp; pending making charges</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setKarigarDlg(true)}><Plus className="h-4 w-4 mr-1" /> Add Karigar</Button>
          <Button variant="outline" onClick={() => openTxn("issue")} disabled={!karigars.length}>
            <ArrowUpCircle className="h-4 w-4 mr-1" /> Issue Metal
          </Button>
          <Button variant="outline" onClick={() => openTxn("receive")} disabled={!karigars.length}>
            <ArrowDownCircle className="h-4 w-4 mr-1" /> Receive Ornament
          </Button>
        </div>
      </div>

      <Tabs defaultValue="karigars">
        <TabsList>
          <TabsTrigger value="karigars">Karigars</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="karigars" className="space-y-4">
          {karigars.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              No karigars yet. Click "Add Karigar" to get started.
            </CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {karigars.map((k) => {
                const b = balances.get(k.id)!;
                const pending = b.issued - b.received;
                return (
                  <Card key={k.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{k.name}</h3>
                          <p className="text-xs text-muted-foreground">{k.speciality || "—"}</p>
                          <p className="text-xs text-muted-foreground">{k.phone || "No phone"}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteKarigar(k.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Issued</p>
                          <p className="text-sm font-bold">{b.issued.toFixed(2)}g</p>
                        </div>
                        <div className="rounded bg-muted p-2">
                          <p className="text-[10px] text-muted-foreground uppercase">Received</p>
                          <p className="text-sm font-bold">{b.received.toFixed(2)}g</p>
                        </div>
                        <div className={`rounded p-2 ${pending > 0.01 ? "bg-destructive/15" : "bg-emerald-500/15"}`}>
                          <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                          <p className="text-sm font-bold">{pending.toFixed(2)}g</p>
                        </div>
                      </div>
                      {b.pendingMC > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          MC due: <span className="font-semibold text-foreground">{inr(b.pendingMC)}</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transactions</CardTitle>
              <Select value={selectedKarigar} onValueChange={setSelectedKarigar}>
                <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All karigars</SelectItem>
                  {karigars.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredTxns.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Karigar</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Metal</TableHead>
                      <TableHead className="text-right">Gross (g)</TableHead>
                      <TableHead className="text-right">Net (g)</TableHead>
                      <TableHead className="text-right">Wastage %</TableHead>
                      <TableHead className="text-right">MC</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTxns.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{new Date(t.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{kName(t.karigarId)}</TableCell>
                        <TableCell>
                          <Badge variant={t.type === "issue" ? "secondary" : "default"}>
                            {t.type === "issue" ? "Issued" : "Received"}
                          </Badge>
                        </TableCell>
                        <TableCell>{t.itemName}</TableCell>
                        <TableCell className="capitalize">{t.metal} {t.purity}</TableCell>
                        <TableCell className="text-right">{t.grossWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{t.netWeight.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{t.wastagePercent || "—"}</TableCell>
                        <TableCell className="text-right">{t.makingCharges ? inr(t.makingCharges) : "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => deleteTxn(t.id)}>Delete</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add karigar dialog */}
      <Dialog open={karigarDlg} onOpenChange={setKarigarDlg}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Karigar</DialogTitle>
            <DialogDescription>Register a new artisan / goldsmith</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={kForm.name} onChange={(e) => setKForm({ ...kForm, name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={kForm.phone} onChange={(e) => setKForm({ ...kForm, phone: e.target.value })} /></div>
            <div><Label>Speciality</Label><Input placeholder="e.g. Chains, Rings" value={kForm.speciality} onChange={(e) => setKForm({ ...kForm, speciality: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea value={kForm.address} onChange={(e) => setKForm({ ...kForm, address: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKarigarDlg(false)}>Cancel</Button>
            <Button onClick={addKarigar}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Txn dialog */}
      <Dialog open={!!txnDlg} onOpenChange={() => setTxnDlg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{txnDlg === "issue" ? "Issue Metal to Karigar" : "Receive Ornament from Karigar"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Karigar *</Label>
              <Select value={tForm.karigarId} onValueChange={(v) => setTForm({ ...tForm, karigarId: v })}>
                <SelectTrigger><SelectValue placeholder="Select karigar" /></SelectTrigger>
                <SelectContent>{karigars.map((k) => <SelectItem key={k.id} value={k.id}>{k.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Date</Label><Input type="date" value={tForm.date} onChange={(e) => setTForm({ ...tForm, date: e.target.value })} /></div>
            <div>
              <Label>Metal</Label>
              <Select value={tForm.metal} onValueChange={(v: any) => setTForm({ ...tForm, metal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Purity</Label><Input value={tForm.purity} onChange={(e) => setTForm({ ...tForm, purity: e.target.value })} /></div>
            <div><Label>Item Name *</Label><Input placeholder="e.g. Necklace, Raw bar" value={tForm.itemName} onChange={(e) => setTForm({ ...tForm, itemName: e.target.value })} /></div>
            <div><Label>Gross Weight (g) *</Label><Input type="number" step="0.001" value={tForm.grossWeight} onChange={(e) => setTForm({ ...tForm, grossWeight: e.target.value })} /></div>
            <div><Label>Net Weight (g)</Label><Input type="number" step="0.001" value={tForm.netWeight} onChange={(e) => setTForm({ ...tForm, netWeight: e.target.value })} /></div>
            {txnDlg === "receive" && (
              <>
                <div><Label>Wastage %</Label><Input type="number" step="0.01" value={tForm.wastagePercent} onChange={(e) => setTForm({ ...tForm, wastagePercent: e.target.value })} /></div>
                <div><Label>Making Charges (₹)</Label><Input type="number" value={tForm.makingCharges} onChange={(e) => setTForm({ ...tForm, makingCharges: e.target.value })} /></div>
              </>
            )}
            <div className="md:col-span-2"><Label>Notes</Label><Textarea value={tForm.notes} onChange={(e) => setTForm({ ...tForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTxnDlg(null)}>Cancel</Button>
            <Button onClick={saveTxn}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
