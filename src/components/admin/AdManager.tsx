import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Eye, EyeOff, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_text: string | null;
  position: string;
  is_active: boolean;
  display_order: number;
  bg_color: string | null;
}

const BG_OPTIONS = [
  { label: "Primary → Accent", value: "from-primary to-accent" },
  { label: "Accent → Primary", value: "from-accent to-primary" },
  { label: "Blue → Purple", value: "from-blue-500 to-purple-600" },
  { label: "Orange → Red", value: "from-orange-500 to-red-500" },
  { label: "Green → Teal", value: "from-green-500 to-teal-600" },
  { label: "Pink → Rose", value: "from-pink-500 to-rose-500" },
];

const defaultForm = {
  title: "",
  description: "",
  image_url: "",
  link_url: "/",
  link_text: "Shop Now",
  position: "homepage",
  is_active: true,
  display_order: 0,
  bg_color: "from-primary to-accent",
};

export function AdManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setAds(data as Ad[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = {
      title: form.title,
      description: form.description || null,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      link_text: form.link_text || "Shop Now",
      position: form.position,
      is_active: form.is_active,
      display_order: Number(form.display_order),
      bg_color: form.bg_color,
    };

    if (editingId) {
      const { error } = await supabase.from("ads").update(payload).eq("id", editingId);
      if (error) { toast.error("Failed to update ad"); return; }
      toast.success("Ad updated!");
    } else {
      const { error } = await supabase.from("ads").insert(payload);
      if (error) { toast.error("Failed to create ad"); return; }
      toast.success("Ad created!");
    }

    setForm(defaultForm);
    setShowForm(false);
    setEditingId(null);
    fetchAds();
  };

  const handleEdit = (ad: Ad) => {
    setForm({
      title: ad.title,
      description: ad.description || "",
      image_url: ad.image_url || "",
      link_url: ad.link_url || "/",
      link_text: ad.link_text || "Shop Now",
      position: ad.position,
      is_active: ad.is_active,
      display_order: ad.display_order,
      bg_color: ad.bg_color || "from-primary to-accent",
    });
    setEditingId(ad.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (error) { toast.error("Failed to delete ad"); return; }
    toast.success("Ad deleted");
    fetchAds();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("ads").update({ is_active: !current }).eq("id", id);
    fetchAds();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-bold text-foreground">Ad Manager</h2>
          <span className="text-xs sm:text-sm text-muted-foreground">({ads.length} ads)</span>
        </div>
        <Button
          size="sm"
          onClick={() => { setForm(defaultForm); setEditingId(null); setShowForm(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          New Ad
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="border border-border rounded-xl p-4 sm:p-6 bg-card space-y-4">
          <h3 className="font-semibold text-foreground">{editingId ? "Edit Ad" : "Create New Ad"}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. 🔥 Mega Sale! Up to 50% Off"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Short promotional text..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Link URL</Label>
              <Input
                placeholder="/products or https://..."
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Button Text</Label>
              <Input
                placeholder="Shop Now"
                value={form.link_text}
                onChange={(e) => setForm({ ...form, link_text: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image URL (optional)</Label>
              <Input
                placeholder="https://... (logo/thumbnail)"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Position</Label>
              <Select value={form.position} onValueChange={(v) => setForm({ ...form, position: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage">Homepage (above products)</SelectItem>
                  <SelectItem value="below-hero">Below Hero Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Background Color</Label>
              <Select value={form.bg_color} onValueChange={(v) => setForm({ ...form, bg_color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BG_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Display Order</Label>
              <Input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active (visible to users)</Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              {editingId ? "Update Ad" : "Create Ad"}
            </Button>
          </div>
        </div>
      )}

      {/* Ads list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading ads...</p>
      ) : ads.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border border-dashed border-border rounded-xl">
          <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No ads yet. Create your first ad!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className="flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className={`shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br ${ad.bg_color || "from-primary to-accent"} flex items-center justify-center`}>
                <Megaphone className="h-5 w-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm truncate">{ad.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ad.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                    {ad.is_active ? "Active" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{ad.description}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Position: <span className="font-medium">{ad.position}</span> · Order: {ad.display_order}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => toggleActive(ad.id, ad.is_active)}
                  title={ad.is_active ? "Hide" : "Show"}
                >
                  {ad.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(ad)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(ad.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
