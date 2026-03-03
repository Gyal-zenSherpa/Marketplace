import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatNepaliPrice, formatNepaliNumber } from "@/lib/formatNepali";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";

interface CommissionTransaction {
  id: string;
  order_id: string;
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

const STATUS_BADGES: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  paid: { variant: "default", label: "Paid" },
  pending: { variant: "secondary", label: "Pending" },
  overdue: { variant: "destructive", label: "Overdue" },
  cancelled: { variant: "outline", label: "Cancelled" },
};

export function SellerCommissionView() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("commission_transactions")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) setTransactions(data);
      setLoading(false);
    };
    fetchCommissions();
  }, [user]);

  const totalCommission = transactions.filter(t => t.payment_status !== "cancelled").reduce((s, t) => s + t.commission_amount, 0);
  const totalDues = transactions.filter(t => t.payment_status === "pending" || t.payment_status === "overdue").reduce((s, t) => s + t.commission_amount, 0);
  const totalPaid = transactions.filter(t => t.payment_status === "paid").reduce((s, t) => s + t.commission_amount, 0);
  const totalEarnings = transactions.filter(t => t.payment_status !== "cancelled").reduce((s, t) => s + t.net_to_seller, 0);
  const salesCount = transactions.filter(t => t.payment_status !== "cancelled").length;
  const currentRate = salesCount >= 100 ? 7 : 10;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading commission data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Your Earnings</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold text-green-600">{formatNepaliPrice(totalEarnings)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Commission Dues</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className={`text-lg font-bold ${totalDues > 0 ? "text-orange-600" : ""}`}>{formatNepaliPrice(totalDues)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Commission Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">{currentRate}%</div>
            <p className="text-xs text-muted-foreground">{salesCount >= 100 ? "Loyalty rate" : `${100 - salesCount} sales to loyalty`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 px-3 pt-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Sales</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-lg font-bold">{formatNepaliNumber(salesCount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commission Transaction Log</CardTitle>
          <CardDescription>Immutable record of all commission calculations</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No commission transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Sale</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">You Receive</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map(tx => {
                    const badge = STATUS_BADGES[tx.payment_status] || STATUS_BADGES.pending;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(tx.created_at), "dd MMM yy")}</TableCell>
                        <TableCell className="text-sm max-w-[140px] truncate">{tx.product_name}</TableCell>
                        <TableCell className="text-right text-sm">{formatNepaliPrice(tx.sale_price)}</TableCell>
                        <TableCell className="text-right text-sm">{formatNepaliPrice(tx.tax_amount)}</TableCell>
                        <TableCell className="text-right text-sm">{tx.commission_rate}%</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatNepaliPrice(tx.commission_amount)}</TableCell>
                        <TableCell className="text-right text-sm text-green-600 font-medium">{formatNepaliPrice(tx.net_to_seller)}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{format(new Date(tx.payment_due_date), "dd MMM yy")}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                          {tx.is_dispute && <Badge variant="destructive" className="text-xs ml-1">Dispute</Badge>}
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
    </div>
  );
}
