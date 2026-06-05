package com.interviewcopilot.auth;

import com.interviewcopilot.users.User;
import com.interviewcopilot.users.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4000"})
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${google.client-id}")
    private String googleClientId;

    @Value("${google.allow-mock-login:true}")
    private boolean allowMockLogin;

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
        user.setAuthProvider("LOCAL");

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
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
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

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        String email = null;
        String fullName = null;

        if (Boolean.TRUE.equals(request.getIsMock()) || (request.getCredential() != null && request.getCredential().startsWith("mock_"))) {
            if (!allowMockLogin) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "error", "Mock Google login is disabled in this environment"
                ));
            }
            email = request.getEmail();
            fullName = request.getFullName();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "Mock email is required"
                ));
            }
            if (fullName == null || fullName.trim().isEmpty()) {
                fullName = email.split("@")[0];
            }
        } else {
            try {
                GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                        .setAudience(Collections.singletonList(googleClientId))
                        .build();

                GoogleIdToken idToken = verifier.verify(request.getCredential());
                if (idToken == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                            "error", "Invalid Google ID token"
                    ));
                }

                Payload payload = idToken.getPayload();
                if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                            "error", "Google email is not verified"
                    ));
                }

                email = payload.getEmail();
                fullName = (String) payload.get("name");
                if (fullName == null) {
                    fullName = (String) payload.get("given_name");
                }
                if (fullName == null) {
                    fullName = email.split("@")[0];
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                        "error", "Failed to verify Google ID token: " + e.getMessage()
                ));
            }
        }

        // Query or create the user
        Optional<User> userOpt = userRepository.findByEmail(email);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
        } else {
            user = new User();
            user.setEmail(email);
            user.setFullName(fullName);
            user.setAuthProvider("GOOGLE");
            user.setPasswordHash(null);
            user = userRepository.save(user);
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

    public static class GoogleLoginRequest {
        private String credential;
        private Boolean isMock;
        private String email;
        private String fullName;

        public String getCredential() { return credential; }
        public void setCredential(String credential) { this.credential = credential; }

        public Boolean getIsMock() { return isMock; }
        public void setIsMock(Boolean isMock) { this.isMock = isMock; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
    }
}
