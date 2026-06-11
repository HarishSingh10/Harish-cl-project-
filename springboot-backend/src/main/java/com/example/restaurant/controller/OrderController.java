package com.example.restaurant.controller;

import com.example.restaurant.dto.OrderDto.*;
import com.example.restaurant.model.*;
import com.example.restaurant.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/orders")
@CrossOrigin
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    // POST /api/orders
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUserId == null || "anonymousUser".equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        if (request.getRestaurantId() == null || request.getItems() == null || request.getItems().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Restaurant and order items are required"));
        }

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(request.getRestaurantId());
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Restaurant not found"));
        }

        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User profile not found"));
        }

        User user = userOpt.get();
        Restaurant restaurant = restaurantOpt.get();

        List<OrderItem> parsedItems = new ArrayList<>();
        double calculatedAmount = 0.0;

        for (OrderItemRequest reqItem : request.getItems()) {
            Optional<MenuItem> menuItemOpt = menuItemRepository.findById(reqItem.getMenuItemId());
            if (menuItemOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Menu item with id " + reqItem.getMenuItemId() + " doesn't exist"));
            }

            MenuItem menuItem = menuItemOpt.get();
            if (!menuItem.getRestaurantId().equals(restaurant.getId())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Menu item " + menuItem.getName() + " does not belong to selected restaurant"));
            }

            int quantity = reqItem.getQuantity() != null ? Math.max(1, reqItem.getQuantity()) : 1;
            parsedItems.add(OrderItem.builder()
                    .menuItemId(menuItem.getId())
                    .name(menuItem.getName())
                    .price(menuItem.getPrice())
                    .quantity(quantity)
                    .build());

            calculatedAmount += menuItem.price * quantity;
        }

        String orderId = "ORD_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String tsNow = Instant.now().toString();

        List<StatusTimelineEntry> initialTimeline = new ArrayList<>();
        initialTimeline.add(StatusTimelineEntry.builder()
                .status("Placed")
                .timestamp(tsNow)
                .build());

        Order newOrder = Order.builder()
                .id(orderId)
                .userId(user.getId())
                .userName(user.getName())
                .restaurantId(restaurant.getId())
                .restaurantName(restaurant.getName())
                .items(parsedItems)
                .totalAmount(calculatedAmount)
                .status("Placed")
                .deliveryAddress(request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isEmpty() 
                        ? request.getDeliveryAddress() 
                        : (user.getAddress() != null && !user.getAddress().trim().isEmpty() ? user.getAddress() : "Pending custom delivery address input"))
                .phone(request.getPhone() != null && !request.getPhone().trim().isEmpty() 
                        ? request.getPhone() 
                        : (user.getPhone() != null && !user.getPhone().trim().isEmpty() ? user.getPhone() : "No phone added"))
                .createdAt(tsNow)
                .statusTimeline(initialTimeline)
                .build();

        orderRepository.save(newOrder);
        return ResponseEntity.status(HttpStatus.CREATED).body(newOrder);
    }

    // GET /api/orders
    @GetMapping
    public ResponseEntity<?> getOrders() {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User profile not found"));
        }

        User user = userOpt.get();
        List<Order> orders;

        if ("admin".equals(user.getRole())) {
            orders = orderRepository.findAll();
        } else {
            orders = orderRepository.findByUserId(user.getId());
        }

        // Sort by createdAt descending
        orders.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        return ResponseEntity.ok(orders);
    }

    // GET /api/orders/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable String id) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User profile not found"));
        }

        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Order not found"));
        }

        Order order = orderOpt.get();
        User user = userOpt.get();

        if (!"admin".equals(user.getRole()) && !order.getUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Forbidden access to this resource"));
        }

        return ResponseEntity.ok(order);
    }

    // PUT /api/orders/{id}/status (Admin Only)
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable String id, @RequestBody StatusUpdateRequest statusRequest) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty() || !"admin".equals(userOpt.get().getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin privilege required"));
        }

        String newStatus = statusRequest.getStatus();
        List<String> validStatuses = Arrays.asList("Placed", "Preparing", "Out for Delivery", "Delivered");
        if (newStatus == null || !validStatuses.contains(newStatus)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid status value provided"));
        }

        Optional<Order> orderOpt = orderRepository.findById(id);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Order not found"));
        }

        Order order = orderOpt.get();
        order.setStatus(newStatus);

        // Append to timeline if there is no pre-existing match for this status step
        boolean alreadyExists = order.getStatusTimeline().stream()
                .anyMatch(entry -> entry.getStatus().equals(newStatus));

        if (!alreadyExists) {
            order.getStatusTimeline().add(StatusTimelineEntry.builder()
                    .status(newStatus)
                    .timestamp(Instant.now().toString())
                    .build());
        }

        orderRepository.save(order);
        return ResponseEntity.ok(order);
    }
}
