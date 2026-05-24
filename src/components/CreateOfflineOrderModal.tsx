import React, { useState, useEffect } from "react";
import { X, Search, Plus, Minus, ShoppingCart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Product {
  id: string;
  name: string;
  price: number;
  stockLevel: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOfflineOrderModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"DELIVERED" | "PREPARING">("DELIVERED");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setCart([]);
      setStatus("DELIVERED");
      setSearchQuery("");
      setCustomerName("");
      setCustomerPhone("");
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getCartQuantity = (productId: string) => {
    return cart.find((item) => item.product.id === productId)?.quantity || 0;
  };

  const handleUpdateQuantity = (product: Product, delta: number) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id,
      );

      if (existingIndex >= 0) {
        const newQuantity = prev[existingIndex].quantity + delta;

        if (newQuantity <= 0) {
          return prev.filter((_, i) => i !== existingIndex);
        } else if (newQuantity > product.stockLevel) {
          return prev; // Cannot exceed stock
        } else {
          const newCart = [...prev];
          newCart[existingIndex] = {
            ...newCart[existingIndex],
            quantity: newQuantity,
          };
          return newCart;
        }
      } else if (delta > 0 && product.stockLevel > 0) {
        return [...prev, { product, quantity: 1 }];
      }
      return prev;
    });
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const handleSubmit = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      // Create user if not exist (offline_customer) and create order
      const addressString = `Offline / In-Store${customerName ? " - Name: " + customerName : ""}${customerPhone ? " - Ph: " + customerPhone : ""}`;
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customerPhone ? undefined : "offline_customer", // We'll let the backend resolve this using phone
          customerPhone: customerPhone
            ? customerPhone.startsWith("+")
              ? customerPhone
              : "+91" + customerPhone.replace(/\D/g, "")
            : undefined,
          customerName: customerName || undefined,
          totalAmount,
          address: addressString, // Add address for offline order
          handledById: user?.id,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Update order status if not PREPARING as createOrder sets it to PENDING by default
        if (data.order && data.order.id) {
          await fetch(`/api/orders/${data.order.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: status,
              paymentMethod: "CASH",
            }),
          });
        }

        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create order due to unknown error");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-primary/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl border border-secondary/20 flex flex-col md:flex-row h-[80vh] overflow-hidden">
        {/* Left side: Product Selection */}
        <div className="flex-1 flex flex-col border-r border-primary/10">
          <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-secondary/10">
            <h2 className="font-serif text-xl font-bold">Select Products</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary/20 rounded-full transition-colors md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 border-b border-primary/10">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/40"
                size={18}
              />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/10 border border-secondary/20 hover:border-primary/30 rounded-md focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center p-8 text-primary/50">
                No products found.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-secondary/20 rounded-lg bg-background hover:border-accent/30 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-sm">{product.name}</h4>
                    <p className="text-xs text-primary/60">
                      ₹{product.price.toFixed(2)} • Stock: {product.stockLevel}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateQuantity(product, -1)}
                      disabled={getCartQuantity(product.id) === 0}
                      className="p-1.5 rounded-md bg-secondary/20 text-primary disabled:opacity-30 hover:bg-secondary/40 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">
                      {getCartQuantity(product.id)}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(product, 1)}
                      disabled={
                        getCartQuantity(product.id) >= product.stockLevel
                      }
                      className="p-1.5 rounded-md bg-accent text-white disabled:opacity-30 hover:bg-accent/90 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side: Cart & Checkout */}
        <div className="w-full md:w-80 flex flex-col bg-secondary/5">
          <div className="p-4 border-b border-primary/10 flex justify-between items-center bg-secondary/10">
            <h2 className="font-serif text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={20} /> Current Order
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary/20 rounded-full transition-colors hidden md:block"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-primary/40 p-6 text-center">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>Order is empty</p>
                <p className="text-xs mt-2">Add items from the left</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex justify-between items-center text-sm border-b border-primary/5 pb-2"
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.product.name}</span>
                    <div className="text-xs text-primary/60">
                      ₹{item.product.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div className="font-bold">
                    ₹{(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-background border-t border-primary/10 space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/5 border border-secondary/20 rounded-md text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="text"
                placeholder="Phone Number (Optional)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-secondary/5 border border-secondary/20 rounded-md text-sm focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex justify-between items-center font-bold text-lg pt-2 border-t border-primary/5">
              <span>Total:</span>
              <span className="text-accent">₹{totalAmount.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary/70 mb-1">
                Order Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setStatus("DELIVERED")}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${status === "DELIVERED" ? "bg-primary text-secondary" : "bg-secondary/20 text-primary hover:bg-secondary/40"}`}
                >
                  DELIVERED (Instant)
                </button>
                <button
                  onClick={() => setStatus("PREPARING")}
                  className={`flex-1 py-2 rounded-md text-xs font-bold transition-colors ${status === "PREPARING" ? "bg-amber-500 text-white" : "bg-secondary/20 text-primary hover:bg-secondary/40"}`}
                >
                  PREPARING (Live)
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>{" "}
                  Processing...
                </>
              ) : (
                "Create Offline Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
