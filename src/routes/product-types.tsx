import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queries";
import { productStore, productTypeStore } from "@/lib/store";
import type { ProductType, Product } from "@/lib/types";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2, QrCode as QrCodeIcon, Printer } from "lucide-react";
import { useTableData } from "@/hooks/useTableData";
import { TableToolbar } from "@/components/TableToolbar";
import { TablePagination } from "@/components/TablePagination";
import type { ExportColumn } from "@/lib/exportUtils";
import { Barcode, QrCode } from "@/components/Barcode";

export const Route = createFileRoute("/product-types")({
  component: ProductTypesPage,
});

// Form state uses snake_case to mirror ProductType interface
const emptyForm = {
  product_id: '',
  name: '',
  tag_no: '',
  has_sub_name: false,
  taxable: true,
  huids: '',
  gross_weight: '',
  net_weight: '',
  stone_weight: '0',
  wastage_percentage: '',
  making_charges: '',
  making_charge_type: 'per_gram' as 'per_gram' | 'flat',
  description: '',
  quantity: '',
  in_stock: '',
};

function generateSubNames(tag_no: string, qty: number): string[] {
  if (!tag_no || qty <= 0) return [];
  return Array.from({ length: qty }, (_, i) => `${tag_no}-${String(i + 1).padStart(3, '0')}`);
}

// Recursively unwraps double/triple JSON-stringified arrays
const toArray = (val: any): string[] => {
  if (Array.isArray(val)) {
    return val.flatMap(item => toArray(item)).filter(Boolean);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed);
        return toArray(parsed);
      } catch {
        // fall through to string split
      }
    }
    return trimmed
      .replace(/^["']+|["']+$/g, '')
      .split(',')
      .map(s => s.trim().replace(/^["']+|["']+$/g, ''))
      .filter(Boolean);
  }
  return [];
};

function ProductTypesPage() {
  const qc = useQueryClient();
  const invalidatePT = () => {
    qc.invalidateQueries({ queryKey: qk.productTypes });
  };
  const [items, setItems] = useState<ProductType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tagsFor, setTagsFor] = useState<ProductType | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productTypesData, productsData] = await Promise.all([
        productTypeStore.getAll(),
        productStore.getAll()
      ]);
      setItems(productTypesData);
      setProducts(productsData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (pt: ProductType) => {
    setEditing(pt);
    setForm({
      product_id: pt.product_id,
      name: pt.name,
      tag_no: pt.tag_no || '',
      has_sub_name: Boolean(pt.has_sub_name),
      taxable: Boolean(pt.taxable),
      huids: toArray(pt.huids)
        .map(h => h.replace(/^["']+|["']+$/g, '').trim())
        .filter(Boolean)
        .join(', '),
      gross_weight: String(pt.gross_weight || ''),
      net_weight: String(pt.net_weight || ''),
      stone_weight: String(pt.stone_weight || 0),
      wastage_percentage: String(pt.wastage_percentage || ''),
      making_charges: String(pt.making_charges || ''),
      making_charge_type: pt.making_charge_type || 'per_gram',
      description: pt.description || '',
      quantity: String(pt.quantity || ''),
      in_stock: String(pt.in_stock || ''),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.product_id || !form.name.trim()) {
      alert("Base Metal and Type Name are required");
      return;
    }

    setSaving(true);
    const qty = Number(form.quantity) || 0;

    // Send camelCase to match backend req.body destructuring
    const data = {
      productId: form.product_id,
      name: form.name.trim(),
      tagNo: form.tag_no.trim().toUpperCase(),
      hasSubName: form.has_sub_name,
      taxable: form.taxable,
      subNames: form.has_sub_name ? generateSubNames(form.tag_no, qty) : [],
      huids: form.huids
        .split(',')
        .map(h => h.trim().replace(/^["']+|["']+$/g, ''))
        .filter(Boolean),
      grossWeight: Number(form.gross_weight) || 0,
      netWeight: Number(form.net_weight) || 0,
      stoneWeight: Number(form.stone_weight) || 0,
      wastagePercentage: Number(form.wastage_percentage) || 0,
      makingCharges: Number(form.making_charges) || 0,
      makingChargeType: form.making_charge_type,
      description: form.description.trim(),
      quantity: qty,
      inStock: Number(form.in_stock) || 0,
    };

    try {
      if (editing) {
        await productTypeStore.update(editing.id, data);
      } else {
        await productTypeStore.add(data);
      }
      await fetchData();
      setDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save product type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product type?")) return;
    try {
      await productTypeStore.delete(id);
      await fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed to delete product type");
    }
  };

  const exportColumns: ExportColumn<ProductType>[] = [
    { header: "Name", accessor: (pt) => pt.name },
    { header: "Tag No", accessor: (pt) => pt.tag_no || "" },
    { header: "Metal", accessor: (pt) => `${(pt as any).productName ?? ""} ${(pt as any).purity ?? ""}`.trim() },
    { header: "Taxable", accessor: (pt) => (pt.taxable ? "Yes" : "No") },
    { header: "HUIDs", accessor: (pt) => toArray(pt.huids).join(", ") },
    { header: "Gross Wt (g)", accessor: (pt) => Number(pt.gross_weight || 0) },
    { header: "Net Wt (g)", accessor: (pt) => Number(pt.net_weight || 0) },
    { header: "Wastage %", accessor: (pt) => Number(pt.wastage_percentage || 0) },
    { header: "Making", accessor: (pt) => `${pt.making_charges}/${pt.making_charge_type === "per_gram" ? "g" : "flat"}` },
    { header: "In Stock", accessor: (pt) => Number(pt.in_stock || 0) },
    { header: "Total Qty", accessor: (pt) => Number(pt.quantity || 0) },
  ];
  const table = useTableData<ProductType>(
    items,
    (pt, q) =>
      pt.name.toLowerCase().includes(q) ||
      (pt.tag_no || "").toLowerCase().includes(q) ||
      String((pt as any).productName || "").toLowerCase().includes(q) ||
      toArray(pt.huids).some((h) => h.toLowerCase().includes(q)),
    10,
  );

  return (
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl lg:text-3xl font-heading font-bold gold-text">Product Types</h1>
            <p className="text-muted-foreground text-sm mt-1">Bangles, Chains, Rings with HUID tracking</p>
          </div>
          <Button onClick={openAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" /> Add Type
          </Button>
        </div>

        <TableToolbar
          search={table.search}
          onSearchChange={table.setSearch}
          placeholder="Search by name, tag, metal, HUID..."
          exportRows={table.filtered}
          exportColumns={exportColumns}
          exportFilename="product-types"
          exportTitle="Product Types"
        />


        {/* Table */}
        <Card className="glass-card border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Tag No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Metal</TableHead>
                    <TableHead>HUIDs</TableHead>
                    <TableHead>Net Wt (g)</TableHead>
                    <TableHead>Wastage %</TableHead>
                    <TableHead>Making</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12">
                        <Loader2 className="animate-spin mx-auto h-6 w-6" />
                      </TableCell>
                    </TableRow>
                  ) : table.paged.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                        No product types found
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.paged.map((pt) => (
                      <TableRow key={pt.id}>

                        {/* Name + sub names preview */}
                        <TableCell className="font-medium">
                          {pt.name}
                          {Boolean(pt.has_sub_name) && toArray(pt.sub_names).length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {toArray(pt.sub_names).slice(0, 2).join(', ')}
                              {toArray(pt.sub_names).length > 2 && ` +${toArray(pt.sub_names).length - 2}`}
                            </p>
                          )}
                        </TableCell>

                        {/* Tag No */}
                        <TableCell>
                          <Badge variant="secondary">{pt.tag_no || '—'}</Badge>
                        </TableCell>

                        {/* Taxable */}
                        <TableCell>
                          <Badge variant={Boolean(pt.taxable) ? 'default' : 'outline'}>
                            {Boolean(pt.taxable) ? 'Taxable' : 'Non-Tax'}
                          </Badge>
                        </TableCell>

                        {/* Metal + Purity */}
                        <TableCell>
                          <Badge variant="outline">
                            {pt.productName} {pt.purity}
                          </Badge>
                        </TableCell>

                        {/* HUIDs */}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {toArray(pt.huids).slice(0, 3).map(h => (
                              <Badge key={h} variant="secondary" className="text-[10px]">{h}</Badge>
                            ))}
                            {toArray(pt.huids).length > 3 && (
                              <Badge variant="secondary" className="text-[10px]">
                                +{toArray(pt.huids).length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>{pt.net_weight}g</TableCell>
                        <TableCell>{pt.wastage_percentage}%</TableCell>
                        <TableCell>
                          ₹{pt.making_charges}/{pt.making_charge_type === 'per_gram' ? 'g' : 'flat'}
                        </TableCell>

                        {/* Stock */}
                        <TableCell>
                          <Badge variant={
                            pt.in_stock <= 0 ? 'destructive' :
                              pt.in_stock <= 3 ? 'outline' : 'default'
                          }>
                            {pt.in_stock} / {pt.quantity}
                          </Badge>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(pt)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(pt.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>

                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <TablePagination
              page={table.page}
              totalPages={table.totalPages}
              totalCount={table.totalCount}
              pageSize={table.pageSize}
              onPageChange={table.setPage}
            />
          </CardContent>
        </Card>

        {/* Add / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Product Type' : 'Add New Product Type'}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">

              {/* Base Metal */}
              <div className="grid gap-2">
                <Label>Base Metal *</Label>
                <Select
                  value={form.product_id}
                  onValueChange={v => setForm(f => ({ ...f, product_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select metal (Gold / Silver)" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.purity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Name */}
              <div className="grid gap-2">
                <Label>Type Name *</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Gold Bangles, Silver Chain"
                />
              </div>

              {/* Tag No + Tax Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Tag No. (e.g. CH, BN)</Label>
                  <Input
                    value={form.tag_no}
                    onChange={e => setForm(f => ({ ...f, tag_no: e.target.value.toUpperCase() }))}
                    placeholder="CH"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tax Status</Label>
                  <Select
                    value={form.taxable ? 'taxable' : 'non_taxable'}
                    onValueChange={v => setForm(f => ({ ...f, taxable: v === 'taxable' }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="taxable">Taxable</SelectItem>
                      <SelectItem value="non_taxable">Non-Taxable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sub Names Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Enable Sub Names</Label>
                  <p className="text-xs text-muted-foreground">Auto generate CH-001, CH-002 etc.</p>
                </div>
                <Switch
                  checked={form.has_sub_name}
                  onCheckedChange={v => setForm(f => ({ ...f, has_sub_name: v }))}
                />
              </div>

              {/* HUIDs */}
              <div className="grid gap-2">
                <Label>HUIDs (comma separated)</Label>
                <Input
                  value={form.huids}
                  onChange={e => setForm(f => ({ ...f, huids: e.target.value }))}
                  placeholder="HUID12345, HUID12346"
                />
              </div>

              {/* Weights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Gross Weight (g)</Label>
                  <Input
                    type="number"
                    value={form.gross_weight}
                    onChange={e => setForm(f => ({ ...f, gross_weight: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Net Weight (g) *</Label>
                  <Input
                    type="number"
                    value={form.net_weight}
                    onChange={e => setForm(f => ({ ...f, net_weight: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Stone Weight (g)</Label>
                  <Input
                    type="number"
                    value={form.stone_weight}
                    onChange={e => setForm(f => ({ ...f, stone_weight: e.target.value }))}
                  />
                </div>
              </div>

              {/* Making Charges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Wastage %</Label>
                  <Input
                    type="number"
                    value={form.wastage_percentage}
                    onChange={e => setForm(f => ({ ...f, wastage_percentage: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Making Charges</Label>
                  <Input
                    type="number"
                    value={form.making_charges}
                    onChange={e => setForm(f => ({ ...f, making_charges: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Charge Type</Label>
                  <Select
                    value={form.making_charge_type}
                    onValueChange={v => setForm(f => ({ ...f, making_charge_type: v as 'per_gram' | 'flat' }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_gram">Per Gram</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>In Stock</Label>
                  <Input
                    type="number"
                    value={form.in_stock}
                    onChange={e => setForm(f => ({ ...f, in_stock: e.target.value }))}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}