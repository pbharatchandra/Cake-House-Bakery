import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  ShoppingBag,
} from "lucide-react";

const TIME_RANGES = {
  TODAY: "Today",
  LAST_7_DAYS: "Last 7 Days",
  LAST_30_DAYS: "Last 30 Days",
  THIS_YEAR: "This Year",
  ALL_TIME: "All Time",
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

export function AnalyticsView({
  orders,
  products,
}: {
  orders: any[];
  products: any[];
}) {
  const [timeRange, setTimeRange] =
    useState<keyof typeof TIME_RANGES>("LAST_30_DAYS");

  const {
    currentRevenue,
    prevRevenue,
    currentOrderCount,
    prevOrderCount,
    AOV,
    prevAOV,
    currentOrders,
    validOrders,
    categoryData,
    monthlyData,
    customerData,
    topCustomers,
  } = useMemo(() => {
    const valid = orders.filter((o: any) => o.status === "DELIVERED"); // Only count completed
    const getOrderFinalAmount = (o: any) => o.totalAmount - (o.discount || 0);

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    let startDate = new Date(0);
    let previousStartDate = new Date(0);
    let previousEndDate = new Date(0);

    if (timeRange === "TODAY") {
      startDate = todayStart;
      previousStartDate = new Date(startDate.getTime() - 86400000);
      previousEndDate = startDate;
    } else if (timeRange === "LAST_7_DAYS") {
      startDate = new Date(todayStart.getTime() - 6 * 86400000);
      previousStartDate = new Date(startDate.getTime() - 7 * 86400000);
      previousEndDate = startDate;
    } else if (timeRange === "LAST_30_DAYS") {
      startDate = new Date(todayStart.getTime() - 29 * 86400000);
      previousStartDate = new Date(startDate.getTime() - 30 * 86400000);
      previousEndDate = startDate;
    } else if (timeRange === "THIS_YEAR") {
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      previousEndDate = startDate;
    }

    const cur = valid.filter((o) => new Date(o.createdAt) >= startDate);
    const prev =
      timeRange === "ALL_TIME"
        ? []
        : valid.filter((o) => {
            const d = new Date(o.createdAt);
            return d >= previousStartDate && d < previousEndDate;
          });

    const cRev = cur.reduce((sum, o) => sum + getOrderFinalAmount(o), 0);
    const pRev = prev.reduce((sum, o) => sum + getOrderFinalAmount(o), 0);

    const cCount = cur.length;
    const pCount = prev.length;

    const cAOV = cCount > 0 ? cRev / cCount : 0;
    const pAOV = pCount > 0 ? pRev / pCount : 0;

    // Category Breakdown
    const catMap: Record<string, number> = {};
    cur.forEach((o) => {
      o.orderItems?.forEach((item: any) => {
        const cat = item.product?.category?.name || "Unknown";
        catMap[cat] = (catMap[cat] || 0) + item.price * item.quantity;
      });
    });
    const cData = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Monthly Sales
    const monthStats = valid.reduce(
      (acc, o) => {
        const d = new Date(o.createdAt);
        const mKey =
          d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
        if (!acc[mKey])
          acc[mKey] = {
            revenue: 0,
            orders: 0,
            label: d.toLocaleString("default", {
              month: "short",
              year: "2-digit",
            }),
          };
        acc[mKey].revenue += getOrderFinalAmount(o);
        acc[mKey].orders += 1;
        return acc;
      },
      {} as Record<string, { revenue: number; orders: number; label: string }>,
    );

    const mData = Object.keys(monthStats)
      .sort()
      .map((k) => ({
        month: monthStats[k].label,
        revenue: monthStats[k].revenue,
        orders: monthStats[k].orders,
      }));

    // Customers Data
    const userFirstOrderMap: Record<string, Date> = {};
    valid.forEach((o) => {
      if (o.user?.id) {
        const d = new Date(o.createdAt);
        if (!userFirstOrderMap[o.user.id] || d < userFirstOrderMap[o.user.id]) {
          userFirstOrderMap[o.user.id] = d;
        }
      }
    });

    let newCount = 0;
    let returningCount = 0;
    const currentUsers = new Set<string>();
    cur.forEach((o) => {
      if (o.user?.id) currentUsers.add(o.user.id);
    });

    currentUsers.forEach((uid) => {
      if (userFirstOrderMap[uid] >= startDate) newCount++;
      else returningCount++;
    });

    const custData = [
      { name: "New", value: newCount },
      { name: "Returning", value: returningCount },
    ];

    // Top Customers (in current period)
    const userSpendMap: Record<
      string,
      { name: string; spend: number; orders: number }
    > = {};
    cur.forEach((o) => {
      if (o.user?.id) {
        if (!userSpendMap[o.user.id])
          userSpendMap[o.user.id] = {
            name: o.user.username || "Unknown",
            spend: 0,
            orders: 0,
          };
        userSpendMap[o.user.id].spend += getOrderFinalAmount(o);
        userSpendMap[o.user.id].orders += 1;
      }
    });
    const tCust = Object.values(userSpendMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    return {
      currentRevenue: cRev,
      prevRevenue: pRev,
      currentOrderCount: cCount,
      prevOrderCount: pCount,
      AOV: cAOV,
      prevAOV: pAOV,
      currentOrders: cur,
      validOrders: valid,
      categoryData: cData,
      monthlyData: mData,
      customerData: custData,
      topCustomers: tCust,
    };
  }, [orders, timeRange]);

  const calcGrowth = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };

  const getGrowthDisplay = (growth: number) => {
    if (timeRange === "ALL_TIME") return null;
    const isPositive = growth >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-600" : "text-red-600";
    return (
      <div className={`flex items-center text-xs mt-2 ${color}`}>
        <Icon size={14} className="mr-1" />
        {isPositive ? "+" : ""}
        {growth.toFixed(1)}% vs Prev
      </div>
    );
  };

  const exportCSV = () => {
    const escapeCSV = (value: string | number | undefined | null) => {
      const stringValue = String(value ?? "");
      if (
        stringValue.includes(",") ||
        stringValue.includes('"') ||
        stringValue.includes("\n")
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const headers = [
      "Order ID",
      "Date",
      "Customer",
      "Amount",
      "Payment Method",
      "Status",
    ].map(escapeCSV);
    const rows = currentOrders.map((o: any) => [
      escapeCSV(o.id),
      escapeCSV(new Date(o.createdAt).toLocaleString()),
      escapeCSV(o.user?.username || "Guest"),
      escapeCSV((o.totalAmount - (o.discount || 0)).toFixed(2)),
      escapeCSV(o.paymentMethod),
      escapeCSV(o.status),
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sales_export_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-secondary/20 shadow-sm">
        <h2 className="text-lg font-serif font-bold text-primary">
          Performance Overview
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-2 text-sm font-medium text-primary hover:text-accent transition-colors"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border-gray-300 rounded-md shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm py-2 px-3 bg-secondary/5"
          >
            {Object.entries(TIME_RANGES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-primary/60 mb-2">
            Total Revenue
          </div>
          <div className="text-3xl font-bold font-serif">
            ₹{currentRevenue.toFixed(2)}
          </div>
          {getGrowthDisplay(calcGrowth(currentRevenue, prevRevenue))}
        </div>
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-primary/60 mb-2">
            Total Orders
          </div>
          <div className="text-3xl font-bold font-serif">
            {currentOrderCount}
          </div>
          {getGrowthDisplay(calcGrowth(currentOrderCount, prevOrderCount))}
        </div>
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col">
          <div className="text-sm font-medium text-primary/60 mb-2">
            Average Order Value (AOV)
          </div>
          <div className="text-3xl font-bold font-serif">₹{AOV.toFixed(2)}</div>
          {getGrowthDisplay(calcGrowth(AOV, prevAOV))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm">
          <h3 className="text-sm font-serif font-bold mb-6 text-primary">
            Monthly Sales Revenue
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `₹${v}`}
                />
                <RechartsTooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  formatter={(v) => `₹${v}`}
                />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Orders Monthly Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm">
          <h3 className="text-sm font-serif font-bold mb-6 text-primary">
            Monthly Orders Generated
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                <Bar dataKey="orders" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-serif font-bold mb-4 w-full text-primary">
            Revenue by Category
          </h3>
          {categoryData.length > 0 ? (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(v) => `₹${Number(v).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center text-sm mb-4 text-primary/50">
              No category data for this period
            </div>
          )}
        </div>

        {/* New vs Returning Customers */}
        <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-serif font-bold mb-4 w-full text-primary">
            New vs Returning Customers
          </h3>
          {customerData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={customerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#14b8a6" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 w-full flex items-center justify-center text-sm mb-4 text-primary/50">
              No customer data for this period
            </div>
          )}
        </div>
      </div>

      {/* Top Customers Leaderboard */}
      <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm">
        <h3 className="text-sm font-serif font-bold mb-4 text-primary flex items-center">
          <Users size={16} className="mr-2 opacity-70" /> Top Loyal Customers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-secondary/20 text-xs text-primary/60 uppercase">
                <th className="pb-3 font-semibold">Customer</th>
                <th className="pb-3 font-semibold text-right">Orders</th>
                <th className="pb-3 font-semibold text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody>
              {topCustomers.map((cust, i) => (
                <tr
                  key={i}
                  className="border-b border-secondary/10 last:border-0 hover:bg-secondary/5 transition-colors"
                >
                  <td className="py-3 text-sm font-medium text-primary">
                    {cust.name}
                  </td>
                  <td className="py-3 text-sm text-primary/80 text-right">
                    {cust.orders}
                  </td>
                  <td className="py-3 text-sm font-medium text-accent text-right">
                    ₹{cust.spend.toFixed(2)}
                  </td>
                </tr>
              ))}
              {topCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-8 text-center text-sm text-primary/50"
                  >
                    No customers found in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
