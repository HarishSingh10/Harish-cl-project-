package com.example.restaurant.controller;

import com.example.restaurant.model.*;
import com.example.restaurant.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/dashboard")
@CrossOrigin
public class DashboardController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            Optional<User> currentUserOpt = userRepository.findById(currentUserId);
            if (currentUserOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User profile not found"));
            }

            User currentUser = currentUserOpt.get();
            List<Order> allOrders = orderRepository.findAll();
            List<MenuItem> allMenuItems = menuItemRepository.findAll();

            // 1. Total orders count
            long totalOrdersCount = allOrders.size();

            // 2. Revenue tracking (Exclude Placed for conservative tracking, matching NodeJS)
            double totalSimulatedRevenue = allOrders.stream()
                    .filter(o -> !"Placed".equals(o.getStatus()))
                    .mapToDouble(Order::getTotalAmount)
                    .sum();

            // 3. Popular food items calculation
            Map<String, PopularItemAcc> popularItemsMap = new HashMap<>();
            for (Order o : allOrders) {
                for (OrderItem item : o.getItems()) {
                    popularItemsMap.computeIfAbsent(item.getMenuItemId(), k -> new PopularItemAcc(item.getName()))
                            .add(item.getQuantity(), item.getPrice() * item.getQuantity());
                }
            }

            List<Map<String, Object>> popularFoodItems = new ArrayList<>();
            popularItemsMap.entrySet().stream()
                    .sorted((e1, e2) -> Integer.compare(e2.getValue().count, e1.getValue().count))
                    .limit(5)
                    .forEach(entry -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("menuItemId", entry.getKey());
                        map.put("name", entry.getValue().name);
                        map.put("orderCount", entry.getValue().count);
                        map.put("revenueGenerated", Math.round(entry.getValue().revenue * 100.0) / 100.0);
                        popularFoodItems.add(map);
                    });

            // 4. User Order Activity (Contextual User Specific vs Admin List)
            List<Map<String, Object>> userOrderActivity = new ArrayList<>();
            if ("admin".equals(currentUser.getRole())) {
                Map<String, UserActivityAcc> userMap = new HashMap<>();
                for (Order o : allOrders) {
                    userMap.computeIfAbsent(o.getUserId(), k -> new UserActivityAcc(o.getUserName()))
                            .addOrder(o.getTotalAmount());
                }
                userMap.forEach((uId, acc) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId", uId);
                    map.put("userName", acc.name);
                    map.put("ordersCount", acc.count);
                    map.put("totalSpent", Math.round(acc.spent * 100.0) / 100.0);
                    userOrderActivity.add(map);
                });
            } else {
                List<Order> myOrders = orderRepository.findByUserId(currentUser.getId());
                for (Order o : myOrders) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("orderId", o.getId());
                    map.put("restaurantName", o.getRestaurantName());
                    map.put("amount", o.getTotalAmount());
                    map.put("status", o.getStatus());
                    map.put("date", o.getCreatedAt());
                    userOrderActivity.add(map);
                }
            }

            // 5. Category Stats breaking down revenue by categories
            Map<String, Double> categoryRevenueMap = new HashMap<>();
            categoryRevenueMap.put("Veg", 0.0);
            categoryRevenueMap.put("Non-Veg", 0.0);
            categoryRevenueMap.put("Fast Food", 0.0);
            categoryRevenueMap.put("Desserts", 0.0);
            categoryRevenueMap.put("Beverages", 0.0);

            // Fetch list menu mapping
            Map<String, String> itemToCategory = new HashMap<>();
            for (MenuItem mi : allMenuItems) {
                itemToCategory.put(mi.getId(), mi.getCategory());
            }

            for (Order o : allOrders) {
                for (OrderItem item : o.getItems()) {
                    String category = itemToCategory.getOrDefault(item.getMenuItemId(), "Fast Food");
                    double itemPriceSum = item.getPrice() * item.getQuantity();
                    categoryRevenueMap.put(category, categoryRevenueMap.getOrDefault(category, 0.0) + itemPriceSum);
                }
            }

            List<Map<String, Object>> categoryStats = new ArrayList<>();
            categoryRevenueMap.forEach((cat, val) -> {
                Map<String, Object> map = new HashMap<>();
                map.put("name", cat);
                map.put("value", Math.round(val * 100.0) / 100.0);
                categoryStats.add(map);
            });

            // Return bundled payload
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalOrdersCount", totalOrdersCount);
            stats.put("totalSimulatedRevenue", Math.round(totalSimulatedRevenue * 100.0) / 100.0);
            stats.put("popularFoodItems", popularFoodItems);
            stats.put("userOrderActivity", userOrderActivity);
            stats.put("categoryStats", categoryStats);

            return ResponseEntity.ok(stats);

        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate system-wide dashboard stats"));
        }
    }

    private static class PopularItemAcc {
        String name;
        int count = 0;
        double revenue = 0.0;

        PopularItemAcc(String name) {
            this.name = name;
        }

        void add(int qty, double rev) {
            this.count += qty;
            this.revenue += rev;
        }
    }

    private static class UserActivityAcc {
        String name;
        int count = 0;
        double spent = 0.0;

        UserActivityAcc(String name) {
            this.name = name;
        }

        void addOrder(double amt) {
            this.count++;
            this.spent += amt;
        }
    }
}
