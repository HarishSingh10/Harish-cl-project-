package com.example.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class OrderDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        private String menuItemId;
        private Integer quantity;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderRequest {
        private String restaurantId;
        private List<OrderItemRequest> items;
        private String deliveryAddress;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private String status; // "Placed" | "Preparing" | "Out for Delivery" | "Delivered"
    }
}
