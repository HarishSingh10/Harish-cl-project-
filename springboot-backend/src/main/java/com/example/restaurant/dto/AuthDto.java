package com.example.restaurant.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SignupRequest {
        private String email;
        private String password;
        private String name;
        private String address;
        private String phone;
        private String role; // "admin" | "customer"
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserResponse {
        private String id;
        private String email;
        private String name;
        private String role;
        private String address;
        private String phone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginResponse {
        private String token;
        private UserResponse user;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileUpdateRequest {
        private String name;
        private String address;
        private String phone;
    }
}
