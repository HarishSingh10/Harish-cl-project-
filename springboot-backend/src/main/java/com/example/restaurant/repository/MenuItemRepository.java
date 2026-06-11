package com.example.restaurant.repository;

import com.example.restaurant.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, String> {
    List<MenuItem> findByRestaurantId(String restaurantId);
}
