import React, { useState } from "react";
import { ShoppingBag, LogOut, ShieldAlert, History, MapPin, User, Settings, Menu, X, ChefHat } from "lucide-react";
import { User as UserType, CartItem } from "../types";

interface NavbarProps {
  currentUser: UserType | null;
  cart: CartItem[];
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  onUpdateProfile: (name: string, address: string, phone: string) => Promise<void>;
  restaurantDetails: { [key: string]: { name: string } };
}

export default function Navbar({
  currentUser,
  cart,
  currentView,
  onNavigate,
  onLogout,
  onUpdateProfile,
  restaurantDetails
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(currentUser?.name || "");
  const [profileAddress, setProfileAddress] = useState(currentUser?.address || "");
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdateProfile(profileName, profileAddress, profilePhone);
      setIsProfileOpen(false);
    } catch (err) {
      alert("Failed to update profile settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  const openProfileModal = () => {
    if (currentUser) {
      setProfileName(currentUser.name);
      setProfileAddress(currentUser.address);
      setProfilePhone(currentUser.phone);
    }
    setIsProfileOpen(true);
  };

  // Safe Cart summary info
  const cartRestaurantId = cart.length > 0 ? cart[0].restaurantId : null;
  const cartRestaurantName = cartRestaurantId ? (restaurantDetails[cartRestaurantId]?.name || "Local Kitchen") : "";

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo */}
            <div 
              className="flex items-center space-x-2 cursor-pointer group"
              onClick={() => onNavigate(currentUser?.role === "admin" ? "admin" : "home")}
              id="nav-logo"
            >
              <div className="p-1.5 bg-stone-900 text-stone-50 rounded-lg group-hover:bg-stone-800 transition-colors">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-stone-900 text-lg transition-colors group-hover:text-stone-700">FEAST</span>
                <span className="text-stone-400 font-medium text-xs ml-1.5 tracking-widest uppercase">collective</span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex space-x-6 items-center">
              {currentUser && currentUser.role === "customer" && (
                <>
                  <button
                    onClick={() => onNavigate("home")}
                    id="nav-link-menu"
                    className={`text-sm font-medium transition-colors ${
                      currentView === "home" ? "text-stone-900 border-b-2 border-stone-900 pt-1 pb-1" : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Restaurants
                  </button>
                  <button
                    onClick={() => onNavigate("tracker")}
                    id="nav-link-orders"
                    className={`text-sm font-medium flex items-center transition-colors ${
                      currentView === "tracker" ? "text-stone-900 border-b-2 border-stone-900 pt-1 pb-1" : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    <History className="w-4 h-4 mr-1.5" />
                    My Orders
                  </button>
                </>
              )}

              {currentUser && currentUser.role === "admin" && (
                <>
                  <button
                    id="nav-link-admin-stats"
                    onClick={() => onNavigate("admin")}
                    className={`text-sm font-medium flex items-center transition-colors ${
                      currentView === "admin" ? "text-stone-900 border-b-2 border-stone-900 pt-1 pb-1" : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 mr-1.5 text-stone-700" />
                    Admin Dashboard
                  </button>
                  <button
                    id="nav-link-admin-menu"
                    onClick={() => onNavigate("admin-menu")}
                    className={`text-sm font-medium transition-colors ${
                      currentView === "admin-menu" ? "text-stone-900 border-b-2 border-stone-900 pt-1 pb-1" : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Manage Menu
                  </button>
                </>
              )}
            </div>

            {/* Profile, Cart, Logout controls */}
            <div className="hidden md:flex items-center space-x-4">
              {currentUser ? (
                <>
                  {/* Address indicator */}
                  {currentUser.role === "customer" && (
                    <button
                      onClick={openProfileModal}
                      id="nav-address-display"
                      className="flex items-center text-stone-500 hover:text-stone-900 transition-colors text-xs space-x-1.5 py-1 px-2.5 rounded-full bg-stone-100 hover:bg-stone-200"
                      title={currentUser.address || "Add physical delivery address"}
                    >
                      <MapPin className="w-3.5 h-3.5 text-stone-600" />
                      <span className="max-w-[140px] truncate font-medium">
                        {currentUser.address || "Set Address"}
                      </span>
                    </button>
                  )}

                  {/* Cart widget */}
                  {currentUser.role === "customer" && (
                    <button
                      onClick={() => onNavigate("cart")}
                      id="nav-cart-trigger"
                      className={`relative p-2 rounded-full border transition-all ${
                        cartItemsCount > 0
                          ? "bg-stone-900 text-stone-50 border-stone-900 hover:bg-stone-800 hover:scale-105"
                          : "bg-white text-stone-600 border-stone-200 hover:text-stone-900 hover:border-stone-300"
                      }`}
                      title={cartRestaurantName ? `Order from ${cartRestaurantName}` : "My Shopping Cart"}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {cartItemsCount > 0 && (
                        <span className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-[10px] font-bold text-stone-950 rounded-full px-1 border border-stone-900">
                          {cartItemsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Settings dropdown */}
                  <div className="flex items-center space-x-3 border-l border-stone-200 pl-4">
                    <button
                      onClick={openProfileModal}
                      id="nav-profile-edit"
                      className="flex items-center space-x-1.5 text-sm text-stone-700 hover:text-stone-900 transition-colors py-1.5"
                    >
                      <div className="w-7 h-7 bg-stone-100 border border-stone-200 flex items-center justify-center rounded-full">
                        <User className="w-4 h-4 text-stone-600" />
                      </div>
                      <span className="font-semibold text-xs text-stone-900 max-w-[100px] truncate">
                        {currentUser.name}
                      </span>
                    </button>

                    <button
                      onClick={onLogout}
                      id="nav-logout"
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-all"
                      title="Log out of application"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => onNavigate("login")}
                  id="nav-login-signin"
                  className="text-xs tracking-wider uppercase font-semibold text-stone-900 border border-stone-900 hover:bg-stone-900 hover:text-white py-2 px-5 rounded-md transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu and cart trigger */}
            <div className="md:hidden flex items-center space-x-2">
              {currentUser && currentUser.role === "customer" && (
                <button
                  onClick={() => onNavigate("cart")}
                  id="nav-cart-trigger-mobile"
                  className="relative p-2 bg-stone-100 text-stone-700 border border-stone-200 rounded-full"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-[9px] font-bold text-stone-950 rounded-full h-4 min-w-4 flex items-center justify-center border border-white">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                id="nav-hamburger"
                className="p-2 text-stone-700 hover:bg-stone-50 border border-stone-200 rounded-md"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile slide-down navigation menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 bg-white px-4 pt-2 pb-6 space-y-4">
            {currentUser ? (
              <>
                <div className="flex items-center space-x-2 pb-2 border-b border-stone-100">
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{currentUser.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
                      {currentUser.role === "admin" ? "System Administrator" : "Customer account"}
                    </div>
                  </div>
                </div>

                {currentUser.role === "customer" ? (
                  <>
                    <button
                      onClick={() => { onNavigate("home"); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-stone-600 hover:text-stone-900 font-medium text-sm"
                    >
                      Browse Restaurants
                    </button>
                    <button
                      onClick={() => { onNavigate("tracker"); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-stone-600 hover:text-stone-900 font-medium text-sm flex items-center"
                    >
                      <History className="w-4 h-4 mr-2" />
                      My Orders
                    </button>
                    <button
                      onClick={() => { openProfileModal(); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-stone-600 hover:text-stone-900 font-medium text-sm flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Manage Address
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { onNavigate("admin"); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-stone-600 hover:text-stone-900 font-medium text-sm flex items-center"
                    >
                      <ShieldAlert className="w-4 h-4 mr-2 text-amber-600" />
                      Admin Dashboard
                    </button>
                    <button
                      onClick={() => { onNavigate("admin-menu"); setMobileMenuOpen(false); }}
                      className="block w-full text-left py-2 text-stone-600 hover:text-stone-900 font-medium text-sm"
                    >
                      Manage Recipes & Menus
                    </button>
                  </>
                )}

                <div className="pt-4 border-t border-stone-100">
                  <button
                    onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center justify-center py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-semibold uppercase tracking-wider"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out Account
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => { onNavigate("login"); setMobileMenuOpen(false); }}
                className="w-full block text-center py-2.5 bg-stone-900 text-white rounded-lg text-sm font-semibold"
              >
                Sign In to Account
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Elegant, clean Profile / Address Custom Minimal Modal popup */}
      {isProfileOpen && currentUser && (
        <div id="profile-modal" className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-stone-100 overflow-hidden transform transition-all duration-300">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <div>
                <h3 className="font-bold text-stone-900 text-base">Account Profile Settings</h3>
                <p className="text-xs text-stone-500 mt-0.5">Manage delivery address and contact specs</p>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1 px-1.5 border border-stone-200 text-stone-400 hover:text-stone-900 rounded-md hover:bg-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-semibold text-stone-400 tracking-wider uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-stone-900 rounded-md outline-none transition-all"
                  placeholder="E.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-stone-400 tracking-wider uppercase mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-stone-900 rounded-md outline-none transition-all"
                  placeholder="E.g. +1 (555) 012-3456"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-semibold text-stone-400 tracking-wider uppercase mb-1">
                  Physical Delivery Address
                </label>
                <textarea
                  required
                  rows={3}
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full py-2 px-3 text-sm bg-stone-50 hover:bg-stone-100/50 focus:bg-white border border-stone-200 focus:border-stone-900 rounded-md outline-none transition-all resize-none"
                  placeholder="Enter full physical address, apartment number, and postal code..."
                />
              </div>

              <div className="pt-2 flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2 text-stone-500 hover:text-stone-900 transition-colors text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-stone-950 text-stone-50 text-xs font-semibold rounded-md hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Saving Settings..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
