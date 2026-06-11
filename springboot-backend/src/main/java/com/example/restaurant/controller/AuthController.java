package com.example.restaurant.controller;

import com.example.restaurant.dto.AuthDto.*;
import com.example.restaurant.model.User;
import com.example.restaurant.repository.UserRepository;
import com.example.restaurant.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/auth")
@CrossOrigin
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    // POST /api/auth/signup
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (request.getEmail() == null || request.getPassword() == null || request.getName() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email, password and name are required"));
        }

        String emailNormalized = request.getEmail().toLowerCase().trim();
        if (userRepository.findByEmail(emailNormalized).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email already exists in system"));
        }

        String userId = "u_" + UUID.randomUUID().toString().substring(0, 8);
        String pwHash = passwordEncoder.encode(request.getPassword());
        String finalRole = "admin".equalsIgnoreCase(request.getRole()) ? "admin" : "customer";

        User newUser = User.builder()
                .id(userId)
                .email(emailNormalized)
                .passwordHash(pwHash)
                .name(request.getName())
                .role(finalRole)
                .address(request.getAddress() != null ? request.getAddress() : "")
                .phone(request.getPhone() != null ? request.getPhone() : "")
                .createdAt(java.time.Instant.now().toString())
                .build();

        userRepository.save(newUser);

        String jwt = jwtUtils.generateToken(newUser.getId(), newUser.getEmail(), newUser.getRole());

        UserResponse userResponse = UserResponse.builder()
                .id(newUser.getId())
                .email(newUser.getEmail())
                .name(newUser.getName())
                .role(newUser.getRole())
                .address(newUser.getAddress())
                .phone(newUser.getPhone())
                .build();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(LoginResponse.builder()
                        .token(jwt)
                        .user(userResponse)
                        .build());
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Email and password are required"));
        }

        String emailNormalized = request.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(emailNormalized);

        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid credentials"));
        }

        User user = userOpt.get();
        String jwt = jwtUtils.generateToken(user.getId(), user.getEmail(), user.getRole());

        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .address(user.getAddress())
                .phone(user.getPhone())
                .build();

        return ResponseEntity.ok(
                LoginResponse.builder()
                        .token(jwt)
                        .user(userResponse)
                        .build());
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<?> getProfile() {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUserId == null || "anonymousUser".equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User session not found"));
        }

        User user = userOpt.get();
        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .address(user.getAddress())
                .phone(user.getPhone())
                .build();

        return ResponseEntity.ok(response);
    }

    // PUT /api/auth/profile
    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody ProfileUpdateRequest request) {
        String currentUserId = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (currentUserId == null || "anonymousUser".equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        Optional<User> userOpt = userRepository.findById(currentUserId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User profile not found"));
        }

        User user = userOpt.get();
        if (request.getName() != null) user.setName(request.getName());
        if (request.getAddress() != null) user.setAddress(request.getAddress());
        if (request.getPhone() != null) user.setPhone(request.getPhone());

        userRepository.save(user);

        UserResponse response = UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .address(user.getAddress())
                .phone(user.getPhone())
                .build();

        return ResponseEntity.ok(response);
    }
}
