package com.example.restaurant.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "restaurants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Restaurant {
    @Id
    private String id;
    private String name;
    private String cuisine;
    private Double rating;
    private String deliveryTime;
    private String image;
    private String bannerImage;
    private Boolean featured;
}
