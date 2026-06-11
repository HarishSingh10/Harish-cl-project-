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
public class StatusTimelineEntry {
    private String status; // "Placed" | "Preparing" | "Out for Delivery" | "Delivered"
    private String timestamp;
}
