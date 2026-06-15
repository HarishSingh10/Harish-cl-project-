import { Router, Response } from "express";
import { DB, MenuItem, Order, OrderItem, Restaurant } from "./db";
import { authenticateToken, requireAdmin, AuthenticatedRequest, hashPassword, comparePassword, generateToken } from "./auth";

const router = Router();

// ==========================================
// 1. AUTHENTICATION ROUTERS
// ==========================================

// Register
router.post("/auth/signup", async (req, res) => {
  try {
    const { email, password, name, address, phone, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password and name are required" });
      return;
    }

    const existingUser = DB.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: "Email already exists in system" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUserRole = role === "admin" ? "admin" : "customer";

    const newUser = DB.addUser({
      id: "u_" + Math.random().toString(36).substring(2, 9),
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: newUserRole,
      address: address || "",
      phone: phone || "",
      createdAt: new Date().toISOString()
    });

    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        address: newUser.address,
        phone: newUser.phone
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error during signup" });
  }
});

// Login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = DB.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const match = await comparePassword(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        address: user.address,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error during login" });
  }
});

// Get Current User Profile (Secure)
router.get("/auth/me", authenticateToken as any, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = DB.getUserById(req.user.id);
  if (!user) {
    res.status(404).json({ error: "User session not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    address: user.address,
    phone: user.phone
  });
});

// Update Profile Detail (Secure)
router.put("/auth/profile", authenticateToken as any, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { name, address, phone } = req.body;
  const updatedUser = DB.updateUser(req.user.id, {
    name,
    address,
    phone
  });

  if (!updatedUser) {
    res.status(404).json({ error: "User profile not found" });
    return;
  }

  res.json({
    id: updatedUser.id,
    email: updatedUser.email,
    name: updatedUser.name,
    role: updatedUser.role,
    address: updatedUser.address,
    phone: updatedUser.phone
  });
});


// ==========================================
// 2. RESTAURANTS & RESTAURANT MENU ROUTERS
// ==========================================

// Get All Restaurants
router.get("/restaurants", (req, res) => {
  res.json(DB.getRestaurants());
});

// Add Restaurant (Admin Only)
router.post("/restaurants", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const { name, cuisine, rating, deliveryTime, image, bannerImage, featured } = req.body;

  if (!name || !cuisine) {
    res.status(400).json({ error: "Eatery Name and Cuisine are required fields" });
    return;
  }

  const newRestaurant = DB.addRestaurant({
    id: "r_" + Math.random().toString(36).substring(2, 9),
    name,
    cuisine,
    rating: Number(rating || 4.5),
    deliveryTime: deliveryTime || "25-35 min",
    image: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400",
    bannerImage: bannerImage || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
    featured: Boolean(featured)
  });

  res.status(201).json(newRestaurant);
});

// Update Restaurant (Admin Only)
router.put("/restaurants/:id", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const { name, cuisine, rating, deliveryTime, image, bannerImage, featured } = req.body;

  const updates: Partial<Omit<Restaurant, "id">> = {};
  if (name !== undefined) updates.name = name;
  if (cuisine !== undefined) updates.cuisine = cuisine;
  if (rating !== undefined) updates.rating = Number(rating);
  if (deliveryTime !== undefined) updates.deliveryTime = deliveryTime;
  if (image !== undefined) updates.image = image;
  if (bannerImage !== undefined) updates.bannerImage = bannerImage;
  if (featured !== undefined) updates.featured = Boolean(featured);

  const updatedRestaurant = DB.updateRestaurant(id, updates);
  if (!updatedRestaurant) {
    res.status(404).json({ error: "Eatery listing not found" });
    return;
  }

  res.json(updatedRestaurant);
});

// Delete Restaurant (Admin Only)
router.delete("/restaurants/:id", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const deleted = DB.deleteRestaurant(id);
  if (!deleted) {
    res.status(404).json({ error: "Eatery listing not found" });
    return;
  }
  res.json({ success: true, message: "Eatery decommissioned successfully" });
});

// Get Food Items for Specific Restaurant
router.get("/restaurants/:id/menu", (req, res) => {
  const restaurantId = req.params.id;
  const restaurant = DB.getRestaurantById(restaurantId);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }
  const items = DB.getMenuItemsByRestaurant(restaurantId);
  res.json({ restaurant, menuItems: items });
});

// Get All Menu Items (Generic Browse / Search across restaurants)
router.get("/menu", (req, res) => {
  res.json(DB.getMenuItems());
});

// Add Menu Item (Admin Only)
router.post("/menu", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const { restaurantId, name, description, price, category, imageUrl } = req.body;

  if (!restaurantId || !name || !price || !category) {
    res.status(400).json({ error: "restaurantId, name, price, and category are required" });
    return;
  }

  const restaurant = DB.getRestaurantById(restaurantId);
  if (!restaurant) {
    res.status(404).json({ error: "Restaurant not found" });
    return;
  }

  const newItem: MenuItem = {
    id: "m_" + Math.random().toString(36).substring(2, 9),
    restaurantId,
    name,
    description: description || "",
    price: Number(price),
    category,
    imageUrl: imageUrl || "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400",
    isAvailable: true
  };

  const addedItem = DB.addMenuItem(newItem);
  res.status(201).json(addedItem);
});

// Update Menu Item (Admin Only)
router.put("/menu/:id", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const { name, description, price, category, imageUrl, isAvailable } = req.body;

  const updates: Partial<Omit<MenuItem, "id" | "restaurantId">> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (category !== undefined) updates.category = category;
  if (imageUrl !== undefined) updates.imageUrl = imageUrl;
  if (isAvailable !== undefined) updates.isAvailable = Boolean(isAvailable);

  const updatedItem = DB.updateMenuItem(id, updates);
  if (!updatedItem) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }

  res.json(updatedItem);
});

// Delete Menu Item (Admin Only)
router.delete("/menu/:id", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const id = req.params.id;
  const deleted = DB.deleteMenuItem(id);
  if (!deleted) {
    res.status(404).json({ error: "Menu item not found" });
    return;
  }
  res.json({ success: true, message: "Menu item deleted successfully" });
});


// ==========================================
// 3. ORDER MANAGEMENT ROUTERS
// ==========================================

// Place Order
router.post("/orders", (authenticateToken as any), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { restaurantId, items, deliveryAddress, phone } = req.body;

    if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Restaurant and order items are required" });
      return;
    }

    const restaurant = DB.getRestaurantById(restaurantId);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found" });
      return;
    }

    // Verify user profile
    const user = DB.getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: "User profile not found" });
      return;
    }

    // Parse & calculate items
    const parsedItems: OrderItem[] = [];
    let calculatedAmount = 0;

    for (const item of items) {
      const menuItem = DB.getMenuItemById(item.menuItemId);
      if (!menuItem) {
        res.status(404).json({ error: `Menu item with id ${item.menuItemId} doesn't exist` });
        return;
      }
      if (menuItem.restaurantId !== restaurantId) {
        res.status(400).json({ error: `Menu item ${menuItem.name} does not belong to selected restaurant` });
        return;
      }

      const q = Math.max(1, Number(item.quantity || 1));
      parsedItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: q
      });
      calculatedAmount += menuItem.price * q;
    }

    const newOrder: Order = {
      id: "ord_" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId: user.id,
      userName: user.name,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      items: parsedItems,
      totalAmount: calculatedAmount,
      status: "Placed",
      deliveryAddress: deliveryAddress || user.address || "Pending custom delivery address input",
      phone: phone || user.phone || "No phone added",
      createdAt: new Date().toISOString()
    };

    const finalOrder = DB.addOrder(newOrder);
    res.status(201).json(finalOrder);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Order placement failed" });
  }
});

// Get User History or All Orders (Admin)
router.get("/orders", (authenticateToken as any), (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role === "admin") {
    // Show all orders to the admin
    res.json(DB.getOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } else {
    // Show only the specific user's orders
    res.json(DB.getOrdersByUserId(req.user!.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  }
});

// Get single order info
router.get("/orders/:id", (authenticateToken as any), (req: AuthenticatedRequest, res: Response) => {
  const order = DB.getOrderById(req.params.id);

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Authorize: Only the owner or an admin can view details
  if (req.user!.role !== "admin" && order.userId !== req.user!.id) {
    res.status(403).json({ error: "Forbidden access to this resource" });
    return;
  }

  res.json(order);
});

// Update Order status (Admin Only)
router.put("/orders/:id/status", (authenticateToken as any), (requireAdmin as any), (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses: Order["status"][] = ["Placed", "Preparing", "Out for Delivery", "Delivered"];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status value provided" });
    return;
  }

  const updatedOrder = DB.updateOrderStatus(req.params.id, status);
  if (!updatedOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(updatedOrder);
});


// ==========================================
// 4. ANALYTICS & DASHBOARD METRICS (Basic)
// ==========================================
router.get("/dashboard/stats", (authenticateToken as any), (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = DB.getOrders();
    const menuItems = DB.getMenuItems();

    // 1. Total orders count
    const totalOrdersCount = orders.length;

    // 2. Revenue tracking (simulated based on orders)
    const totalSimulatedRevenue = orders
      .filter((o) => o.status !== "Placed") // Exclude placed for conservative business tracking, or count all
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // 3. Popular food items calculation
    const itemMap: { [key: string]: { name: string; count: number; totalRev: number } } = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!itemMap[item.menuItemId]) {
          itemMap[item.menuItemId] = { name: item.name, count: 0, totalRev: 0 };
        }
        itemMap[item.menuItemId].count += item.quantity;
        itemMap[item.menuItemId].totalRev += item.price * item.quantity;
      });
    });

    const popularFoodItems = Object.keys(itemMap)
      .map((k) => ({
        menuItemId: k,
        name: itemMap[k].name,
        orderCount: itemMap[k].count,
        revenueGenerated: itemMap[k].totalRev
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5); // top 5 items

    // 4. User Order Activity (User-specific stats if requesting customer gets it too, or list of user order activities)
    let userOrderActivity = [];
    if (req.user!.role === "admin") {
      // Group active users
      const userOrdersCountMap: { [key: string]: { name: string; count: number; spent: number } } = {};
      orders.forEach((o) => {
        if (!userOrdersCountMap[o.userId]) {
          userOrdersCountMap[o.userId] = { name: o.userName, count: 0, spent: 0 };
        }
        userOrdersCountMap[o.userId].count += 1;
        userOrdersCountMap[o.userId].spent += o.totalAmount;
      });
      userOrderActivity = Object.keys(userOrdersCountMap).map((uId) => ({
        userId: uId,
        userName: userOrdersCountMap[uId].name,
        ordersCount: userOrdersCountMap[uId].count,
        totalSpent: userOrdersCountMap[uId].spent
      }));
    } else {
      // User-specific stats
      const myOrders = orders.filter((o) => o.userId === req.user!.id);
      userOrderActivity = myOrders.map((o) => ({
        orderId: o.id,
        restaurantName: o.restaurantName,
        amount: o.totalAmount,
        status: o.status,
        date: o.createdAt
      }));
    }

    // Add extra stats for rich visual charts
    const categoryRevenueMap: { [key: string]: number } = { Veg: 0, "Non-Veg": 0, "Fast Food": 0, Desserts: 0, Beverages: 0 };
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const fullItem = menuItems.find((mi) => mi.id === item.menuItemId);
        if (fullItem) {
          categoryRevenueMap[fullItem.category] += item.price * item.quantity;
        }
      });
    });

    const categoryStats = Object.keys(categoryRevenueMap).map((cat) => ({
      name: cat,
      value: Number(categoryRevenueMap[cat].toFixed(2))
    }));

    res.json({
      totalOrdersCount,
      totalSimulatedRevenue: Number(totalSimulatedRevenue.toFixed(2)),
      popularFoodItems,
      userOrderActivity,
      categoryStats
    });
  } catch (error) {
    console.error("Dashboard stats generation error:", error);
    res.status(500).json({ error: "Failed to generate system-wide dashboard stats" });
  }
});

export { router };
