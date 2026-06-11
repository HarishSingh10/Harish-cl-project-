import fs from "fs";
import path from "path";

// Types
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: "admin" | "customer";
  address: string;
  phone: string;
  createdAt: string;
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

interface DatabaseSchema {
  users: User[];
  restaurants: Restaurant[];
  menuItems: MenuItem[];
  orders: Order[];
}

const DATA_FILE_PATH = path.join(process.cwd(), "data_store.json");

// Pre-populated realistic initial data
const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: "u1",
      email: "admin@feasts.com",
      // Salted bcrypt hash of "admin123"
      passwordHash: "$2a$10$9v3XlEOnE5Y2SIs/E.98UOdF5d8bW56cEaH3fKk.KNoVbVw6u.V6a",
      name: "Harish Singh (Admin)",
      role: "admin",
      address: "100 Feast Avenue, Tech City",
      phone: "+1 (555) 019-2831",
      createdAt: new Date().toISOString()
    },
    {
      id: "u2",
      email: "customer@feasts.com",
      // Salted bcrypt hash of "customer123"
      passwordHash: "$2a$10$XmC07K/FhZ/9.jM1nKHeoOS6/QvY0GvD3g0Bf1K5.gC9Xg40A5W2O",
      name: "Jane Doe",
      role: "customer",
      address: "42 Serene Meadows, Green Valley",
      phone: "+1 (555) 014-9988",
      createdAt: new Date().toISOString()
    }
  ],
  restaurants: [
    {
      id: "r1",
      name: "The Green Bistro",
      cuisine: "Healthy Organic, Salads, Soups",
      rating: 4.8,
      deliveryTime: "15-25 min",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400",
      bannerImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200",
      featured: true
    },
    {
      id: "r2",
      name: "Ninja Sushi & Ramen",
      cuisine: "Japanese, Sushi, Seafood",
      rating: 4.9,
      deliveryTime: "25-35 min",
      image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400",
      bannerImage: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1200",
      featured: true
    },
    {
      id: "r3",
      name: "Fire & Crust Pizzeria",
      cuisine: "Neapolitan Pizza, Italian",
      rating: 4.7,
      deliveryTime: "20-30 min",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=400",
      bannerImage: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1200",
      featured: false
    },
    {
      id: "r4",
      name: "The Sizzling Grill",
      cuisine: "Steaks, BBQ, Burgers",
      rating: 4.6,
      deliveryTime: "30-40 min",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400",
      bannerImage: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200",
      featured: false
    }
  ],
  menuItems: [
    // The Green Bistro (r1)
    {
      id: "m1",
      restaurantId: "r1",
      name: "Harvest Avocado Salad",
      description: "Crisp romaine, fresh avocado slices, cherry tomatoes, cucumbers, toasted almonds with citrus vinaigrette.",
      price: 14.50,
      category: "Veg",
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m2",
      restaurantId: "r1",
      name: "Quinoa Protein Bowl",
      description: "Organic warm quinoa, roasted sweet potatoes, boiled egg, steamed broccoli, and rich tahini dressing.",
      price: 15.90,
      category: "Veg",
      imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m3",
      restaurantId: "r1",
      name: "Chilled Garden Gazpacho",
      description: "Traditional Spanish cold soup made with fresh blended vine-ripened tomatoes, peppers, and garlic.",
      price: 9.00,
      category: "Veg",
      imageUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    // Ninja Sushi (r2)
    {
      id: "m4",
      restaurantId: "r2",
      name: "Premium Salmon Sashimi",
      description: "Five delicate slices of fresh Atlantic salmon, served with traditional pickled ginger and fresh wasabi.",
      price: 18.00,
      category: "Non-Veg",
      imageUrl: "https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m5",
      restaurantId: "r2",
      name: "Tonkotsu Master Ramen",
      description: "Rich, creamy 16-hour pork bone broth, tender chashu pork, soft-boiled soy egg, bamboo shoots, and nori.",
      price: 16.50,
      category: "Non-Veg",
      imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m6",
      restaurantId: "r2",
      name: "Matcha Lava Cake",
      description: "Warm-centered green tea molten cake, served with a scoop of premium vanilla bean gelato.",
      price: 8.50,
      category: "Desserts",
      imageUrl: "https://images.unsplash.com/photo-1536680465769-2365207b035e?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    // Fire & Crust Pizzeria (r3)
    {
      id: "m7",
      restaurantId: "r3",
      name: "Margherita Extra Quality",
      description: "San Marzano tomatoes, fresh buffalo mozzarella, aromatic basil leaves, and high-quality extra virgin olive oil.",
      price: 13.90,
      category: "Veg",
      imageUrl: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m8",
      restaurantId: "r3",
      name: "Diavola Hot Pizza",
      description: "Spicy Italian salami, nduja, crushed red chilies, fresh mozzarella, and homemade tomato sauce.",
      price: 15.50,
      category: "Non-Veg",
      imageUrl: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m9",
      restaurantId: "r3",
      name: "Crisp Garlic Herb Focaccia",
      description: "Baked pizza bread flavored with sea salt, fresh rosemary, aromatic garlic oil, and grated parmesan.",
      price: 7.00,
      category: "Fast Food",
      imageUrl: "https://images.unsplash.com/photo-1579523535940-bf7ca4fbb27b?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    // The Sizzling Grill (r4)
    {
      id: "m10",
      restaurantId: "r4",
      name: "Classic Steakhouse Hamburger",
      description: "Premium black angus beef patty, cheddar, smoky house sauce, brioche bun, served with gold rustic fries.",
      price: 16.00,
      category: "Fast Food",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m11",
      restaurantId: "r4",
      name: "Honey Chipotle BBQ Ribs",
      description: "Slow-roasted baby back ribs glazed in a rich, sweet, and moderately spicy chipotle barbecue sauce.",
      price: 24.00,
      category: "Non-Veg",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    },
    {
      id: "m12",
      restaurantId: "r4",
      name: "Craft Lemon-Lime Elixir",
      description: "House-crafted cold-pressed sparkling soda infused with raw honey, fresh lime, mint, and a hint of ginger.",
      price: 5.50,
      category: "Beverages",
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400",
      isAvailable: true
    }
  ],
  orders: [
    {
      id: "o1",
      userId: "u2",
      userName: "Jane Doe",
      restaurantId: "r1",
      restaurantName: "The Green Bistro",
      items: [
        {
          menuItemId: "m1",
          name: "Harvest Avocado Salad",
          price: 14.50,
          quantity: 2
        },
        {
          menuItemId: "m3",
          name: "Chilled Garden Gazpacho",
          price: 9.00,
          quantity: 1
        }
      ],
      totalAmount: 38.00,
      status: "Delivered",
      deliveryAddress: "42 Serene Meadows, Green Valley",
      phone: "+1 (555) 014-9988",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: "o2",
      userId: "u2",
      userName: "Jane Doe",
      restaurantId: "r2",
      restaurantName: "Ninja Sushi & Ramen",
      items: [
        {
          menuItemId: "m5",
          name: "Tonkotsu Master Ramen",
          price: 16.50,
          quantity: 1
        }
      ],
      totalAmount: 16.50,
      status: "Preparing",
      deliveryAddress: "42 Serene Meadows, Green Valley",
      phone: "+1 (555) 014-9988",
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 mins ago
    }
  ]
};

// Database helper functions
export class DB {
  private static data: DatabaseSchema = INITIAL_DATA;

  static init() {
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, "utf8");
        this.data = JSON.parse(fileContent);
        
        // Backfill missing statusTimelines for existing records
        let updated = false;
        this.data.orders = this.data.orders.map((order) => {
          if (!order.statusTimeline || order.statusTimeline.length === 0) {
            order.statusTimeline = this.generateTimelineForOrder(order);
            updated = true;
          }
          return order;
        });
        if (updated) {
          this.save();
        }
        console.log("Database successfully loaded from persistent file.");
      } else {
        // Pre-populate initial orders with full timeline
        this.data.orders = this.data.orders.map((order) => {
          order.statusTimeline = this.generateTimelineForOrder(order);
          return order;
        });
        this.save();
        console.log("Database initialized with default schema.");
      }
    } catch (err) {
      console.error("Error reading database file, using default data:", err);
      this.data = INITIAL_DATA;
    }
  }

  private static generateTimelineForOrder(order: Order): { status: Order["status"]; timestamp: string }[] {
    const timeline: { status: Order["status"]; timestamp: string }[] = [];
    const baseTime = new Date(order.createdAt).getTime();

    // All orders start at Placed
    timeline.push({ status: "Placed", timestamp: new Date(baseTime).toISOString() });

    // Safely staggered timelines for populated seed data
    if (order.status === "Preparing" || order.status === "Out for Delivery" || order.status === "Delivered") {
      timeline.push({ status: "Preparing", timestamp: new Date(baseTime + 4 * 60 * 1000).toISOString() });
    }
    if (order.status === "Out for Delivery" || order.status === "Delivered") {
      timeline.push({ status: "Out for Delivery", timestamp: new Date(baseTime + 18 * 60 * 1000).toISOString() });
    }
    if (order.status === "Delivered") {
      timeline.push({ status: "Delivered", timestamp: new Date(baseTime + 32 * 60 * 1000).toISOString() });
    }

    return timeline;
  }

  private static save() {
    try {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(this.data, null, 2), "utf8");
    } catch (err) {
      console.error("Error writing to database file:", err);
    }
  }

  // Users
  static getUsers(): User[] {
    return this.data.users;
  }

  static getUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  static getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  static addUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  static updateUser(id: string, updates: Partial<Omit<User, "id" | "role" | "email">>): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // Restaurants
  static getRestaurants(): Restaurant[] {
    return this.data.restaurants;
  }

  static getRestaurantById(id: string): Restaurant | undefined {
    return this.data.restaurants.find((r) => r.id === id);
  }

  // Menu Items
  static getMenuItems(): MenuItem[] {
    return this.data.menuItems;
  }

  static getMenuItemsByRestaurant(restaurantId: string): MenuItem[] {
    return this.data.menuItems.filter((item) => item.restaurantId === restaurantId);
  }

  static getMenuItemById(id: string): MenuItem | undefined {
    return this.data.menuItems.find((item) => item.id === id);
  }

  static addMenuItem(item: MenuItem): MenuItem {
    this.data.menuItems.push(item);
    this.save();
    return item;
  }

  static updateMenuItem(id: string, updates: Partial<Omit<MenuItem, "id" | "restaurantId">>): MenuItem | undefined {
    const item = this.getMenuItemById(id);
    if (!item) return undefined;
    Object.assign(item, updates);
    this.save();
    return item;
  }

  static deleteMenuItem(id: string): boolean {
    const index = this.data.menuItems.findIndex((item) => item.id === id);
    if (index === -1) return false;
    this.data.menuItems.splice(index, 1);
    this.save();
    return true;
  }

  // Orders
  static getOrders(): Order[] {
    return this.data.orders;
  }

  static getOrdersByUserId(userId: string): Order[] {
    return this.data.orders.filter((order) => order.userId === userId);
  }

  static getOrderById(id: string): Order | undefined {
    return this.data.orders.find((order) => order.id === id);
  }

  static addOrder(order: Order): Order {
    if (!order.statusTimeline) {
      order.statusTimeline = [{ status: "Placed", timestamp: order.createdAt || new Date().toISOString() }];
    }
    this.data.orders.push(order);
    this.save();
    return order;
  }

  static updateOrderStatus(id: string, status: Order["status"]): Order | undefined {
    const order = this.getOrderById(id);
    if (!order) return undefined;
    
    // Update main status
    order.status = status;
    
    // Ensure timeline is initialized
    if (!order.statusTimeline) {
      order.statusTimeline = [{ status: "Placed", timestamp: order.createdAt }];
    }
    
    // Check if status already in timeline to avoid duplicating if admin repeatedly sets status
    const alreadyLogged = order.statusTimeline.some((t) => t.status === status);
    if (!alreadyLogged) {
      order.statusTimeline.push({
        status,
        timestamp: new Date().toISOString()
      });
    }
    
    this.save();
    return order;
  }
}
