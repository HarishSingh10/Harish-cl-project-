package com.example.restaurant.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {
    @Id
    private String id;
    private String userId;
    private String userName;
    private String restaurantId;
    private String restaurantName;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_items", joinColumns = @JoinColumn(name = "order_id"))
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    private Double totalAmount;
    private String status; // "Placed" | "Preparing" | "Out for Delivery" | "Delivered"
    private String deliveryAddress;
    private String phone;
    private String createdAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "order_status_timelines", joinColumns = @JoinColumn(name = "order_id"))
    @Builder.Default
    private List<StatusTimelineEntry> statusTimeline = new ArrayList<>();
}
