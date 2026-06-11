package com.example.restaurant.controller;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/menu")
@CrossOrigin
public class MenuItemController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    // GET /api/menu
    @GetMapping
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        return ResponseEntity.ok(menuItemRepository.findAll());
    }

    // POST /api/menu (Admin Only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addMenuItem(@RequestBody MenuItem itemRequest) {
        if (itemRequest.getRestaurantId() == null || itemRequest.getName() == null ||
                itemRequest.getPrice() == null || itemRequest.getCategory() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "restaurantId, name, price, and category are required"));
        }

        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(itemRequest.getRestaurantId());
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Restaurant not found"));
        }

        String itemId = "m_" + UUID.randomUUID().toString().substring(0, 7);
        MenuItem newItem = MenuItem.builder()
                .id(itemId)
                .restaurantId(itemRequest.getRestaurantId())
                .name(itemRequest.getName())
                .description(itemRequest.getDescription() != null ? itemRequest.getDescription() : "")
                .price(itemRequest.getPrice())
                .category(itemRequest.getCategory())
                .imageUrl(itemRequest.getImageUrl() != null && !itemRequest.getImageUrl().trim().isEmpty() 
                        ? itemRequest.getImageUrl() 
                        : "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&q=80&w=400")
                .isAvailable(itemRequest.getIsAvailable() != null ? itemRequest.getIsAvailable() : true)
                .build();

        menuItemRepository.save(newItem);
        return ResponseEntity.status(HttpStatus.CREATED).body(newItem);
    }

    // PUT /api/menu/{id} (Admin Only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateMenuItem(@PathVariable String id, @RequestBody MenuItem itemRequest) {
        Optional<MenuItem> itemOpt = menuItemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Menu item not found"));
        }

        MenuItem existingItem = itemOpt.get();
        if (itemRequest.getName() != null) existingItem.setName(itemRequest.getName());
        if (itemRequest.getDescription() != null) existingItem.setDescription(itemRequest.getDescription());
        if (itemRequest.getPrice() != null) existingItem.setPrice(itemRequest.getPrice());
        if (itemRequest.getCategory() != null) existingItem.setCategory(itemRequest.getCategory());
        if (itemRequest.getImageUrl() != null) existingItem.setImageUrl(itemRequest.getImageUrl());
        if (itemRequest.getIsAvailable() != null) existingItem.setIsAvailable(itemRequest.getIsAvailable());

        menuItemRepository.save(existingItem);
        return ResponseEntity.ok(existingItem);
    }

    // DELETE /api/menu/{id} (Admin Only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteMenuItem(@PathVariable String id) {
        Optional<MenuItem> itemOpt = menuItemRepository.findById(id);
        if (itemOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Menu item not found"));
        }

        menuItemRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Menu item deleted successfully"));
    }
}
