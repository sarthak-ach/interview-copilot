package com.interviewcopilot.auth;

import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4000"})
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Email is already in use"
            ));
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(savedUser.getEmail());
        String refreshToken = jwtService.generateRefreshToken(savedUser.getEmail());

        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "access_token", accessToken,
                "refresh_token", refreshToken,
                "email", savedUser.getEmail(),
                "fullName", savedUser.getFullName()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Invalid email or password"
            ));
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "error", "Invalid email or password"
            ));
        }

        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        return ResponseEntity.ok(Map.of(
                "access_token", accessToken,
                "refresh_token", refreshToken,
                "email", user.getEmail(),
                "fullName", user.getFullName()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestParam String refreshToken) {
        try {
            String email = jwtService.extractEmail(refreshToken);
            if (email != null && !jwtService.isTokenExpired(refreshToken)) {
                String newAccessToken = jwtService.generateAccessToken(email);
                return ResponseEntity.ok(Map.of(
                        "access_token", newAccessToken
                ));
            }
        } catch (Exception e) {
            // Token parsing or validation failed
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "error", "Invalid or expired refresh token"
        ));
    }

    public static class RegisterRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String fullName;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }

    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
