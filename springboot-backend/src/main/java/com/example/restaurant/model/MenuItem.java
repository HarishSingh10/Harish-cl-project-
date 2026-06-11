package com.example.restaurant.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {
    @Id
    private String id;
    private String restaurantId;
    private String name;
    private String description;
    private Double price;
    private String category; // "Veg" | "Non-Veg" | "Fast Food" | "Desserts" | "Beverages"
    private String imageUrl;
    private Boolean isAvailable;
}
