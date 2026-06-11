export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  address: string;
  phone: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  bannerImage: string;
  featured: boolean;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: "Veg" | "Non-Veg" | "Fast Food" | "Desserts" | "Beverages";
  imageUrl: string;
  isAvailable: boolean;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalAmount: number;
  status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered";
  deliveryAddress: string;
  phone: string;
  createdAt: string;
  statusTimeline?: { status: "Placed" | "Preparing" | "Out for Delivery" | "Delivered"; timestamp: string }[];
}

export interface DashboardStats {
  totalOrdersCount: number;
  totalSimulatedRevenue: number;
  popularFoodItems: {
    menuItemId: string;
    name: string;
    orderCount: number;
    revenueGenerated: number;
  }[];
  userOrderActivity: {
    userId?: string;
    userName?: string;
    ordersCount?: number;
    totalSpent?: number;
    orderId?: string;
    restaurantName?: string;
    amount?: number;
    status?: string;
    date?: string;
  }[];
  categoryStats: {
    name: string;
    value: number;
  }[];
}
