package com.example.restaurant;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.model.User;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.RestaurantRepository;
import com.example.restaurant.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedUsers();
        seedData();
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            // Seed Admin User
            User admin = User.builder()
                    .id("u_admin")
                    .email("admin@artisan.com")
                    .passwordHash(passwordEncoder.encode("Password123"))
                    .name("Admin Executive Chef")
                    .role("admin")
                    .address("101 Culinary Boulevard, Suite A")
                    .phone("+1 (555) 019-2831")
                    .createdAt(java.time.Instant.now().toString())
                    .build();

            // Seed regular customer User
            User customer = User.builder()
                    .id("u_cust")
                    .email("customer@artisan.com")
                    .passwordHash(passwordEncoder.encode("Password123"))
                    .name("Alexis Artisan")
                    .role("customer")
                    .address("404 Baker Street, Apartment 3B")
                    .phone("+1 (555) 014-9842")
                    .createdAt(java.time.Instant.now().toString())
                    .build();

            userRepository.saveAll(Arrays.asList(admin, customer));
            System.out.println(">>> Seeded administrative and standard customer credentials into H2 Database.");
        }
    }

    private void seedData() {
        if (restaurantRepository.count() == 0) {
            // Seed Restaurants
            Restaurant r1 = Restaurant.builder()
                    .id("r_1")
                    .name("The Bistro Hearth")
                    .cuisine("French Gastronomy")
                    .rating(4.8)
                    .deliveryTime("30-40 mins")
                    .image("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400")
                    .bannerImage("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200")
                    .featured(true)
                    .build();

            Restaurant r2 = Restaurant.builder()
                    .id("r_2")
                    .name("Le Saffron Oasis")
                    .cuisine("Authentic Indian")
                    .rating(4.6)
                    .deliveryTime("20-30 mins")
                    .image("https://images.unsplash.com/photo-1585938338392-50a59970d8ee?auto=format&fit=crop&q=80&w=400")
                    .bannerImage("https://images.unsplash.com/photo-1585938338392-50a59970d8ee?auto=format&fit=crop&q=80&w=1200")
                    .featured(true)
                    .build();

            Restaurant r3 = Restaurant.builder()
                    .id("r_3")
                    .name("Sakura Delicacy")
                    .cuisine("Japanese Sushi")
                    .rating(4.9)
                    .deliveryTime("25-35 mins")
                    .image("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400")
                    .bannerImage("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1200")
                    .featured(false)
                    .build();

            restaurantRepository.saveAll(Arrays.asList(r1, r2, r3));

            // Seed Menu items for r1 (The Bistro Hearth)
            MenuItem r1_m1 = MenuItem.builder()
                    .id("m_11")
                    .restaurantId("r_1")
                    .name("Roasted Duck Gastrique")
                    .description("Slow-rendered tender duck breast drizzled with citrus orange-fig gastrique sauce.")
                    .price(28.50)
                    .category("Non-Veg")
                    .imageUrl("https://images.unsplash.com/photo-1514516345957-556ca7d90a29?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            MenuItem r1_m2 = MenuItem.builder()
                    .id("m_12")
                    .restaurantId("r_1")
                    .name("Truffle Pommes Frites")
                    .description("Thin-cut crispy potatoes seasoned with white truffle essence and fresh rosemary.")
                    .price(12.00)
                    .category("Fast Food")
                    .imageUrl("https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            MenuItem r1_m3 = MenuItem.builder()
                    .id("m_13")
                    .restaurantId("r_1")
                    .name("Matcha Crème Brûlée")
                    .description("Rich stone-ground green tea custard topped with brittle caramel glass shell.")
                    .price(10.50)
                    .category("Desserts")
                    .imageUrl("https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            // Seed Menu items for r2 (Le Saffron Oasis)
            MenuItem r2_m1 = MenuItem.builder()
                    .id("m_21")
                    .restaurantId("r_2")
                    .name("Saffron Paneer Tikka")
                    .description("Indian cottage cheese tandoor skewed with green bell pepper, marinated in cream.")
                    .price(16.90)
                    .category("Veg")
                    .imageUrl("https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            MenuItem r2_m2 = MenuItem.builder()
                    .id("m_22")
                    .restaurantId("r_2")
                    .name("Artisan Ginger Mule")
                    .description("In-house brewed fresh spicy ginger root juice, lime bitters, and carbonated seltzer.")
                    .price(7.00)
                    .category("Beverages")
                    .imageUrl("https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            // Seed Menu items for r3 (Sakura Delicacy)
            MenuItem r3_m1 = MenuItem.builder()
                    .id("m_31")
                    .restaurantId("r_3")
                    .name("Umami Salmon Sushi Roll")
                    .description("Roll of Atlantic salmon, avocado, spicy mayo, topped with thin slices of raw salmon.")
                    .price(19.00)
                    .category("Non-Veg")
                    .imageUrl("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=400")
                    .isAvailable(true)
                    .build();

            menuItemRepository.saveAll(Arrays.asList(r1_m1, r1_m2, r1_m3, r2_m1, r2_m2, r3_m1));
            System.out.println(">>> Culinary seed models successfully initialized in JPA H2 schema.");
        }
    }
}
