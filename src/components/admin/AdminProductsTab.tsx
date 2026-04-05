import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";

interface DBProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  original_price: number | null;
  description: string | null;
  image: string | null;
  category: string;
  in_stock: boolean | null;
  rating: number | null;
  reviews: number | null;
  seller_id: string | null;
  created_at: string;
}

const CATEGORIES = [
  "Electronics", "Fashion", "Home", "Food", "Sports",
  "Gadgets", "Clothes", "Kitchen & Home", "Kids", "Men", "Women",
];

const emptyProduct = {
  name: "", brand: "", price: 0, original_price: null as number | null,
  description: "", image: "", category: "Electronics", in_stock: true,
};

export function AdminProductsTab() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DBProduct | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Error loading products", description: error.message });
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setDialogOpen(true);
  };

  const openEdit = (p: DBProduct) => {
    setEditing(p);
    setForm({
      name: p.name, brand: p.brand, price: p.price,
      original_price: p.original_price, description: p.description || "",
      image: p.image || "", category: p.category, in_stock: p.in_stock ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim() || form.price <= 0) {
      toast({ variant: "destructive", title: "Validation error", description: "Name, brand, and price are required." });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      price: form.price,
      original_price: form.original_price || null,
      description: form.description.trim() || null,
      image: form.image.trim() || null,
      category: form.category,
      in_stock: form.in_stock,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) {
        toast({ variant: "destructive", title: "Update failed", description: error.message });
      } else {
        toast({ title: "Product updated successfully" });
        setDialogOpen(false);
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        toast({ variant: "destructive", title: "Create failed", description: error.message });
      } else {
        toast({ title: "Product created successfully" });
        setDialogOpen(false);
        fetchProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Delete failed", description: error.message });
    } else {
      toast({ title: "Product deleted" });
      setDeleteId(null);
      fetchProducts();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Product Management
            <Badge variant="secondary" className="ml-2">{products.length}</Badge>
          </CardTitle>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
                      <TableCell>
                        Rs. {p.price.toLocaleString()}
                        {p.original_price && (
                          <span className="text-xs text-muted-foreground line-through ml-1">
                            Rs. {p.original_price.toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.in_stock ? "default" : "destructive"}>
                          {p.in_stock ? "In Stock" : "Out of Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {deleteId === p.id ? (
                            <div className="flex gap-1">
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)}>
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(p.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {products.length} products
        </p>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Product" : "Add New Product"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Brand *</Label>
                  <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Price *</Label>
                  <Input type="number" min={0} step={0.01} value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Original Price</Label>
                  <Input type="number" min={0} step={0.01} value={form.original_price ?? ""}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value ? parseFloat(e.target.value) : null })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..." />
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
                <Label>In Stock</Label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
