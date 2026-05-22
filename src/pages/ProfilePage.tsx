import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../components/Header";
import { LoadingScreen } from "../components/LoadingScreen";

export function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editName = searchParams.get("edit_name");

  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (user) {
      setUsername(user.username);
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, username }),
      });

      if (res.ok) {
        const data = await res.json();
        updateUser(data.user);
        navigate("/");
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to update name",
        });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent/20">
      <Header
        categories={[]}
        cartCount={0}
        onSelectCategory={() => navigate("/")}
        onCartOpen={() => {}}
        onOrdersOpen={() => {}}
      />
      <main className="flex-grow max-w-xl mx-auto w-full px-4 py-16">
        <h1 className="text-3xl font-serif font-bold text-primary mb-8 text-center">
          Your Profile
        </h1>

        {editName === "true" && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/20 text-accent rounded-lg text-sm">
            Welcome! Please set your name before continuing.
          </div>
        )}

        <div className="bg-white p-8 rounded-xl shadow-lg border border-secondary/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Name / Username
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">
                Phone Number
              </label>
              <input
                type="text"
                disabled
                className="w-full px-4 py-2 border border-secondary/30 rounded-md bg-secondary/10 text-primary/60 cursor-not-allowed"
                value={user.phoneNumber || user.email}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-md text-sm ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || username.trim() === ""}
              className="w-full py-2 bg-primary text-background rounded-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full py-2 text-primary/60 hover:text-primary transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
