import React from "react";
import { TrendingUp, DollarSign, ShoppingBag, Award, Eye, UserCheck, Calendar } from "lucide-react";
import { DashboardStats } from "../types";

interface DashboardChartsProps {
  stats: DashboardStats;
}

export default function DashboardCharts({ stats }: DashboardChartsProps) {
  // Safe default initial state structures
  const totalOrdersCount = stats.totalOrdersCount || 0;
  const totalSimulatedRevenue = stats.totalSimulatedRevenue || 0;
  const popularFoodItems = stats.popularFoodItems || [];
  const userOrderActivity = stats.userOrderActivity || [];
  const categoryStats = stats.categoryStats || [];

  // Calculate highest revenue category for display highlight
  const topCategory = categoryStats.length > 0 
    ? [...categoryStats].sort((a,b) => b.value - a.value)[0]
    : { name: "N/A", value: 0 };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(val);
  };

  // Find max count to scale visual bar graphs elegantly
  const maxOrderCount = popularFoodItems.length > 0 
    ? Math.max(...popularFoodItems.map(i => i.orderCount))
    : 1;

  const maxActivityBudget = userOrderActivity.length > 0
    ? Math.max(...userOrderActivity.map(u => u.totalSpent || u.amount || 1))
    : 1;

  return (
    <div className="space-y-8">
      
      {/* 1. Header Grid Metrics (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono font-semibold text-stone-400 tracking-wider uppercase">
                Cumulative Volume
              </p>
              <h4 className="text-3xl font-bold text-stone-900 mt-2 tracking-tight">
                {totalOrdersCount}
              </h4>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                +12% vs last session
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <ShoppingBag className="w-5 h-5 text-stone-700" />
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono font-semibold text-stone-400 tracking-wider uppercase">
                Simulated Receipts
              </p>
              <h4 className="text-3xl font-bold text-stone-900 mt-2 tracking-tight">
                {formatCurrency(totalSimulatedRevenue)}
              </h4>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">
                +18.4% live variance
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <DollarSign className="w-5 h-5 text-amber-700" />
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono font-semibold text-stone-400 tracking-wider uppercase">
                Avg order Value
              </p>
              <h4 className="text-3xl font-bold text-stone-900 mt-2 tracking-tight">
                {totalOrdersCount > 0 
                  ? formatCurrency(totalSimulatedRevenue / totalOrdersCount)
                  : "$0.00"
                }
              </h4>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                Normalized basket size
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <TrendingUp className="w-5 h-5 text-stone-700" />
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-mono font-semibold text-stone-400 tracking-wider uppercase">
                Primary Category
              </p>
              <h4 className="text-2xl font-bold text-stone-900 mt-2.5 truncate tracking-tight">
                {topCategory.name}
              </h4>
              <p className="text-[11px] text-stone-500 font-medium mt-1">
                {formatCurrency(topCategory.value)} contribution
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
              <Award className="w-5 h-5 text-stone-700" />
            </div>
          </div>
        </div>

      </div>

      {/* 2. Visual Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Popular Food items & Category Share */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-stone-200/60 card-shadow space-y-6">
          <div>
            <h3 className="font-bold text-stone-900 text-sm tracking-tight">
              Popular Menu Recipes & Dishes
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              Ranked count of culinary sales across current customer baskets
            </p>
          </div>

          <div className="space-y-4">
            {popularFoodItems.length > 0 ? (
              popularFoodItems.map((item, idx) => {
                const percentage = (item.orderCount / maxOrderCount) * 100;
                return (
                  <div key={item.menuItemId || idx} className="space-y-1.5" id={`popular-${item.menuItemId}`}>
                    <div className="flex justify-between text-xs font-medium text-stone-800">
                      <span className="flex items-center">
                        <span className="w-5 h-5 bg-stone-100 text-[10px] font-mono font-bold flex items-center justify-center rounded border border-stone-200 mr-2">
                          #{idx + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-mono text-stone-500">
                        {item.orderCount} {item.orderCount === 1 ? "order" : "orders"} •{" "}
                        <span className="font-semibold text-stone-900">{formatCurrency(item.revenueGenerated)}</span>
                      </span>
                    </div>
                    
                    {/* Visual custom sleek progress bar */}
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-800 ${
                          idx === 0 ? "bg-stone-900" : idx === 1 ? "bg-stone-700" : "bg-stone-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-stone-400 font-mono">
                No purchases or order history generated yet.
              </div>
            )}
          </div>

          {/* Category Contributions */}
          <div className="pt-4 border-t border-stone-100">
            <h4 className="text-xs font-mono font-semibold text-stone-400 tracking-wider uppercase mb-3">
              Cuisine Category Yield
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {categoryStats.map((cat, idx) => (
                <div key={idx} className="bg-stone-50 border border-stone-200/50 p-2.5 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-stone-400 uppercase tracking-tight">{cat.name}</div>
                  <div className="text-xs font-bold text-stone-900 mt-1 font-mono">{formatCurrency(cat.value)}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Active User Order Activity Log */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-stone-200/60 card-shadow flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-stone-900 text-sm tracking-tight">
                User Ordering Vitality & Velocity
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Active users making transactions or tracking status logs
              </p>
            </div>

            <div className="divide-y divide-stone-100 max-h-[340px] overflow-y-auto pr-1">
              {userOrderActivity.length > 0 ? (
                userOrderActivity.map((act, index) => {
                  const targetValue = act.totalSpent !== undefined ? act.totalSpent : act.amount || 0;
                  const label = act.userName || `Order ${act.orderId?.substring(0, 6)}`;
                  const subLabel = act.ordersCount !== undefined 
                    ? `${act.ordersCount} total orders placed`
                    : `${act.restaurantName || "Feasts Food"} • ${act.status}`;

                  return (
                    <div key={index} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-stone-600" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-stone-800">{label}</div>
                          <div className="text-[10px] text-stone-500 font-mono">{subLabel}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-900 font-mono">
                          {formatCurrency(targetValue)}
                        </span>
                        <div className="text-[9px] text-stone-400 font-mono">
                          {act.date ? new Date(act.date).toLocaleDateString(undefined, {month: "short", day: "numeric"}) : "Simulated"}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-stone-400 font-mono">
                  No active customer registration activity found.
                </div>
              )}
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/50 mt-4 flex items-center space-x-2 text-stone-500">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono uppercase tracking-wider">
              Automatic updates. Last compile: {new Date().toLocaleDateString(undefined, {dateStyle: 'medium'})}
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
