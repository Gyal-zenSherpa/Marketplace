import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatNepaliPrice, formatNepaliNumber } from "@/lib/formatNepali";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Search, DollarSign, AlertTriangle, CheckCircle, Clock, Eye } from "lucide-react";

interface CommissionTransaction {
  id: string;
  order_id: string;
  seller_id: string;
  product_name: string;
  sale_price: number;
  tax_amount: number;
  post_tax_amount: number;
  commission_rate: number;
  commission_amount: number;
  net_to_seller: number;
  payment_status: string;
  payment_due_date: string;
  paid_at: string | null;
  is_dispute: boolean;
  is_refund: boolean;
  notes: string | null;
  created_at: string;
}

interface SellerSummary {
  seller_id: string;
  seller_name: string | null;
  total_sales_count: number;
  current_rate: number;
  total_commission_generated: number;
  commission_paid: number;
  commission_dues: number;
  next_due_date: string | null;
  overall_status: string;
}

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  paid: { variant: "default", label: "Paid" },
  pending: { variant: "secondary", label: "Pending" },
  overdue: { variant: "destructive", label: "Overdue" },
  cancelled: { variant: "outline", label: "Cancelled" },
};

export function CommissionManager() {
  const [sellers, setSellers] = useState<SellerSummary[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [sellerTransactions, setSellerTransactions] = useState<CommissionTransaction[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "", reference: "", notes: "" });
  const [paymentSellerId, setPaymentSellerId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all commission transactions
      const { data: txns, error: txnError } = await supabase
        .from("commission_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (txnError) throw txnError;
      setTransactions(txns || []);

      // Fetch profiles for seller names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name");

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Build seller summaries from transactions
      const sellerMap = new Map<string, SellerSummary>();
      
      for (const tx of (txns || [])) {
        if (!sellerMap.has(tx.seller_id)) {
          sellerMap.set(tx.seller_id, {
            seller_id: tx.seller_id,
            seller_name: profileMap.get(tx.seller_id) || "Unknown Seller",
            total_sales_count: 0,
            current_rate: tx.commission_rate,
            total_commission_generated: 0,
            commission_paid: 0,
            commission_dues: 0,
            next_due_date: null,
            overall_status: "paid",
          });
        }
        const summary = sellerMap.get(tx.seller_id)!;
        if (tx.payment_status !== "cancelled") {
          summary.total_sales_count++;
          summary.total_commission_generated += tx.commission_amount;
        }
        if (tx.payment_status === "paid") {
          summary.commission_paid += tx.commission_amount;
        }
        if (tx.payment_status === "pending" || tx.payment_status === "overdue") {
          summary.commission_dues += tx.commission_amount;
          if (!summary.next_due_date || tx.payment_due_date < summary.next_due_date) {
            summary.next_due_date = tx.payment_due_date;
          }
        }
        if (tx.payment_status === "overdue") summary.overall_status = "overdue";
        else if (tx.payment_status === "pending" && summary.overall_status !== "overdue") summary.overall_status = "pending";
      }

      // Determine current rate based on sales count
      for (const [, summary] of sellerMap) {
        summary.current_rate = summary.total_sales_count >= 100 ? 7 : 10;
      }

      setSellers(Array.from(sellerMap.values()));
    } catch (err) {
      console.error("Error fetching commission data:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load commission data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Mark overdue transactions
  useEffect(() => {
    const markOverdue = async () => {
      const now = new Date().toISOString();
      const pendingOverdue = transactions.filter(
        t => t.payment_status === "pending" && t.payment_due_date < now
      );
      if (pendingOverdue.length === 0) return;

      for (const tx of pendingOverdue) {
        await supabase
          .from("commission_transactions")
          .update({ payment_status: "overdue" })
          .eq("id", tx.id);
      }
      if (pendingOverdue.length > 0) fetchData();
    };
    markOverdue();
  }, [transactions.length]);

  const viewSellerDetails = (sellerId: string) => {
    setSelectedSeller(sellerId);
    setSellerTransactions(transactions.filter(t => t.seller_id === sellerId));
    setDetailOpen(true);
  };

  const openPaymentDialog = (sellerId: string) => {
    setPaymentSellerId(sellerId);
    const seller = sellers.find(s => s.seller_id === sellerId);
    setPaymentForm({
      amount: seller?.commission_dues.toFixed(2) || "",
      method: "",
      reference: "",
      notes: "",
    });
    setPaymentDialogOpen(true);
  };

  const recordPayment = async () => {
    if (!paymentSellerId || !paymentForm.amount) return;

    try {
      const amount = parseFloat(paymentForm.amount);
      
      // Record the payment
      await supabase.from("commission_payments").insert({
        seller_id: paymentSellerId,
        amount,
        payment_method: paymentForm.method || null,
        reference_number: paymentForm.reference || null,
        notes: paymentForm.notes || null,
        recorded_by: (await supabase.auth.getUser()).data.user?.id,
      });

      // Mark pending/overdue transactions as paid (up to the amount)
      const sellerTxns = transactions
        .filter(t => t.seller_id === paymentSellerId && (t.payment_status === "pending" || t.payment_status === "overdue"))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));

      let remaining = amount;
      for (const tx of sellerTxns) {
        if (remaining <= 0) break;
        if (tx.commission_amount <= remaining) {
          await supabase
            .from("commission_transactions")
            .update({ payment_status: "paid", paid_at: new Date().toISOString() })
            .eq("id", tx.id);
          remaining -= tx.commission_amount;
        }
      }

      // Notify seller
      await supabase.from("user_notifications").insert({
        user_id: paymentSellerId,
        title: "Commission Payment Recorded 💰",
        message: `A commission payment of ${formatNepaliPrice(amount)} has been recorded. Thank you!`,
        type: "commission",
        link: "/seller-dashboard",
      });

      toast({ title: "Payment recorded", description: `${formatNepaliPrice(amount)} recorded for seller.` });
      setPaymentDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error recording payment:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to record payment." });
    }
  };

  const markDispute = async (txId: string) => {
    try {
      // Get the dispute rate from config
      const { data: config } = await supabase
        .from("commission_config")
        .select("value")
        .eq("key", "dispute_rate")
        .single();

      const disputeRate = parseFloat(config?.value || "2");

      // Get the transaction
      const tx = transactions.find(t => t.id === txId);
      if (!tx) return;

      const newCommission = tx.post_tax_amount * (disputeRate / 100);
      const newNet = tx.post_tax_amount - newCommission;

      await supabase
        .from("commission_transactions")
        .update({
          is_dispute: true,
          commission_rate: disputeRate,
          commission_amount: newCommission,
          net_to_seller: newNet,
          notes: `Dispute/Refund applied. Rate changed to ${disputeRate}%.`,
        })
        .eq("id", txId);

      toast({ title: "Dispute flagged", description: `Commission recalculated at ${disputeRate}%.` });
      fetchData();
    } catch (err) {
      console.error("Error marking dispute:", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to flag dispute." });
    }
  };

  const filteredSellers = sellers.filter(s => {
    const q = search.toLowerCase();
    return s.seller_name?.toLowerCase().includes(q) || s.seller_id.toLowerCase().includes(q);
  });

  const totalCommission = sellers.reduce((sum, s) => sum + s.total_commission_generated, 0);
  const totalDues = sellers.reduce((sum, s) => sum + s.commission_dues, 0);
  const totalPaid = sellers.reduce((sum, s) => sum + s.commission_paid, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNepaliPrice(totalCommission)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Commission Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatNepaliPrice(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Dues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatNepaliPrice(totalDues)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Commission Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Verified Sellers – Commission</CardTitle>
              <CardDescription>Per-seller commission summary & transaction logs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sellers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-48"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSellers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No commission records yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Seller</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total Commission</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Dues</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Payment Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSellers.map(seller => {
                    const badge = STATUS_BADGES[seller.overall_status] || STATUS_BADGES.pending;
                    const paidPercent = seller.total_commission_generated > 0
                      ? Math.round((seller.commission_paid / seller.total_commission_generated) * 100)
                      : 0;
                    const isFullyPaid = seller.commission_dues <= 0 && seller.total_commission_generated > 0;
                    return (
                      <TableRow key={seller.seller_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{seller.seller_name}</p>
                            <p className="text-xs text-muted-foreground">{seller.seller_id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatNepaliNumber(seller.total_sales_count)}</TableCell>
                        <TableCell className="text-right">{seller.current_rate}%</TableCell>
                        <TableCell className="text-right">{formatNepaliPrice(seller.total_commission_generated)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatNepaliPrice(seller.commission_paid)}</TableCell>
                        <TableCell className={`text-right font-semibold ${seller.overall_status === "overdue" ? "text-destructive" : ""}`}>
                          {formatNepaliPrice(seller.commission_dues)}
                        </TableCell>
                        <TableCell>
                          {seller.next_due_date
                            ? format(new Date(seller.next_due_date), "dd MMM yyyy")
                            : "–"}
                        </TableCell>
                        <TableCell>
                          <div className="w-24 space-y-1">
                            <Progress value={paidPercent} className={`h-2 ${isFullyPaid ? "[&>div]:bg-green-500" : seller.overall_status === "overdue" ? "[&>div]:bg-destructive" : "[&>div]:bg-orange-500"}`} />
                            <p className="text-[10px] text-muted-foreground text-center">
                              {isFullyPaid ? "✅ Paid in Full" : `${paidPercent}% paid`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isFullyPaid ? (
                            <Badge variant="default" className="bg-green-600 text-white text-xs">Cleared</Badge>
                          ) : (
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => viewSellerDetails(seller.seller_id)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            {seller.commission_dues > 0 && (
                              <Button size="sm" variant="default" onClick={() => openPaymentDialog(seller.seller_id)}>
                                Record Payment
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seller Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Breakdown</DialogTitle>
            <DialogDescription>
              {sellers.find(s => s.seller_id === selectedSeller)?.seller_name} – All commission transactions
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Post-Tax</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Net to Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellerTransactions.map(tx => {
                  const badge = STATUS_BADGES[tx.payment_status] || STATUS_BADGES.pending;
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs">{format(new Date(tx.created_at), "dd MMM yy")}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{tx.product_name}</TableCell>
                      <TableCell className="text-right text-sm">{formatNepaliPrice(tx.sale_price)}</TableCell>
                      <TableCell className="text-right text-sm">{formatNepaliPrice(tx.tax_amount)}</TableCell>
                      <TableCell className="text-right text-sm">{formatNepaliPrice(tx.post_tax_amount)}</TableCell>
                      <TableCell className="text-right text-sm">{tx.commission_rate}%</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatNepaliPrice(tx.commission_amount)}</TableCell>
                      <TableCell className="text-right text-sm">{formatNepaliPrice(tx.net_to_seller)}</TableCell>
                      <TableCell><Badge variant={badge.variant} className="text-xs">{badge.label}</Badge></TableCell>
                      <TableCell>
                        {tx.is_dispute && <Badge variant="destructive" className="text-xs mr-1">Dispute</Badge>}
                        {tx.is_refund && <Badge variant="outline" className="text-xs">Refund</Badge>}
                      </TableCell>
                      <TableCell>
                        {!tx.is_dispute && tx.payment_status !== "paid" && tx.payment_status !== "cancelled" && (
                          <Button size="sm" variant="outline" onClick={() => markDispute(tx.id)} className="text-xs">
                            Flag Dispute
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Commission Payment</DialogTitle>
            <DialogDescription>
              Record a payment received from {sellers.find(s => s.seller_id === paymentSellerId)?.seller_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (Rs)</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={v => setPaymentForm(p => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="esewa">eSewa</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={paymentForm.reference}
                onChange={e => setPaymentForm(p => ({ ...p, reference: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={e => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={recordPayment} disabled={!paymentForm.amount}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
