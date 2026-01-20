import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  IndianRupee,
  ShoppingCart,
  Calendar,
} from "lucide-react";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  created_at: string;
  shipping_address: {
    fullName?: string;
    address?: string;
    city?: string;
    phone?: string;
    paymentMethod?: string;
  } | null;
  payment_proof_url: string | null;
  order_items: OrderItem[];
}

interface OrderAnalyticsProps {
  orders: Order[];
  onStatusFilter: (status: string | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(48, 96%, 53%)",
  processing: "hsl(217, 91%, 60%)",
  shipped: "hsl(262, 83%, 58%)",
  delivered: "hsl(142, 71%, 45%)",
  cancelled: "hsl(0, 84%, 60%)",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  processing: <Package className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <CheckCircle className="h-4 w-4" />,
  cancelled: <XCircle className="h-4 w-4" />,
};

export function OrderAnalytics({ orders, onStatusFilter }: OrderAnalyticsProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const cancelledOrders = orders.filter((o) => o.status === "cancelled").length;

    // Calculate avg order value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / (totalOrders - cancelledOrders) : 0;

    // Calculate conversion/completion rate
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Get last 7 days revenue for comparison
    const today = new Date();
    const last7Days = orders.filter(
      (o) => new Date(o.created_at) >= subDays(today, 7) && o.status !== "cancelled"
    );
    const prev7Days = orders.filter(
      (o) =>
        new Date(o.created_at) >= subDays(today, 14) &&
        new Date(o.created_at) < subDays(today, 7) &&
        o.status !== "cancelled"
    );

    const last7Revenue = last7Days.reduce((sum, o) => sum + o.total, 0);
    const prev7Revenue = prev7Days.reduce((sum, o) => sum + o.total, 0);
    const revenueGrowth = prev7Revenue > 0 ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100 : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      avgOrderValue,
      completionRate,
      last7Revenue,
      revenueGrowth,
    };
  }, [orders]);

  // Status breakdown for pie chart
  const statusData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    orders.forEach((order) => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        status,
        fill: STATUS_COLORS[status],
      }));
  }, [orders]);

  // Daily orders for last 14 days
  const dailyOrdersData = useMemo(() => {
    const days: Record<string, { date: string; orders: number; revenue: number }> = {};

    // Initialize last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "MMM dd");
      days[date] = { date, orders: 0, revenue: 0 };
    }

    orders.forEach((order) => {
      const date = format(new Date(order.created_at), "MMM dd");
      if (days[date]) {
        days[date].orders++;
        if (order.status !== "cancelled") {
          days[date].revenue += order.total;
        }
      }
    });

    return Object.values(days);
  }, [orders]);

  // Payment method breakdown
  const paymentData = useMemo(() => {
    const onlineCount = orders.filter(
      (o) => o.shipping_address?.paymentMethod === "online"
    ).length;
    const codCount = orders.filter(
      (o) => o.shipping_address?.paymentMethod !== "online"
    ).length;

    return [
      { name: "Online", value: onlineCount, fill: "hsl(var(--primary))" },
      { name: "COD", value: codCount, fill: "hsl(var(--muted-foreground))" },
    ];
  }, [orders]);

  // Top products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((order) => {
        order.order_items.forEach((item) => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
          }
          productSales[item.product_name].quantity += item.quantity;
          productSales[item.product_name].revenue += item.product_price * item.quantity;
        });
      });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const formatPrice = (price: number) => `₹${price.toFixed(0)}`;

  const chartConfig = {
    orders: {
      label: "Orders",
      color: "hsl(var(--primary))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {stats.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(stats.revenueGrowth).toFixed(1)}%
              </span>
              <span className="ml-1">vs last 7 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.pendingOrders} pending, {stats.completedOrders} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per successful order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cancelledOrders} cancelled orders
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Status</CardTitle>
            <CardDescription>Click to filter orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => onStatusFilter(data.status)}
                    className="cursor-pointer"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {statusData.map((item) => (
                <Badge
                  key={item.status}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted gap-1.5"
                  style={{ borderColor: item.fill, color: item.fill }}
                  onClick={() => onStatusFilter(item.status)}
                >
                  {STATUS_ICONS[item.status]}
                  {item.name}: {item.value}
                </Badge>
              ))}
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-muted"
                onClick={() => onStatusFilter(null)}
              >
                Show All
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Daily Orders & Revenue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Orders & Revenue (Last 14 Days)</CardTitle>
            <CardDescription>Daily order count and revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <LineChart data={dailyOrdersData}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  width={30}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  width={40}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="orders"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                />
                <Legend />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Selling Products</CardTitle>
            <CardDescription>By revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No product data available</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <BarChart data={topProducts} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.length > 15 ? `${v.slice(0, 15)}...` : v}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <CardDescription>Online vs Cash on Delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {paymentData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Order Activity</CardTitle>
          <CardDescription>Latest 10 orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.slice(0, 10).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${STATUS_COLORS[order.status]}20` }}
                  >
                    {STATUS_ICONS[order.status]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.shipping_address?.fullName || "Unknown Customer"} •{" "}
                      {format(new Date(order.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: STATUS_COLORS[order.status],
                      color: STATUS_COLORS[order.status],
                    }}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
