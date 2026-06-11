package com.example.restaurant.controller;

import com.example.restaurant.model.MenuItem;
import com.example.restaurant.model.Restaurant;
import com.example.restaurant.repository.MenuItemRepository;
import com.example.restaurant.repository.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
}
