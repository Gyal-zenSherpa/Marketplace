import { useState, useEffect } from "react";
import { Code, Save, ExternalLink, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const STORAGE_KEY = "adsense_config";

interface AdSenseConfig {
  enabled: boolean;
  publisherId: string;
  headerCode: string;
  adSlots: { name: string; code: string }[];
}

const defaultConfig: AdSenseConfig = {
  enabled: false,
  publisherId: "pub-7771019528726079",
  headerCode: "",
  adSlots: [],
};

export function AdSenseManager() {
  const [config, setConfig] = useState<AdSenseConfig>(defaultConfig);
  const [newSlotName, setNewSlotName] = useState("");
  const [newSlotCode, setNewSlotCode] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    // Inject/remove AdSense script from head
    const existingScript = document.getElementById("adsense-script");
    if (config.enabled && config.publisherId) {
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "adsense-script";
        script.async = true;
        script.crossOrigin = "anonymous";
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${config.publisherId}`;
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }

    toast.success("AdSense configuration saved!");
  };

  const addSlot = () => {
    if (!newSlotName.trim() || !newSlotCode.trim()) {
      toast.error("Slot name and code are required");
      return;
    }
    setConfig((prev) => ({
      ...prev,
      adSlots: [...prev.adSlots, { name: newSlotName.trim(), code: newSlotCode.trim() }],
    }));
    setNewSlotName("");
    setNewSlotCode("");
  };

  const removeSlot = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      adSlots: prev.adSlots.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Code className="h-5 w-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-bold text-foreground">Google AdSense</h2>
      </div>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ads.txt Verification</CardTitle>
          <CardDescription>
            Your <code className="bg-muted px-1 py-0.5 rounded text-xs">ads.txt</code> file is already configured at the site root.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span>google.com, pub-7771019528726079, DIRECT, f08c47fec0942fa0</span>
          </div>
          <a
            href="/ads.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
          >
            View ads.txt <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>

      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AdSense Script</CardTitle>
          <CardDescription>
            Toggle AdSense on your site. Paste your publisher ID and optional header code from Google AdSense.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={config.enabled}
              onCheckedChange={(v) => setConfig((prev) => ({ ...prev, enabled: v }))}
            />
            <Label>Enable Google AdSense</Label>
          </div>

          <div className="space-y-1.5">
            <Label>Publisher ID</Label>
            <Input
              placeholder="pub-7771019528726079"
              value={config.publisherId}
              onChange={(e) => setConfig((prev) => ({ ...prev, publisherId: e.target.value }))}
            />
            <p className="text-[11px] text-muted-foreground">Found in your AdSense account under Account → Account Information</p>
          </div>

          <div className="space-y-1.5">
            <Label>Header Code (optional)</Label>
            <Textarea
              placeholder='Paste your AdSense &lt;script&gt; tag or meta verification code here...'
              value={config.headerCode}
              onChange={(e) => setConfig((prev) => ({ ...prev, headerCode: e.target.value }))}
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              This is typically the script tag Google gives you during AdSense setup.
            </p>
          </div>

          <Button onClick={saveConfig} className="gap-2">
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Ad Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ad Slots</CardTitle>
          <CardDescription>
            Save individual ad unit codes from your AdSense account for reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.adSlots.length > 0 && (
            <div className="space-y-3">
              {config.adSlots.map((slot, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{slot.name}</span>
                    <Button variant="ghost" size="sm" className="text-destructive h-7 text-xs" onClick={() => removeSlot(i)}>
                      Remove
                    </Button>
                  </div>
                  <pre className="bg-muted rounded p-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {slot.code}
                  </pre>
                </div>
              ))}
            </div>
          )}

          <div className="border border-dashed border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">Add New Ad Slot</p>
            <Input
              placeholder="Slot name (e.g. Sidebar Banner)"
              value={newSlotName}
              onChange={(e) => setNewSlotName(e.target.value)}
            />
            <Textarea
              placeholder="Paste your ad unit code from AdSense..."
              value={newSlotCode}
              onChange={(e) => setNewSlotCode(e.target.value)}
              rows={3}
              className="font-mono text-xs"
            />
            <Button variant="outline" size="sm" onClick={addSlot} className="gap-1.5">
              Add Slot
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
