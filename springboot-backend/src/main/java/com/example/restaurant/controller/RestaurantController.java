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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/restaurants")
@CrossOrigin
public class RestaurantController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    // GET /api/restaurants
    @GetMapping
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    // GET /api/restaurants/{id}/menu
    @GetMapping("/{id}/menu")
    public ResponseEntity<?> getRestaurantMenu(@PathVariable String id) {
        Optional<Restaurant> restaurantOpt = restaurantRepository.findById(id);
        if (restaurantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Restaurant not found"));
        }

        List<MenuItem> items = menuItemRepository.findByRestaurantId(id);

        Map<String, Object> response = new HashMap<>();
        response.put("restaurant", restaurantOpt.get());
        response.put("menuItems", items);

        return ResponseEntity.ok(response);
    }

    // POST /api/restaurants (Admin Only)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addRestaurant(@RequestBody Restaurant request) {
        if (request.getName() == null || request.getCuisine() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Eatery Name and Cuisine are required fields"));
        }

        String restaurantId = "r_" + UUID.randomUUID().toString().substring(0, 7);
        Restaurant newRestaurant = Restaurant.builder()
                .id(restaurantId)
                .name(request.getName())
                .cuisine(request.getCuisine())
                .rating(request.getRating() != null ? request.getRating() : 4.5)
                .deliveryTime(request.getDeliveryTime() != null ? request.getDeliveryTime() : "25-35 mins")
                .image(request.getImage() != null && !request.getImage().trim().isEmpty() 
                        ? request.getImage() 
                        : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400")
                .bannerImage(request.getBannerImage() != null && !request.getBannerImage().trim().isEmpty() 
                        ? request.getBannerImage() 
                        : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200")
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .build();

        restaurantRepository.save(newRestaurant);
        return ResponseEntity.status(HttpStatus.CREATED).body(newRestaurant);
    }

    // PUT /api/restaurants/{id} (Admin Only)
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateRestaurant(@PathVariable String id, @RequestBody Restaurant request) {
        Optional<Restaurant> restOpt = restaurantRepository.findById(id);
        if (restOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Eatery listing not found"));
        }

        Restaurant ex = restOpt.get();
        if (request.getName() != null) ex.setName(request.getName());
        if (request.getCuisine() != null) ex.setCuisine(request.getCuisine());
        if (request.getRating() != null) ex.setRating(request.getRating());
        if (request.getDeliveryTime() != null) ex.setDeliveryTime(request.getDeliveryTime());
        if (request.getImage() != null) ex.setImage(request.getImage());
        if (request.getBannerImage() != null) ex.setBannerImage(request.getBannerImage());
        if (request.getFeatured() != null) ex.setFeatured(request.getFeatured());

        restaurantRepository.save(ex);
        return ResponseEntity.ok(ex);
    }

    // DELETE /api/restaurants/{id} (Admin Only)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteRestaurant(@PathVariable String id) {
        Optional<Restaurant> restOpt = restaurantRepository.findById(id);
        if (restOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Eatery listing not found"));
        }

        restaurantRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Eatery decommissioned successfully"));
    }
}
