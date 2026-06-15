import React, { useState, useEffect } from "react";
import { 
  Search, Utensils, Star, Clock, ShoppingBag, ShieldAlert, ChevronRight, 
  Trash2, Plus, Minus, Check, ArrowRight, ArrowLeft, PlusCircle, Sparkles, Filter, PackageOpen, LayoutDashboard, UtensilsCrossed, ClipboardList, PenTool, CheckCircle2, User
} from "lucide-react";
import { User as UserType, Restaurant, MenuItem, CartItem, Order, DashboardStats } from "./types";
import Navbar from "./components/Navbar";
import DashboardCharts from "./components/DashboardCharts";

export default function App() {
  // Session / Token State
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem("feast_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("feast_token") || null;
  });

  // Master Data State
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Cart State (Persisted in LocalStorage)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("feast_cart");
    return saved ? JSON.parse(saved) : [];
  });

  // UI Flow State
  const [currentView, setCurrentView] = useState<string>(() => {
    const savedUser = localStorage.getItem("feast_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      return u.role === "admin" ? "admin" : "home";
    }
    return "home";
  });
  
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Auth Forms State
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [authError, setAuthError] = useState("");

  // Admin Operations State
  const [adminMenuRestaurantId, setAdminMenuRestaurantId] = useState("");
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemDesc, setNewItemDesc] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<MenuItem["category"]>("Veg");
  const [newItemImageUrl, setNewItemImageUrl] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Admin Sub-Tab & Restaurant CRUD state
  const [adminActiveTab, setAdminActiveTab] = useState<"analytics" | "restaurants" | "menu" | "orders">("analytics");
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("");
  const [newRestaurantRating, setNewRestaurantRating] = useState("4.5");
  const [newRestaurantDeliveryTime, setNewRestaurantDeliveryTime] = useState("20-30 min");
  const [newRestaurantImage, setNewRestaurantImage] = useState("");
  const [newRestaurantBannerImage, setNewRestaurantBannerImage] = useState("");
  const [newRestaurantFeatured, setNewRestaurantFeatured] = useState(false);

  // Prefilled address parameters for Checkout
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  // Toast Helper
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch full data on init or auth swap
  useEffect(() => {
    fetchRestaurantsAndMenu();
    if (token) {
      fetchOrders();
      if (currentUser?.role === "admin") {
        fetchDashboardStats();
      }
    }
  }, [token, currentUser]);

  // Sync cart with localStorage
  useEffect(() => {
    localStorage.setItem("feast_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchRestaurantsAndMenu = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(data);

      const itemsRes = await fetch("/api/menu");
      const itemsData = await itemsRes.json();
      setMenuItems(itemsData);

      // Prepopulate the dropdown selector for admin menu addition options
      if (data.length > 0) {
        setAdminMenuRestaurantId(data[0].id);
      }
    } catch (err) {
      console.error("Error fetching restaurant databases:", err);
      showToast("Could not contact the database. Check connection.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/orders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const fetchDashboardStats = async () => {
    if (!token || currentUser?.role !== "admin") return;
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDashboardStats(data);
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  // Handle Authentication (Login)
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError("");
    if (!formEmail || !formPassword) {
      setAuthError("Email and password fields are required.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail, password: formPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Login credentials unauthorized.");
        return;
      }

      // Save session
      localStorage.setItem("feast_token", data.token);
      localStorage.setItem("feast_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Auto prefill checkout details
      setCheckoutAddress(data.user.address);
      setCheckoutPhone(data.user.phone);

      showToast(`Welcome back, ${data.user.name}!`);
      
      // Route accordingly
      if (data.user.role === "admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("home");
      }
    } catch (err) {
      setAuthError("Server unavailable right now.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Authentication (Signup)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!formEmail || !formPassword || !formName) {
      setAuthError("Name, Email and Password are required properties.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          name: formName,
          address: formAddress,
          phone: formPhone,
          role: "customer" // Default role
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || "Unable to complete register request.");
        return;
      }

      localStorage.setItem("feast_token", data.token);
      localStorage.setItem("feast_user", JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      
      // Auto prefill checkout details
      setCheckoutAddress(data.user.address);
      setCheckoutPhone(data.user.phone);

      showToast("Account successfully registered! Enjoy FEAST.");
      setCurrentView("home");
    } catch (err) {
      setAuthError("Verification database system has generic downtime.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger quick presets in Sandbox UI for effortless reviews
  const handleQuickLogin = (role: "admin" | "customer") => {
    if (role === "admin") {
      setFormEmail("admin@feasts.com");
      setFormPassword("admin123");
    } else {
      setFormEmail("customer@feasts.com");
      setFormPassword("customer123");
    }
    setAuthMode("login");
    setAuthError("");
    // Give state a brief tick to apply, then trigger login
    setTimeout(() => {
      const emailVal = role === "admin" ? "admin@feasts.com" : "customer@feasts.com";
      const passVal = role === "admin" ? "admin123" : "customer123";
      
      setIsLoading(true);
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal, password: passVal })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem("feast_token", data.token);
          localStorage.setItem("feast_user", JSON.stringify(data.user));
          setToken(data.token);
          setCurrentUser(data.user);
          setCheckoutAddress(data.user.address);
          setCheckoutPhone(data.user.phone);
          showToast(`Sandbox Quick Login: Entered as ${data.user.name}`);
          setCurrentView(data.user.role === "admin" ? "admin" : "home");
        } else {
          setAuthError(data.error || "Login failed");
        }
      })
      .catch(() => setAuthError("Local quick authenticate failed."))
      .finally(() => setIsLoading(false));
    }, 100);
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem("feast_token");
    localStorage.removeItem("feast_user");
    localStorage.removeItem("feast_cart");
    setToken(null);
    setCurrentUser(null);
    setCart([]);
    showToast("Successfully logged out.");
    setCurrentView("home");
  };

  // Update Profile Settings in real-time
  const handleUpdateProfile = async (name: string, address: string, phone: string) => {
    if (!token) return;
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, address, phone })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("feast_user", JSON.stringify(data));
        setCurrentUser(data);
        setCheckoutAddress(data.address);
        setCheckoutPhone(data.phone);
        showToast("Profile address records saved!");
      } else {
        showToast(data.error || "Error saving profile parameters.", "error");
      }
    } catch (err) {
      showToast("Profile service connection error.", "error");
    }
  };

  // Cart operations
  const addToCart = (item: MenuItem) => {
    if (!currentUser) {
      setCurrentView("login");
      showToast("Please register or log in to customize food baskets.", "error");
      return;
    }

    // Check if cart has food items from a different restaurant - food apps generally enforce single-origin billing
    const hasDifferentOrigin = cart.some(ci => ci.restaurantId !== item.restaurantId);
    if (hasDifferentOrigin) {
      const replaceResult = window.confirm(
        "Your cart has food items from another restaurant. Replace existing cart food items to order from " + 
        (restaurants.find(r => r.id === item.restaurantId)?.name || "selected eatery") + "?"
      );
      if (!replaceResult) return;
      
      // Reset cart and insert new food item
      setCart([{
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: item.restaurantId
      }]);
      showToast(`Cleared cart and added ${item.name}!`);
      return;
    }

    setCart(prev => {
      const exist = prev.find(ci => ci.menuItemId === item.id);
      if (exist) {
        return prev.map(ci => ci.menuItemId === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci);
      }
      return [...prev, {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        restaurantId: item.restaurantId
      }];
    });
    showToast(`Added ${item.name} to checkout basket.`);
  };

  const updateCartQuantity = (menuItemId: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.menuItemId === menuItemId) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
    showToast("Discarded item from cart.");
  };

  // Checkout and place real order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast("Cannot check out an empty basket.", "error");
      return;
    }
    if (!checkoutAddress || !checkoutPhone) {
      showToast("Full delivery address and active phone are mandatory.", "error");
      return;
    }

    const firstItem = cart[0];
    try {
      setIsLoading(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          restaurantId: firstItem.restaurantId,
          items: cart.map(ci => ({ menuItemId: ci.menuItemId, quantity: ci.quantity })),
          deliveryAddress: checkoutAddress,
          phone: checkoutPhone
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Order ${data.id} successfully placed! Bon Appetit.`);
        setCart([]); // Reset basket
        fetchOrders();
        setCurrentView("tracker"); // Route to order progress page
      } else {
        showToast(data.error || "Order failed.", "error");
      }
    } catch (err) {
      showToast("Order transaction backend error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Admin menu CRUD operations
  const handleSaveRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantName || !newRestaurantCuisine) {
      showToast("Eatery Name and Cuisine are required fields.", "error");
      return;
    }

    const payload = {
      name: newRestaurantName,
      cuisine: newRestaurantCuisine,
      rating: Number(newRestaurantRating || 4.5),
      deliveryTime: newRestaurantDeliveryTime || "25-35 min",
      image: newRestaurantImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400",
      bannerImage: newRestaurantBannerImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
      featured: newRestaurantFeatured
    };

    try {
      setIsLoading(true);
      let res;
      if (editingRestaurantId) {
        res = await fetch(`/api/restaurants/${editingRestaurantId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/restaurants", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast(editingRestaurantId ? "Eatery profile updated successfully!" : "Brand new eatery launched successfully!");
        setNewRestaurantName("");
        setNewRestaurantCuisine("");
        setNewRestaurantRating("4.5");
        setNewRestaurantDeliveryTime("20-30 min");
        setNewRestaurantImage("");
        setNewRestaurantBannerImage("");
        setNewRestaurantFeatured(false);
        setEditingRestaurantId(null);
        fetchRestaurantsAndMenu(); // Refresh master list
      } else {
        showToast(data.error || "Operation failed", "error");
      }
    } catch (err) {
      showToast("Admin Restaurant transaction error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRestaurantTrigger = (rest: Restaurant) => {
    setEditingRestaurantId(rest.id);
    setNewRestaurantName(rest.name);
    setNewRestaurantCuisine(rest.cuisine);
    setNewRestaurantRating(String(rest.rating || 4.5));
    setNewRestaurantDeliveryTime(rest.deliveryTime || "25-35 min");
    setNewRestaurantImage(rest.image || "");
    setNewRestaurantBannerImage(rest.bannerImage || "");
    setNewRestaurantFeatured(rest.featured || false);

    // Smooth scroll back up to the form
    const formSection = document.getElementById("restaurant-form-section");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleDeleteRestaurant = async (id: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to decommission this eatery registry? Warning: This will purge all existing recipes mapped to this eatery!"
    );
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/restaurants/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Eatery decommissioned successfully.");
        fetchRestaurantsAndMenu();
      } else {
        showToast(data.error || "Cannot decommission eatery", "error");
      }
    } catch (err) {
      showToast("Connection to admin CRUD was interrupted.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemPrice || !adminMenuRestaurantId) {
      showToast("Fields name, price and restaurant origin are required.", "error");
      return;
    }

    const payload = {
      restaurantId: adminMenuRestaurantId,
      name: newItemName,
      price: Number(newItemPrice),
      description: newItemDesc,
      category: newItemCategory,
      imageUrl: newItemImageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400"
    };

    try {
      setIsLoading(true);
      let res;
      if (editingItemId) {
        // Update
        res = await fetch(`/api/menu/${editingItemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Create
        res = await fetch("/api/menu", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (res.ok) {
        showToast(editingItemId ? "Culinary dish updated successfully!" : "New dish menu slot completed!");
        setNewItemName("");
        setNewItemPrice("");
        setNewItemDesc("");
        setNewItemImageUrl("");
        setEditingItemId(null);
        fetchRestaurantsAndMenu(); // Refresh master list
      } else {
        showToast(data.error || "Operation failed", "error");
      }
    } catch (err) {
      showToast("Admin Menu transaction error.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItemTrigger = (item: MenuItem) => {
    setEditingItemId(item.id);
    setAdminMenuRestaurantId(item.restaurantId);
    setNewItemName(item.name);
    setNewItemPrice(item.price.toString());
    setNewItemDesc(item.description);
    setNewItemCategory(item.category);
    setNewItemImageUrl(item.imageUrl);
    
    // Smooth scroll admin back up to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently discard this recipe from the system menu?");
    if (!confirmDelete) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToast("Recipe discarded successfully.");
        fetchRestaurantsAndMenu();
      } else {
        showToast(data.error || "Cannot delete item", "error");
      }
    } catch (err) {
      showToast("Connection to admin CRUD was interrupted.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Admin status updater
  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Order status updated to "${status}"`);
        fetchOrders(); // Refresh local list
        fetchDashboardStats();
      } else {
        showToast(data.error || "Failed to update action status", "error");
      }
    } catch (err) {
      showToast("Interrupted status communications.", "error");
    }
  };

  // Helpers to resolve dictionary titles easily
  const restaurantDetailsHashMap = restaurants.reduce((map, r) => {
    map[r.id] = r;
    return map;
  }, {} as { [key: string]: Restaurant });

  // Filter menu items on customer homepage
  const getFilteredItems = () => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
      const matchesRestaurant = !selectedRestaurantId || item.restaurantId === selectedRestaurantId;
      return matchesSearch && matchesCategory && matchesRestaurant;
    });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#FAF9F6]">
      
      {/* Toast notifications */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-2xl border flex items-center space-x-2.5 max-w-sm transition-all duration-300 transform translate-y-0 ${
            toastMessage.type === "success" 
              ? "bg-stone-900 text-stone-50 border-stone-800" 
              : "bg-red-50 text-red-900 border-red-200"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${toastMessage.type === "success" ? "bg-amber-400" : "bg-red-600"}`} />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar 
        currentUser={currentUser} 
        cart={cart} 
        currentView={currentView}
        onNavigate={(v) => {
          setCurrentView(v);
          if (v === "home") {
            setSelectedRestaurantId(null);
          }
        }}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        restaurantDetails={restaurantDetailsHashMap}
      />

      {/* Main Container Stage */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* ========================================================
            VIEW: HOME / BROWSE RESTAURANTS 
            ======================================================== */}
        {currentView === "home" && (
          <div className="space-y-10">
            
            {/* Elegant Hero Welcome Intro */}
            {!selectedRestaurantId && (
              <div className="bg-stone-950 text-stone-50 rounded-2xl p-8 sm:p-12 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="max-w-2xl space-y-4 relative z-10">
                  <div className="inline-flex items-center space-x-2 py-1 px-3 bg-white/10 text-stone-300 rounded-full text-[10px] font-mono uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Fine dining dispatched instantly</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
                    Gastronomy, <br className="hidden sm:block" />
                    Delivered with absolute elegance.
                  </h1>
                  <p className="text-stone-400 text-sm max-w-lg leading-relaxed">
                    FEAST partners with the city's finest master kitchens. Browse high-quality culinary recipes, filter ingredients, and monitor your luxury dining orders in real-time.
                  </p>
                </div>

                {/* Search and global Category selectors */}
                <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/15 max-w-xl w-full flex items-center space-x-2 relative z-10 mt-6">
                  <Search className="w-4 h-4 text-stone-400 ml-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search master dishes, recipes, ingredients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-0 text-white text-xs placeholder:text-stone-400 focus:ring-0 outline-none w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="text-xs text-stone-400 hover:text-white px-2">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Restaurant Detail Hero Banner if selected */}
            {selectedRestaurantId && restaurantDetailsHashMap[selectedRestaurantId] && (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedRestaurantId(null)}
                  className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors uppercase tracking-widest"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Restaurants
                </button>
                
                {/* Visual Banner */}
                <div className="bg-stone-100 rounded-2xl overflow-hidden relative h-[250px] sm:h-[350px]">
                  <img
                    src={restaurantDetailsHashMap[selectedRestaurantId].bannerImage}
                    alt={restaurantDetailsHashMap[selectedRestaurantId].name}
                    className="w-full h-full object-cover brightness-[0.7]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <div className="flex items-center space-x-3 text-xs font-mono font-bold">
                      <span className="bg-amber-500 text-stone-950 py-0.5 px-2 rounded">
                        {restaurantDetailsHashMap[selectedRestaurantId].cuisine}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                        {restaurantDetailsHashMap[selectedRestaurantId].rating}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {restaurantDetailsHashMap[selectedRestaurantId].deliveryTime} DISPATCH
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                      {restaurantDetailsHashMap[selectedRestaurantId].name}
                    </h2>
                  </div>
                </div>
              </div>
            )}

            {/* Restaurants Carousel List - Hide when viewing specific restaurant */}
            {!selectedRestaurantId && (
              <div className="space-y-6">
                <div className="flex justify-between items-baseline">
                  <div>
                    <h2 className="font-extrabold text-stone-900 text-lg tracking-tight">Featured Partner Outlets</h2>
                    <p className="text-xs text-stone-500 mt-0.5">Vetted culinary hubs around your service block</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {restaurants.map((rest) => (
                    <div
                      key={rest.id}
                      onClick={() => {
                        setSelectedRestaurantId(rest.id);
                        setSelectedCategory("All");
                        setSearchQuery("");
                      }}
                      className="bg-white rounded-xl border border-stone-200/60 overflow-hidden cursor-pointer hover:border-stone-900 group card-shadow transition-all duration-300"
                      id={`restaurant-card-${rest.id}`}
                    >
                      <div className="relative h-44 bg-stone-100 overflow-hidden">
                        <img
                          src={rest.image}
                          alt={rest.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {rest.featured && (
                          <span className="absolute top-3 left-3 text-[9px] font-mono uppercase bg-stone-900 text-stone-50 font-bold px-2 py-0.5 rounded tracking-wider">
                            Michelin Vetted
                          </span>
                        )}
                        <span className="absolute bottom-3 right-3 text-xs font-mono font-bold bg-white/90 backdrop-blur-sm text-stone-900 px-2 py-0.5 rounded shadow">
                          {rest.deliveryTime}
                        </span>
                      </div>

                      <div className="p-4 space-y-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-stone-900 group-hover:text-stone-700 transition-colors text-sm line-clamp-1">
                            {rest.name}
                          </h3>
                          <div className="flex items-center text-xs font-mono text-amber-500 font-bold shrink-0 ml-2">
                            <Star className="w-3 h-3 fill-amber-500 mr-0.5" />
                            {rest.rating}
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 line-clamp-1 font-mono">
                          {rest.cuisine}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category selection filters & Dishes Row */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4 border-b border-stone-200/65 pb-5">
                <div>
                  <h2 className="font-extrabold text-stone-900 text-lg tracking-tight">
                    {selectedRestaurantId ? "Explore Kitchen Menu" : "Unified Recipe Dispatch Hub"}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedRestaurantId 
                      ? "Browse dishes unique to this kitchen"
                      : "Search and configure combinations from all partner hubs"
                    }
                  </p>
                </div>

                {/* Filter Categories buttons */}
                <div className="flex flex-wrap gap-2">
                  {["All", "Veg", "Non-Veg", "Fast Food", "Desserts", "Beverages"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedCategory === cat
                          ? "bg-stone-900 text-stone-50 border-stone-900 hover:bg-stone-850"
                          : "bg-white text-stone-500 border-stone-200 hover:text-stone-900 hover:border-stone-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dishes Grid */}
              {isLoading ? (
                <div className="py-20 text-center font-mono text-xs text-stone-500">
                  Compiling culinary database slots...
                </div>
              ) : getFilteredItems().length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredItems().map((item) => {
                    const restaurantOfItem = restaurantDetailsHashMap[item.restaurantId];
                    const countInCart = cart.find(ci => ci.menuItemId === item.id)?.quantity || 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-stone-200/60 overflow-hidden flex flex-col justify-between card-shadow transition-all hover:border-stone-350"
                        id={`dish-card-${item.id}`}
                      >
                        <div className="relative h-48 bg-stone-50">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-3 left-3 text-[10px] font-mono font-bold tracking-wider uppercase bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded shadow">
                            {item.category}
                          </span>
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-stone-950/65 flex items-center justify-center">
                              <span className="text-[10px] font-mono uppercase bg-stone-900 text-stone-100 font-bold px-3 py-1.5 rounded border border-stone-700 tracking-widest">
                                Sold Out
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline gap-2">
                              <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{item.name}</h3>
                              <span className="text-xs font-mono font-semibold text-stone-900 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                              {item.description || "A masterchef premium recipe curated by our artisanal chef partners using top ingredients."}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-stone-100 flex justify-between items-center bg-stone-50/50 -mx-5 -mb-5 p-4 mt-auto">
                            <span className="text-[10px] text-stone-400 font-mono">
                              By {restaurantOfItem ? restaurantOfItem.name : "Primary Kitchen"}
                            </span>

                            {item.isAvailable && (
                              <div className="flex items-center space-x-2">
                                {countInCart > 0 ? (
                                  <div className="flex items-center space-x-1 border border-stone-300 bg-white rounded-md px-1 py-0.5">
                                    <button
                                      onClick={() => updateCartQuantity(item.id, -1)}
                                      className="p-1 hover:text-stone-950 text-stone-500 rounded"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-bold font-mono px-1.5 text-stone-900">
                                      {countInCart}
                                    </span>
                                    <button
                                      onClick={() => updateCartQuantity(item.id, 1)}
                                      className="p-1 hover:text-stone-950 text-stone-500 rounded"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center space-x-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add to Cart</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-20 text-center border border-dashed border-stone-200 bg-white rounded-xl">
                  <PackageOpen className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                  <p className="text-xs font-mono text-stone-400">
                    No culinary menu items match current tags or key phrases.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================
            VIEW: CART & CHECKOUT
            ======================================================== */}
        {currentView === "cart" && (
          <div className="space-y-8">
            <button
              onClick={() => setCurrentView("home")}
              className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors uppercase tracking-widest"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Cart Items List */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow">
                  <h2 className="font-extrabold text-stone-900 text-lg tracking-tight mb-6">
                    Review Ordered Selection
                  </h2>

                  {cart.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {cart.map((item) => {
                        const restaurant = restaurantDetailsHashMap[item.restaurantId];
                        return (
                          <div 
                            key={item.menuItemId} 
                            className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0 last:pb-0"
                            id={`cart-item-${item.menuItemId}`}
                          >
                            <div>
                              <h3 className="font-bold text-stone-800 text-sm">{item.name}</h3>
                              <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                                Curated by {restaurant ? restaurant.name : "Selected Kitchen"}
                              </p>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                              <div className="flex items-center space-x-2 border border-stone-200 bg-stone-50 rounded-md p-1">
                                <button
                                  onClick={() => updateCartQuantity(item.menuItemId, -1)}
                                  className="p-1 hover:text-stone-950 text-stone-400 rounded hover:bg-white transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-bold font-mono px-2 text-stone-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(item.menuItemId, 1)}
                                  className="p-1 hover:text-stone-950 text-stone-400 rounded hover:bg-white transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center space-x-4">
                                <span className="text-xs font-mono font-bold text-stone-900 text-right w-16">
                                  ${(item.price * item.quantity).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => removeFromCart(item.menuItemId)}
                                  className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                      <p className="text-xs font-mono text-stone-400">
                        Checkout container empty. Select a premium restaurant list to pack a basket.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Checkout Form Card */}
              <div className="lg:col-span-4">
                <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight">Checkout Ledger</h3>
                    <p className="text-xs text-stone-400 mt-0.5">Physical billing details & delivery info</p>
                  </div>

                  {cart.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-stone-100">
                      {/* Calculations */}
                      <div className="space-y-2 text-xs text-stone-500 font-mono">
                        <div className="flex justify-between">
                          <span>Items Sum</span>
                          <span>
                            ${cart.reduce((sum, ci) => sum + (ci.price * ci.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dispatch Courier Fee</span>
                          <span>$3.99</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Kitchen Franchise Tax (7%)</span>
                          <span>
                            ${(cart.reduce((sum, ci) => sum + (ci.price * ci.quantity), 0) * 0.07).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-stone-900 border-t border-dashed border-stone-100 pt-2 text-sm mt-2">
                          <span className="font-sans">Total Bill</span>
                          <span>
                            ${(
                              cart.reduce((sum, ci) => sum + (ci.price * ci.quantity), 0) * 1.07 + 3.99
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Delivery Form parameters */}
                      <form onSubmit={handlePlaceOrder} className="space-y-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Physical Delivery Address *
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={checkoutAddress}
                            onChange={(e) => setCheckoutAddress(e.target.value)}
                            className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-md focus:border-stone-900 focus:bg-white outline-none transition-all resize-none"
                            placeholder="Type delivery address..."
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                            Contact Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-md focus:border-stone-900 focus:bg-white outline-none transition-all"
                            placeholder="E.g. +1 (555) 019-2831"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          id="btn-confirm-checkout"
                          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <Check className="w-4 h-4 text-amber-400" />
                          <span>{isLoading ? "Placing Order..." : "Confirm & Place Order"}</span>
                        </button>
                      </form>

                    </div>
                  )}

                  {cart.length === 0 && (
                    <button
                      onClick={() => setCurrentView("home")}
                      className="w-full py-2.5 bg-stone-50 hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-bold tracking-wider uppercase rounded-lg border border-dashed border-stone-200 transition-colors"
                    >
                      Browse Kitchen Lists
                    </button>
                  )}

                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================
            VIEW: MY ORDERS / TRACKING SYSTEM 
            ======================================================== */}
        {currentView === "tracker" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-extrabold text-stone-900 text-2xl tracking-tight">
                Order Activity & Real-Time Tracking
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Review active delivery states, milestones and history
              </p>
            </div>

            {orders.length > 0 ? (
              <div className="space-y-8">
                {/* Active orders highlighting */}
                {orders.filter(o => o.status !== "Delivered").map(actOrder => (
                  <div 
                    key={actOrder.id} 
                    className="bg-white p-6 rounded-xl border-l-[4px] border-l-amber-500 border border-stone-200/60 card-shadow space-y-6"
                    id={`active-order-${actOrder.id}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-stone-400">Order ID: {actOrder.id}</span>
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            In Transit
                          </span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-base mt-1">
                          From {actOrder.restaurantName}
                        </h3>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-stone-400">Total Bill Ledger</span>
                        <div className="text-lg font-bold text-stone-900 font-mono tracking-tight mt-0.5">
                          ${actOrder.totalAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Progress tracking milestones bar */}
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                      <div className="relative pt-2 pb-6">
                        
                        {/* Connecting line */}
                        <div className="absolute top-5 left-4 right-4 h-1 bg-stone-200 -z-0" />
                        <div 
                          className="absolute top-5 left-4 h-1 bg-stone-950 transition-all duration-500" 
                          style={{
                            width: actOrder.status === "Placed" ? "25%" :
                                   actOrder.status === "Preparing" ? "50%" :
                                   actOrder.status === "Out for Delivery" ? "75%" : "100%"
                          }}
                        />

                        {/* Milestone Nodes */}
                        <div className="flex justify-between items-center relative z-10 font-mono">
                          {[
                            { key: "Placed", label: "01/ Placed" },
                            { key: "Preparing", label: "02/ Cooking" },
                            { key: "Out for Delivery", label: "03/ Out Courier" },
                            { key: "Delivered", label: "04/ Delivered" }
                          ].map((milestone, mIdx) => {
                            const statusesOrdered: Order["status"][] = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
                            const currentIdx = statusesOrdered.indexOf(actOrder.status);
                            const milestoneIdx = statusesOrdered.indexOf(milestone.key as Order["status"]);
                            const isPassed = milestoneIdx <= currentIdx;

                            return (
                              <div key={milestone.key} className="flex flex-col items-center">
                                <div 
                                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                    isPassed 
                                      ? "bg-stone-950 border-stone-950 text-amber-400 text-xs font-bold" 
                                      : "bg-white border-stone-200 text-stone-300 text-xs"
                                  }`}
                                >
                                  {isPassed ? "✓" : mIdx + 1}
                                </div>
                                <span className={`text-[9px] font-semibold uppercase tracking-wider mt-2.5 ${
                                  isPassed ? "text-stone-900 font-bold" : "text-stone-400"
                                }`}>
                                  {milestone.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-stone-500 bg-stone-50/50 p-4 rounded-lg">
                      <div>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest block mb-1">
                          Consolidated Food List
                        </span>
                        <div className="space-y-1">
                          {actOrder.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between pr-4 text-stone-800">
                              <span>{it.name} <span className="text-stone-400">x{it.quantity}</span></span>
                              <span>${(it.price * it.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest block mb-1">
                          Delivery Dispatch Coordinates
                        </span>
                        <p className="text-stone-800 font-sans leading-relaxed">{actOrder.deliveryAddress}</p>
                        <p className="text-stone-500 mt-1 font-mono">Contact: {actOrder.phone}</p>
                      </div>
                    </div>

                    {/* View Timeline logs active trigger */}
                    <div className="flex justify-between items-center border-t border-stone-100 pt-4 mt-2">
                      <span className="text-[10px] text-stone-400 font-mono">
                        Ordered: {new Date(actOrder.createdAt).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setTimelineOrder(actOrder)}
                        id={`view-timeline-${actOrder.id}`}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-stone-950 hover:bg-stone-850 text-amber-400 font-bold hover:text-white text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all border border-stone-800"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>View Full Timeline Logs</span>
                      </button>
                    </div>

                  </div>
                ))}

                {/* Historical records */}
                <div className="bg-white p-6 rounded-xl border border-stone-200/60 card-shadow space-y-6">
                  <h3 className="font-extrabold text-stone-900 text-base tracking-tight border-b border-stone-100 pb-3">
                    Historic Culinary Dispatch Logs
                  </h3>

                  <div className="divide-y divide-stone-100">
                    {orders.filter(o => o.status === "Delivered").map((histOrder) => (
                      <div 
                        key={histOrder.id} 
                        className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0 last:pb-0"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono text-stone-400">ID: {histOrder.id}</span>
                            <span className="bg-stone-100 text-stone-600 text-[9px] font-mono px-2 py-0.5 rounded uppercase">
                              Delivered
                            </span>
                          </div>
                          <span className="font-bold text-stone-800 text-sm block mt-1">
                            {histOrder.restaurantName}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono mt-0.5 block">
                            Ordered: {new Date(histOrder.createdAt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:shrink-0">
                          <span className="text-xs font-mono text-stone-400">
                            {histOrder.items.reduce((sum, ci) => sum + ci.quantity, 0)} packages
                          </span>
                          
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="text-sm font-bold text-stone-900 font-mono">
                              ${histOrder.totalAmount.toFixed(2)}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 mt-0.5">
                              <button
                                onClick={() => setTimelineOrder(histOrder)}
                                id={`view-timeline-${histOrder.id}`}
                                className="text-[10px] text-stone-500 font-semibold hover:text-stone-950 transition-colors uppercase tracking-wider flex items-center gap-1 font-mono hover:underline"
                              >
                                <Clock className="w-3 h-3" />
                                <span>Timeline Journal</span>
                              </button>
                              <button
                                onClick={() => {
                                  // Simple helper to load order back to cart as mock "reorder" action!
                                  setCart(histOrder.items.map(it => ({
                                    menuItemId: it.menuItemId,
                                    name: it.name,
                                    price: it.price,
                                    quantity: it.quantity,
                                    restaurantId: histOrder.restaurantId
                                  })));
                                  setCurrentView("cart");
                                  showToast("Loaded historical items back to checkout cart!");
                                }}
                                className="text-[10px] text-amber-600 font-bold hover:text-stone-900 uppercase tracking-wider transition-colors font-mono"
                              >
                                Reorder Again
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}

                    {orders.filter(o => o.status === "Delivered").length === 0 && (
                      <div className="py-8 text-center text-xs font-mono text-stone-400">
                        No historical deliveries logged with FEAST collective.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-16 text-center bg-white border border-dashed border-stone-200 rounded-xl">
                <ClipboardList className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                <p className="text-xs font-mono text-stone-400">
                  No active orders or historic purchase logs created yet.
                </p>
                <button
                  onClick={() => setCurrentView("home")}
                  className="mt-4 px-4 py-2 bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded"
                >
                  Order Food Now
                </button>
              </div>
            )}

          </div>
        )}

        {/* ========================================================
            VIEW: AUTH / LOGIN & SIGNUP
            ======================================================== */}
        {currentView === "login" && (
          <div className="max-w-md mx-auto my-8">
            
            {/* Visual Header */}
            <div className="text-center space-y-2 mb-8">
              <span className="text-xs font-mono tracking-widest uppercase text-stone-400">
                Secure Account Services
              </span>
              <h2 className="text-3xl font-black text-stone-900 tracking-tight">
                Unlock Luxe Gastronomy
              </h2>
            </div>

            {/* Main authentication tab card */}
            <div className="bg-white rounded-xl border border-stone-200/60 card-shadow overflow-hidden">
              <div className="flex border-b border-stone-100 bg-stone-50">
                <button
                  onClick={() => { setAuthMode("login"); setAuthError(""); }}
                  className={`w-1/2 py-3.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                    authMode === "login"
                      ? "border-stone-900 text-stone-900 bg-white"
                      : "border-transparent text-stone-400 hover:text-stone-700"
                  }`}
                >
                  01/ SIGNIN
                </button>
                <button
                  onClick={() => { setAuthMode("signup"); setAuthError(""); }}
                  className={`w-1/2 py-3.5 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all ${
                    authMode === "signup"
                      ? "border-stone-900 text-stone-900 bg-white"
                      : "border-transparent text-stone-400 hover:text-stone-700"
                  }`}
                >
                  02/ REGISTRATION
                </button>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Error Banner */}
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs font-medium rounded-lg">
                    {authError}
                  </div>
                )}

                {/* Presets fast access (CRITICAL for super convenient sandbox testing!) */}
                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/50 space-y-3">
                  <div className="flex items-center space-x-1.5 text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold">Sandbox Testing Quick presets:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("customer")}
                      className="py-1.5 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-md shadow-sm text-center"
                    >
                      Login Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickLogin("admin")}
                      className="py-1.5 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-stone-950 text-[10px] font-mono uppercase tracking-wider font-semibold rounded-md shadow-sm text-center"
                    >
                      Login Admin
                    </button>
                  </div>
                </div>

                {/* Genuine Signup/Login Forms */}
                <form onSubmit={authMode === "login" ? handleLogin : handleSignup} className="space-y-4">
                  {authMode === "signup" && (
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none transition-all"
                        placeholder="John Smith"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none transition-all"
                      placeholder="e.g. customer@feasts.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                      Credentials Password
                    </label>
                    <input
                      type="password"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none transition-all"
                      placeholder="e.g. customer123 / admin123"
                    />
                  </div>

                  {authMode === "signup" && (
                    <>
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                          Delivery Address
                        </label>
                        <input
                          type="text"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none transition-all"
                          placeholder="e.g. 123 Serene Valley, Apt 5"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none transition-all"
                          placeholder="e.g. +1 555-019-2831"
                        />
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-colors"
                  >
                    {isLoading 
                      ? "Verifying Ledger parameters..." 
                      : authMode === "login" ? "Complete Sign In" : "Register Credentials"
                    }
                  </button>
                </form>

              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW: UNIFIED ADMIN WORKSPACE CENTRE
            ======================================================== */}
        {currentView === "admin" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Unified Admin Navigation Header */}
            <div className="bg-white p-6 rounded-2xl border border-stone-200/60 card-shadow">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-stone-100">
                <div>
                  <h2 className="font-extrabold text-stone-900 text-2xl tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Central Administration Portal
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5 mt-1">
                    Live telemetry database feeds, menu item adjustments, registered eateries listings & dispatch queues.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    onClick={fetchDashboardStats}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-amber-400 text-xs font-mono font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>Refresh Live Feeds</span>
                  </button>
                </div>
              </div>

              {/* horizontal Tab Layout bar */}
              <div className="flex flex-wrap gap-2 pt-4">
                {[
                  { id: "analytics", label: "Analytics Stats", icon: LayoutDashboard },
                  { id: "restaurants", label: "Eateries Listings", icon: Utensils },
                  { id: "menu", label: "Recipes & Dishes", icon: UtensilsCrossed },
                  { id: "orders", label: "Dispatch Queue", icon: ClipboardList }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = adminActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminActiveTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isActive 
                          ? "bg-stone-900 text-stone-100 shadow-md transform scale-[1.02]"
                          : "bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Tab 1: Analytics Analytics */}
            {adminActiveTab === "analytics" && (
              <div className="space-y-6">
                {dashboardStats ? (
                  <DashboardCharts stats={dashboardStats} />
                ) : (
                  <div className="py-24 bg-white border border-stone-100/85 rounded-2xl text-center text-xs font-mono text-stone-400 flex flex-col items-center justify-center gap-2 card-shadow">
                    <span className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-900 animate-spin"></span>
                    <span>Generating live analytics vectors...</span>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab 2: Restaurant CRUD Management */}
            {adminActiveTab === "restaurants" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Save Form - Left */}
                <div id="restaurant-form-section" className="lg:col-span-4 bg-white p-6 rounded-2xl border border-stone-200/60 card-shadow space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight">
                      {editingRestaurantId ? "Modify Eatery Registry" : "Launch Brand New Eatery"}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">Define metadata profiles, locations, and images for new restaurants.</p>
                  </div>

                  <form onSubmit={handleSaveRestaurant} className="space-y-4 pt-4 border-t border-stone-100">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Eatery Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newRestaurantName}
                        onChange={(e) => setNewRestaurantName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="E.g. Chef's Table Grill"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Cuisine Category Tags *
                      </label>
                      <input
                        type="text"
                        required
                        value={newRestaurantCuisine}
                        onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="E.g. Continental, French Bistro, Steaks"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Rating (1-5) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="1"
                          max="5"
                          required
                          value={newRestaurantRating}
                          onChange={(e) => setNewRestaurantRating(e.target.value)}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                          placeholder="4.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Delivery Speed *
                        </label>
                        <input
                          type="text"
                          required
                          value={newRestaurantDeliveryTime}
                          onChange={(e) => setNewRestaurantDeliveryTime(e.target.value)}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                          placeholder="25-35 min"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Eatery Photo (Direct Link URL)
                      </label>
                      <input
                        type="url"
                        value={newRestaurantImage}
                        onChange={(e) => setNewRestaurantImage(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Eatery Hero Banner (Direct Link URL)
                      </label>
                      <input
                        type="url"
                        value={newRestaurantBannerImage}
                        onChange={(e) => setNewRestaurantBannerImage(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="https://images.unsplash.com/..."
                      />
                    </div>

                    <div className="flex items-center justify-between py-2 border-y border-stone-100">
                      <span className="text-xs font-semibold text-stone-700 font-sans">Feature on Customer Landing Feed?</span>
                      <input
                        type="checkbox"
                        checked={newRestaurantFeatured}
                        onChange={(e) => setNewRestaurantFeatured(e.target.checked)}
                        className="accent-stone-900 w-4 h-4 cursor-pointer"
                      />
                    </div>

                    <div className="pt-2 flex gap-2">
                      {editingRestaurantId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRestaurantId(null);
                            setNewRestaurantName("");
                            setNewRestaurantCuisine("");
                            setNewRestaurantRating("4.5");
                            setNewRestaurantDeliveryTime("20-30 min");
                            setNewRestaurantImage("");
                            setNewRestaurantBannerImage("");
                            setNewRestaurantFeatured(false);
                          }}
                          className="w-1/3 py-2 border border-stone-200 text-stone-500 hover:text-stone-900 text-xs font-semibold rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-grow py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        {editingRestaurantId ? "Save Eatery profile" : "Launch Eatery listing"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Eateries Table List - Right */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200/60 card-shadow space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight">Active Registered Eateries</h3>
                    <p className="text-xs text-stone-400 mt-0.5 font-sans">Toggle and modify coordinates or retire entries from customer index directories.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-1">
                    {restaurants.map((resItem) => {
                      return (
                        <div key={resItem.id} className="border border-stone-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                          <div className="relative h-24 bg-stone-100">
                            <img
                              src={resItem.image}
                              alt={resItem.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {resItem.featured && (
                              <span className="absolute top-2 right-2 bg-amber-400 text-stone-900 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                                Featured
                              </span>
                            )}
                          </div>
                          
                          <div className="p-4 space-y-2">
                            <div>
                              <h4 className="font-bold text-stone-900 text-sm truncate">{resItem.name}</h4>
                              <p className="text-[10px] text-stone-500 mt-0.5 truncate">{resItem.cuisine}</p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-mono text-stone-700 py-1 border-t border-stone-100 font-sans">
                              <span className="flex items-center gap-0.5 font-sans font-semibold">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                {resItem.rating}
                              </span>
                              <span>⏱️ {resItem.deliveryTime}</span>
                            </div>

                            <div className="pt-2 border-t border-stone-100 flex justify-end gap-3 text-xs">
                              <button
                                onClick={() => handleEditRestaurantTrigger(resItem)}
                                className="text-stone-600 hover:text-stone-900 font-bold cursor-pointer"
                              >
                                Edit Profile
                              </button>
                              <button
                                onClick={() => handleDeleteRestaurant(resItem.id)}
                                className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                              >
                                Decommission
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Kitchen Menu Catalog Manager */}
            {adminActiveTab === "menu" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form card - Left */}
                <div id="recipe-form-section" className="lg:col-span-4 bg-white p-6 rounded-2xl border border-stone-200/60 card-shadow space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm tracking-tight">
                      {editingItemId ? "Modify Premium Recipe" : "Introduce New Culinary Recipe"}
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5 font-sans">Define descriptions, options, and categories matching customer tastes.</p>
                  </div>

                  <form onSubmit={handleSaveMenuItem} className="space-y-4 pt-4 border-t border-stone-100">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Assigned Eatery Outlet
                      </label>
                      <select
                        value={adminMenuRestaurantId || (restaurants[0]?.id || "")}
                        onChange={(e) => setAdminMenuRestaurantId(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-md focus:border-stone-900 focus:bg-white outline-none"
                      >
                        <option value="">-- Choose eatery --</option>
                        {restaurants.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Dish Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="E.g. Truffle Infused Tagliatelle"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Price ($) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                          placeholder="16.50"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                          Dietary Category
                        </label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value as MenuItem["category"])}
                          className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        >
                          <option value="Veg">Veg</option>
                          <option value="Non-Veg">Non-Veg</option>
                          <option value="Fast Food">Fast Food</option>
                          <option value="Desserts">Desserts</option>
                          <option value="Beverages">Beverages</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Visual Photo Link (Unsplash URL)
                      </label>
                      <input
                        type="url"
                        value={newItemImageUrl}
                        onChange={(e) => setNewItemImageUrl(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none"
                        placeholder="Paste image link..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Dish Descriptions / Ingredients
                      </label>
                      <textarea
                        rows={3}
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 focus:border-stone-900 focus:bg-white rounded-md outline-none resize-none"
                        placeholder="Brief culinary ingredients highlights..."
                      />
                    </div>

                    <div className="pt-2 flex space-x-2">
                      {editingItemId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItemId(null);
                            setNewItemName("");
                            setNewItemPrice("");
                            setNewItemDesc("");
                            setNewItemImageUrl("");
                          }}
                          className="w-1/3 py-2 border border-stone-200 text-stone-500 hover:text-stone-900 text-xs font-semibold rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-grow py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                      >
                        {editingItemId ? "Save Dish Update" : "Launch Recipe Dish"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Master Menu List - Right */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-stone-200/60 card-shadow space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-baseline gap-4">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm tracking-tight">Active Unified Menu Database List</h3>
                      <p className="text-xs text-stone-400 mt-0.5">Aggregate catalog displays of recipes active across customer portals</p>
                    </div>
                    
                    {/* Tiny search filter to make the recipe dashboard incredibly interactive */}
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Filter recipe catalog..."
                        id="recipe-catalog-search"
                        className="pl-8 pr-3 py-1.5 bg-stone-100 border-0 rounded-lg text-xs w-full focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 font-sans"
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase();
                          const rows = document.querySelectorAll(".menu-catalog-row");
                          rows.forEach((row: any) => {
                            const nameText = row.querySelector(".menu-catalog-name")?.textContent?.toLowerCase() || "";
                            if (nameText.includes(val)) {
                              row.style.display = "flex";
                            } else {
                              row.style.display = "none";
                            }
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto pr-2">
                    {menuItems.map((item) => {
                      const restaurant = restaurantDetailsHashMap[item.restaurantId];
                      return (
                        <div key={item.id} className="py-4 flex items-center justify-between gap-4 menu-catalog-row animate-in fade-in">
                          <div className="flex items-center space-x-3">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <span className="font-semibold text-stone-800 text-sm block menu-catalog-name">{item.name}</span>
                              <span className="text-[10px] font-mono text-stone-400 bg-stone-100 py-0.5 px-2 rounded-md">
                                {restaurant ? restaurant.name : "N/A Restaurant"} • {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <span className="text-xs font-mono font-bold text-stone-900">
                              ${item.price.toFixed(2)}
                            </span>

                            <button
                              onClick={() => {
                                handleEditItemTrigger(item);
                                // Smooth scroll back up to recipe form
                                const recipeSection = document.getElementById("recipe-form-section");
                                if (recipeSection) {
                                  recipeSection.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="text-stone-500 hover:text-stone-900 text-xs font-semibold cursor-pointer"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-stone-300 hover:text-red-600 p-1 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 4: Dispatch queue queue */}
            {adminActiveTab === "orders" && (
              <div className="bg-white rounded-2xl border border-stone-200/60 card-shadow overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">
                      Active Dispatch & Order Operations
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5 font-sans">
                      Click status options to communicate live route updates directly to customer tracker portals.
                    </p>
                  </div>

                  {/* Filter dispatcher queue by status */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">Queue:</span>
                    <select
                      id="order-queue-filter"
                      onChange={(e) => {
                        const val = e.target.value;
                        const ordersRows = document.querySelectorAll(".dispatch-queue-row");
                        ordersRows.forEach((row: any) => {
                          const status = row.getAttribute("data-status");
                          if (!val || status === val) {
                            row.style.display = "flex";
                          } else {
                            row.style.display = "none";
                          }
                        });
                      }}
                      className="bg-stone-50 border border-stone-200 text-stone-800 text-xs py-1 px-2 rounded-lg outline-none cursor-pointer focus:bg-white"
                    >
                      <option value="">All Orders</option>
                      <option value="Placed">Placed</option>
                      <option value="Preparing">Preparing</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>

                <div className="divide-y divide-stone-100">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <div key={order.id} data-status={order.status} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 dispatch-queue-row animate-in fade-in">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                              {order.id}
                            </span>
                            <span className="text-xs font-semibold text-stone-800">{order.userName}</span>
                            <span className="text-xs text-stone-400 font-mono">
                              • {new Date(order.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          
                          <div className="text-xs font-mono text-stone-600">
                            <span className="font-bold block text-stone-850 mb-1">{order.restaurantName}</span>
                            <div className="space-y-0.5 pl-2 border-l border-stone-200">
                              {order.items.map((i, idx) => (
                                <div key={idx}>
                                  {i.name} <span className="text-stone-400">x{i.quantity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-xs text-stone-500 font-mono pt-1">
                            📍 {order.deliveryAddress} <br />
                            📞 {order.phone}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto shrink-0 justify-end">
                          <div className="text-right">
                            <span className="text-xs text-stone-400 font-sans">Total Receipt</span>
                            <div className="text-base font-bold text-stone-900 font-mono">
                              ${order.totalAmount.toFixed(2)}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Choose and update order statuses in real-time */}
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order["status"])}
                              className="bg-stone-50 border border-stone-200 text-stone-800 text-xs py-1.5 px-2.5 rounded-lg focus:border-stone-900 outline-none w-full sm:w-auto cursor-pointer"
                            >
                              <option value="Placed">Placed</option>
                              <option value="Preparing">Preparing</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>

                            <button
                              onClick={() => setTimelineOrder(order)}
                              id={`view-timeline-${order.id}`}
                              className="p-1.5 border border-stone-200 hover:border-stone-500 bg-white hover:bg-stone-50 text-stone-700 hover:text-stone-950 rounded-lg shrink-0 flex items-center justify-center transition-all cursor-pointer"
                              title="View Full Milestone Timeline Logs"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>

                            {order.status === "Delivered" && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs font-mono text-stone-400">
                      No active dispatch records on file.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* View Full Timeline Modal */}
      {timelineOrder && (
        <div 
          id="timeline-modal" 
          className="fixed inset-0 bg-stone-900/65 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setTimelineOrder(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg border border-stone-200 shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-stone-950 text-stone-50 p-6 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest block">
                  ORDER LIFECYCLE JOURNAL
                </span>
                <h3 className="text-base font-bold tracking-tight text-white mt-1">
                  Tracking ID: {timelineOrder.id}
                </h3>
              </div>
              <button 
                onClick={() => setTimelineOrder(null)}
                className="text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors w-8 h-8 flex items-center justify-center"
                id="close-timeline-modal"
              >
                <span className="text-sm font-bold font-mono">✕</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Short Order Summary Card */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200/50 flex justify-between items-center gap-4">
                <div>
                  <span className="text-[9px] uppercase font-mono text-stone-400 block pb-0.5">Origin Kitchen</span>
                  <span className="font-extrabold text-stone-900 text-sm">{timelineOrder.restaurantName}</span>
                  <span className="text-xs text-stone-500 block mt-0.5 font-mono">
                    {timelineOrder.items.reduce((sum, i) => sum + i.quantity, 0)} packages • Total ${timelineOrder.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] uppercase font-mono text-stone-400 block pb-0.5">Current Status</span>
                  <span className={`inline-flex items-center text-xs font-mono font-bold tracking-wide uppercase px-2.5 py-1 rounded-md ${
                    timelineOrder.status === "Delivered" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-amber-50 text-amber-900 border border-amber-200"
                  }`}>
                    {timelineOrder.status}
                  </span>
                </div>
              </div>

              {/* Vertical Timeline Logs list */}
              <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-stone-200">
                {[
                  { key: "Placed", label: "01/ Order Placed", desc: "The order requests were received by the kitchen and are queued for verification." },
                  { key: "Preparing", label: "02/ Preparing Meal", desc: "Our chef artisans are actively assembling and cooking your high-quality recipes." },
                  { key: "Out for Delivery", label: "03/ Out Courier", desc: "An active courier driver from our service block dispatched with your packaged parcel." },
                  { key: "Delivered", label: "04/ Delivered Safely", desc: "The package parcels were verified and completed at your drop coordinate address." }
                ].map((milestone, idx) => {
                  const statusesOrdered = ["Placed", "Preparing", "Out for Delivery", "Delivered"];
                  const currentIdx = statusesOrdered.indexOf(timelineOrder.status);
                  const milestoneIdx = statusesOrdered.indexOf(milestone.key);
                  const isCompleted = milestoneIdx <= currentIdx;
                  
                  // Find logged entry if it exists in statusTimeline
                  const loggedEntry = timelineOrder.statusTimeline?.find(item => item.status === milestone.key);
                  
                  return (
                    <div key={milestone.key} className="flex gap-4 relative items-start group">
                      {/* Node circle wrapper */}
                      <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 z-10 transition-all ${
                        isCompleted 
                          ? "bg-slate-900 border-slate-900 text-amber-400 shadow-md" 
                          : "bg-white border-stone-200 text-stone-300"
                      }`}>
                        {isCompleted ? (
                          <span className="text-xs font-bold font-mono">✓</span>
                        ) : (
                          <span className="text-xs font-mono">{idx + 1}</span>
                        )}
                      </div>

                      {/* Event Details */}
                      <div className="flex-grow space-y-1 pt-1.5 border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                          <h4 className={`text-xs font-extrabold tracking-tight ${isCompleted ? "text-stone-900" : "text-stone-400"}`}>
                            {milestone.label}
                          </h4>
                          {loggedEntry ? (
                            <span className="text-[10px] font-mono font-medium text-stone-850 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded shrink-0">
                              {new Date(loggedEntry.timestamp).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-400 italic">
                              Pending Update
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isCompleted ? "text-stone-500 font-medium" : "text-stone-400/70"}`}>
                          {milestone.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 p-4 border-t border-stone-150 flex justify-end">
              <button
                onClick={() => setTimelineOrder(null)}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-850 text-stone-50 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all font-mono tracking-wider uppercase text-center"
              >
                Close Tracking Log
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modern Minimalist Editorial Footer */}
      <footer className="bg-white border-t border-stone-200/60 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-stone-900 font-extrabold tracking-tight text-sm">FEAST COLLECTIVE</span>
            <span className="text-stone-400 text-xs block mt-1">
              &copy; {new Date().getFullYear()} FEAST Inc. Sleek design for discerning culinary patrons.
            </span>
          </div>

          <div className="flex space-x-6 text-xs text-stone-500 font-mono">
            <span>TEAM2 & TEAM5 ECOSYSTEM</span>
            <span>PERSISTENT DATABASE INJECTOR</span>
            <span>SECURE CRYPTO JWT</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
