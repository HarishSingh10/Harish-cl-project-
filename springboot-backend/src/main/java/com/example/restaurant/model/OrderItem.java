package com.example.restaurant.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {
    private String menuItemId;
    private String name;
    private Double price;
    private Integer quantity;
}
