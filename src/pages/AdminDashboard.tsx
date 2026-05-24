import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useAuth } from "../hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import {
  Activity,
  Package,
  Users,
  Settings,
  TrendingUp,
  AlertCircle,
  Search,
  CreditCard,
} from "lucide-react";
import { Product } from "../hooks/useBakery";
import { LoadingScreen } from "../components/LoadingScreen";
import { ShoppingCart } from "lucide-react";
import { ChangePasswordModal } from "../components/ChangePasswordModal";
import { StaffView } from "../components/admin/StaffView";
import { CustomersView } from "../components/admin/CustomersView";
import { OrdersView } from "../components/admin/OrdersView";
import { AnalyticsView } from "../components/admin/AnalyticsView";
import { useStoreStatus } from "../hooks/useStoreStatus";
import { Store, Power, StoreIcon } from "lucide-react";

export function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { storeStatus, updateStatus, loading: storeStatusLoading } = useStoreStatus();
  const [activeTab, setActiveTab] = useState<
    | "ANALYTICS"
    | "ORDERS"
    | "INVENTORY"
    | "SUPPORT"
    | "PAYMENTS"
    | "STAFF"
    | "CUSTOMERS"
  >("ANALYTICS");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    let mounts = true;
    const fetchProducts = () => {
      fetch("/api/products")
        .then((res) => res.json())
        .then((data) => {
          if (mounts) setProducts(data.products || []);
        });
    };
    const fetchOrders = () => {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          if (mounts) {
            setOrders(data.orders || []);
            setLoading(false);
          }
        })
        .catch(() => {
          if (mounts) setLoading(false);
        });
    };
    fetchProducts();
    fetchOrders();

    const sse = new EventSource('/api/orders/stream');
    sse.onmessage = () => {
      fetchProducts();
      fetchOrders();
    };

    return () => {
      mounts = false;
      sse.close();
    };
  }, []);

  if (authLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-secondary/10 text-primary flex font-sans">
      {loading && <LoadingScreen message="Loading dashboard data..." />}
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-secondary/20 flex flex-col">
        <div className="p-6 border-b border-secondary/20 flex items-center gap-3">
          <Link
            to="/"
            className="text-primary/50 hover:text-primary transition-colors flex-shrink-0"
            title="Back to Store"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h2 className="text-xl font-serif font-bold text-primary leading-tight">
              Cake House
            </h2>
            <p className="text-xs text-primary/60 font-medium">Command Center</p>
          </div>
          <Settings
            size={18}
            className="text-primary/50 cursor-pointer hover:text-primary transition-colors flex-shrink-0"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Account Settings"
          />
        </div>
        <div className="p-4 border-b border-secondary/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-primary flex items-center gap-1.5">
              <StoreIcon size={14} />
              Store Status
            </span>
            {!storeStatusLoading && (
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${storeStatus === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {storeStatus}
              </span>
            )}
          </div>
          <p className="text-[11px] text-primary/60 mb-3 leading-tight">
            {storeStatus === 'OPEN' ? "Users can browse and place orders." : "Store is closed. Users cannot place new orders."}
          </p>
          <button
            onClick={() => updateStatus(storeStatus === 'OPEN' ? 'CLOSED' : 'OPEN')}
            disabled={storeStatusLoading}
            className={`w-full py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              storeStatus === 'OPEN' 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
          >
            <Power size={12} />
            {storeStatus === 'OPEN' ? 'Close Store' : 'Open Store'}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("ANALYTICS")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "ANALYTICS" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <Activity size={18} />
            <span className="font-medium text-sm">Analytics HUD</span>
          </button>
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "ORDERS" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <ShoppingCart size={18} />
            <span className="font-medium text-sm">Active Orders</span>
          </button>
          <button
            onClick={() => setActiveTab("INVENTORY")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "INVENTORY" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <Package size={18} />
            <span className="font-medium text-sm">Global Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab("SUPPORT")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "SUPPORT" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Support Hub</span>
          </button>
          <button
            onClick={() => setActiveTab("PAYMENTS")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "PAYMENTS" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <CreditCard size={18} />
            <span className="font-medium text-sm">Payments</span>
          </button>
          <button
            onClick={() => setActiveTab("STAFF")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "STAFF" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Employers</span>
          </button>
          <button
            onClick={() => setActiveTab("CUSTOMERS")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${activeTab === "CUSTOMERS" ? "bg-primary text-background" : "hover:bg-secondary/30 text-primary/80"}`}
          >
            <Users size={18} />
            <span className="font-medium text-sm">Customers</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#FDFDFD]">
        <header className="px-10 py-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-serif font-bold tracking-tight">
              {activeTab === "ANALYTICS" && "Performance Overview"}
              {activeTab === "ORDERS" && "Orders Fulfillment"}
              {activeTab === "INVENTORY" && "Inventory Control"}
              {activeTab === "SUPPORT" && "Customer Resolution Center"}
              {activeTab === "PAYMENTS" && "Payments History"}
              {activeTab === "STAFF" && "Staff & Employers"}
              {activeTab === "CUSTOMERS" && "Customer Directory"}
            </h1>
            <p className="text-sm text-primary/60 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-64 group h-10">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-accent transition-colors"
              />
              <input
                type="text"
                placeholder="Search Orders or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-9 pr-4 py-2 bg-white border border-secondary/20 rounded-md text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all shadow-sm"
              />
            </div>
          </div>
        </header>

        <div className="px-10 pb-12">
          {activeTab === "ANALYTICS" && (
            <AnalyticsView orders={orders} products={products} />
          )}
          {activeTab === "ORDERS" && <OrdersView />}
          {activeTab === "INVENTORY" && (
            <InventoryView products={products} setProducts={setProducts} />
          )}
          {activeTab === "SUPPORT" && <SupportView />}
          {activeTab === "PAYMENTS" && (
            <PaymentsView orders={orders} searchQuery={searchQuery} />
          )}
          {activeTab === "STAFF" && <StaffView />}
          {activeTab === "CUSTOMERS" && <CustomersView />}
        </div>

        {isSettingsModalOpen && (
          <ChangePasswordModal onClose={() => setIsSettingsModalOpen(false)} />
        )}
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// Analytics View removed - imported from external file
// ----------------------------------------------------------------------
import { AddProductModal } from "../components/AddProductModal";

// ----------------------------------------------------------------------
// Inventory View
// ----------------------------------------------------------------------
function InventoryView({
  products,
  setProducts,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const toggleCustomizable = async (id: string, current: boolean) => {
    // Optimistic UI
    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, isCustomizable: !current } : p,
      ),
    );
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCustomizable: !current }),
      });
    } catch (e) {
      console.error(e);
      // rollback could be added here
    }
  };

  const updateStock = async (id: string, stockLevel: number) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, stockLevel } : p)));
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockLevel }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
      setProducts(products.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const updatePrice = async (id: string, price: number) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, price } : p)));
    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const forceFetchProducts = () => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));
  };
  
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productsByCategory = filteredProducts.reduce(
    (acc, product) => {
      const categoryName = product.category?.name || "Offers";
      if (!acc[categoryName]) acc[categoryName] = [];
      acc[categoryName].push(product);
      return acc;
    },
    {} as Record<string, Product[]>,
  );

  const categories = Object.keys(productsByCategory).sort();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-[#FDFDFD] sticky top-0 z-10 py-2 -mt-2">
        <h3 className="font-bold text-primary text-xl">Manage Inventory</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="pl-9 pr-4 py-2 border border-secondary/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-accent w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 transition-colors text-sm font-medium shadow-sm whitespace-nowrap"
          >
            <Package size={16} />
            Add Product
          </button>
        </div>
      </div>

      {products.length === 0 && (
        <div className="bg-white rounded-xl border border-secondary/20 shadow-sm overflow-hidden p-8 text-center text-primary/50">
          No products found. Allow users to add a new product.
        </div>
      )}

      {categories.map((categoryName) => {
        const categoryProducts = productsByCategory[categoryName];
        return (
          <div
            key={categoryName}
            className="bg-white rounded-xl border border-secondary/20 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-secondary/20 flex justify-between items-center bg-secondary/5">
              <h3 className="font-bold text-primary">
                {categoryName} Inventory
              </h3>
              <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                {categoryProducts.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/40 text-sm tracking-wider uppercase text-primary/60 border-b border-secondary/20">
                    <th className="px-6 py-4 font-medium">Product Name</th>
                    <th className="px-6 py-4 font-medium">Price</th>
                    <th className="px-6 py-4 font-medium">Stock</th>
                    <th className="px-6 py-4 font-medium text-center">
                      Customizable
                    </th>
                    <th className="px-6 py-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary/10">
                  {categoryProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{product.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-primary/50 mr-1">₹</span>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) =>
                              updatePrice(
                                product.id,
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-20 bg-transparent border-b border-transparent hover:border-secondary focus:border-accent focus:outline-none transition-colors"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={product.stockLevel}
                            onChange={(e) =>
                              updateStock(
                                product.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className={`w-20 px-2 py-1 rounded text-xs font-bold ${product.stockLevel < 5 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            toggleCustomizable(
                              product.id,
                              product.isCustomizable,
                            )
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative ${product.isCustomizable ? "bg-accent" : "bg-secondary/50"}`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${product.isCustomizable ? "left-7" : "left-1"}`}
                          ></span>
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {confirmDeleteId === product.id ? (
                          <div className="flex justify-end gap-2 text-sm">
                            <button
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 font-bold hover:underline"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-primary/60 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="text-red-500 hover:text-red-700 transition-colors px-2 py-1"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={forceFetchProducts}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// Support View
// ----------------------------------------------------------------------
function SupportView() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    const fetchTickets = () => {
      fetch("/api/tickets")
        .then((res) => res.json())
        .then((data) => {
          setTickets(data.tickets || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    };
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateTicketStatus = async (id: string, status: string) => {
    setTickets(tickets.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && tickets.length === 0) {
    return <LoadingScreen message="Loading tickets..." />;
  }

  const filteredTickets = tickets
    .filter((t) => filter === "ALL" || t.status === filter)
    .sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return (
    <div className="bg-white rounded-xl border border-secondary/20 shadow-sm overflow-hidden p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-secondary/20 pb-4 gap-4">
        <h3 className="font-bold text-xl text-primary">Customer Support Hub</h3>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-sm px-3 py-1.5 border border-secondary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent bg-background"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm px-3 py-1.5 border border-secondary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent bg-background"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-20 text-primary/50">
          <AlertCircle size={48} className="mx-auto text-primary/30 mb-4" />
          <p className="text-lg font-bold mb-2">No Tickets Found</p>
          <p>No customer support queries match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="border border-secondary/30 rounded-lg p-5 hover:bg-secondary/5 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className={`px-2 py-1 text-xs font-bold rounded-full ${ticket.status === "OPEN" ? "bg-red-100 text-red-700" : ticket.status === "IN_PROGRESS" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}
                    >
                      {ticket.status}
                    </span>
                    <h4 className="font-bold text-primary">{ticket.subject}</h4>
                    {ticket.orderId && (
                      <span className="text-xs font-mono text-primary/60 bg-secondary/20 px-2 py-0.5 rounded">
                        Order #{ticket.orderId.substring(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-primary/60 mt-1">
                    {ticket.user
                      ? `User: ${ticket.user.username} (${ticket.user.phoneNumber || "No phone"})`
                      : ticket.userId
                        ? `User ID: ${ticket.userId}`
                        : `Guest: Unknown`}
                  </p>
                </div>
                <div className="text-xs text-primary/50 text-right">
                  {new Date(ticket.createdAt).toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-primary/80 bg-secondary/10 p-3 rounded-md mb-4">
                {ticket.message}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-primary/60">
                  Update Status:
                </span>
                <select
                  value={ticket.status}
                  onChange={(e) =>
                    updateTicketStatus(ticket.id, e.target.value)
                  }
                  className="text-sm border border-secondary/30 rounded-md px-2 py-1 focus:outline-none focus:border-accent bg-transparent"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Payments View
// ----------------------------------------------------------------------
function PaymentsView({
  orders,
  searchQuery,
}: {
  orders: any[];
  searchQuery?: string;
}) {
  const [sortBy, setSortBy] = useState("date-desc");

  // Only show orders that have a paymentMethod (cash or online)
  let paidOrders = orders.filter((o: any) => o.paymentMethod);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    paidOrders = paidOrders.filter(
      (o: any) =>
        o.id.toLowerCase().includes(q) ||
        (o.user?.username || "Guest").toLowerCase().includes(q) ||
        (o.transactionId || "").toLowerCase().includes(q),
    );
  }

  // Sort orders
  paidOrders.sort((a, b) => {
    if (sortBy === "date-desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === "date-asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === "amount-desc") {
      return (
        b.totalAmount - (b.discount || 0) - (a.totalAmount - (a.discount || 0))
      );
    } else if (sortBy === "amount-asc") {
      return (
        a.totalAmount - (a.discount || 0) - (b.totalAmount - (b.discount || 0))
      );
    }
    return 0;
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-secondary/20 shadow-sm">
      <div className="flex justify-between items-center border-b border-secondary/20 pb-4 mb-4">
        <h3 className="font-bold text-xl text-primary flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payments History
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-primary/60">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-secondary/10 border-none rounded-md px-3 py-2 text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (Highest)</option>
            <option value="amount-asc">Amount (Lowest)</option>
          </select>
        </div>
      </div>

      {paidOrders.length === 0 ? (
        <div className="text-center py-20 text-primary/50">
          <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard size={28} className="text-primary/40" />
          </div>
          <p className="text-lg font-bold mb-2">No Payments Received</p>
          <p className="text-sm">
            Completed orders with payments will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-primary/20 text-xs uppercase tracking-wider text-primary/60">
                <th className="py-3 px-4 font-medium">Date</th>
                <th className="py-3 px-4 font-medium">Order ID</th>
                <th className="py-3 px-4 font-medium">Customer</th>
                <th className="py-3 px-4 font-medium">Handled By</th>
                <th className="py-3 px-4 font-medium">Amount</th>
                <th className="py-3 px-4 font-medium">Method</th>
              </tr>
            </thead>
            <tbody>
              {paidOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-secondary/10 hover:bg-secondary/10 transition-colors"
                >
                  <td className="py-4 px-4 text-sm text-primary/80 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString()}{" "}
                    <span className="text-xs text-primary/50">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-mono text-primary/70">
                    {order.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="py-4 px-4 text-sm font-medium text-primary">
                    {order.user?.username || "Guest"}
                  </td>
                  <td className="py-4 px-4 text-sm text-primary/70">
                    {order.handledBy?.username || (
                      <span className="italic text-primary/40">Unassigned</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">
                    <div className="font-bold text-accent justify-start flex flex-col">
                      <span
                        className={
                          order.discount && order.discount > 0
                            ? "line-through text-primary/40 text-xs"
                            : "text-sm text-accent"
                        }
                      >
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                      {order.discount && order.discount > 0 ? (
                        <span className="text-accent font-bold">
                          ₹{(order.totalAmount - order.discount).toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm">
                    {order.paymentMethod === "CASH" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 uppercase tracking-wider">
                        Cash
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1 w-fit">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-wider w-fit">
                          Online
                        </span>
                        {order.transactionId && (
                          <span className="text-xs text-primary/60 font-mono tracking-tight bg-secondary/20 px-1.5 py-0.5 rounded">
                            ID: {order.transactionId}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
