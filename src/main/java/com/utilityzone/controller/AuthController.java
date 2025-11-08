package com.utilityzone.controller;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.utilityzone.model.Role;
import com.utilityzone.model.RoleType;
import com.utilityzone.model.User;
import com.utilityzone.repository.RoleRepository;
import com.utilityzone.repository.UserRepository;
import com.utilityzone.security.JwtUtils;
import com.utilityzone.security.UserDetailsImpl;
import com.utilityzone.payload.request.LoginRequest;
import com.utilityzone.payload.request.SignupRequest;
import com.utilityzone.payload.response.JwtResponse;
import com.utilityzone.payload.response.MessageResponse;
import com.utilityzone.payload.request.PasswordResetRequest;
import com.utilityzone.payload.request.PasswordResetConfirmRequest;
import com.utilityzone.repository.PasswordResetTokenRepository;
import com.utilityzone.model.PasswordResetToken;
import com.utilityzone.service.EmailService;
import com.utilityzone.payload.request.UpdateEmailRequest;
import com.utilityzone.payload.request.UpdatePasswordRequest;
import com.utilityzone.payload.response.ProfileResponse;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    EmailService emailService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            System.out.println("Attempting authentication for user: " + loginRequest.getUsername());
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            System.out.println("JWT token generated successfully");

            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(item -> item.getAuthority())
                    .collect(Collectors.toList());

            JwtResponse response = new JwtResponse(jwt,
                    userDetails.getId(),
                    userDetails.getUsername(),
                    roles);
            System.out.println("Returning JWT response: " + response);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.core.userdetails.UsernameNotFoundException ex) {
            return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized",
                    "User not found",
                    "USER_NOT_FOUND"
                ));
        } catch (org.springframework.security.authentication.BadCredentialsException ex) {
            return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized",
                    "Bad credentials",
                    "BAD_CREDENTIALS"
                ));
        } catch (org.springframework.security.authentication.LockedException ex) {
            return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized",
                    "Account is locked",
                    "ACCOUNT_LOCKED"
                ));
        } catch (org.springframework.security.authentication.DisabledException ex) {
            return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized",
                    "Account is disabled",
                    "ACCOUNT_DISABLED"
                ));
        } catch (AuthenticationException e) {
            // Fallback for any other auth failures
            return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Unauthorized",
                    "Authentication failed",
                    "AUTHENTICATION_FAILED"
                ));
        }
    }

    private String generateResetToken() {
        byte[] raw = new byte[32];
        new SecureRandom().nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    @PostMapping("/password-reset/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest req) {
        // Always return OK to avoid user enumeration
        userRepository.findByEmailIgnoreCase(req.getEmail()).ifPresent(user -> {
            String rawToken = generateResetToken();
            String hash = hashToken(rawToken);
            PasswordResetToken prt = new PasswordResetToken();
            prt.setUser(user);
            prt.setTokenHash(hash);
            prt.setExpiresAt(Instant.now().plus(Duration.ofMinutes(30)));
            passwordResetTokenRepository.save(prt);
            emailService.sendPasswordReset(user.getEmail(), rawToken);
        });
        return ResponseEntity.ok(new MessageResponse("If the account exists, you will receive an email with reset instructions."));
    }

    @PostMapping("/password-reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest req) {
        String hash = hashToken(req.getToken());
        java.util.Optional<PasswordResetToken> prtOpt = passwordResetTokenRepository.findByTokenHashAndUsedFalse(hash)
                .filter(t -> t.getExpiresAt().isAfter(Instant.now()));
        if (prtOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired token"));
        }
        PasswordResetToken prt = prtOpt.get();
        User user = prt.getUser();
        user.setPassword(encoder.encode(req.getNewPassword()));
        userRepository.save(user);
        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
        return ResponseEntity.ok(new MessageResponse("Password reset successful"));
    }

    @DeleteMapping("/account")
    @SuppressWarnings("null")
    public ResponseEntity<?> deleteAccount(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(new MessageResponse("Unauthorized"));
        }
        UserDetailsImpl principal = (UserDetailsImpl) authentication.getPrincipal();
        long uid = principal.getId() != null ? principal.getId().longValue() : -1L;
        User user = userRepository.findById(Long.valueOf(uid)).orElse(null);
        if (user == null) {
        return ResponseEntity.status(HttpServletResponse.SC_NOT_FOUND)
            .body(new MessageResponse("Account not found"));
    }
        // Block deletion for admin users
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleType.ROLE_ADMIN);
        if (isAdmin) {
            return ResponseEntity.status(HttpServletResponse.SC_FORBIDDEN)
                .body(new MessageResponse("Admin accounts cannot be deleted"));
        }
        userRepository.delete(user);
    return ResponseEntity.ok(new MessageResponse("Account deleted successfully"));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByUsername(signUpRequest.getUsername())) {
            return ResponseEntity.status(HttpServletResponse.SC_BAD_REQUEST)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Bad Request",
                    "Username is already taken",
                    "USERNAME_TAKEN"
                ));
        }
        if (userRepository.existsByEmailIgnoreCase(signUpRequest.getEmail())) {
            return ResponseEntity.status(HttpServletResponse.SC_BAD_REQUEST)
                .body(new com.utilityzone.exception.ErrorResponse(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Bad Request",
                    "Email is already registered",
                    "EMAIL_TAKEN"
                ));
        }

    // Create new user account
        User user = new User();
        user.setUsername(signUpRequest.getUsername());
    user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

        Set<Role> roles = new HashSet<>();
        
        // For the first user, assign ADMIN role
        if (userRepository.count() == 0) {
            Role adminRole = roleRepository.findByName(RoleType.ROLE_ADMIN)
                    .orElseThrow(() -> new RuntimeException("Error: Admin Role is not found."));
            roles.add(adminRole);
        } else {
            Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                    .orElseThrow(() -> new RuntimeException("Error: User Role is not found."));
            roles.add(userRole);
        }

        user.setRoles(roles);
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(new MessageResponse("Unauthorized"));
        }
        UserDetailsImpl principal = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpServletResponse.SC_NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        return ResponseEntity.ok(new ProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet())));
    }

    @PutMapping("/profile/email")
    public ResponseEntity<?> updateEmail(Authentication authentication, @Valid @RequestBody UpdateEmailRequest req) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(new MessageResponse("Unauthorized"));
        }
        if (userRepository.existsByEmailIgnoreCase(req.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email already in use"));
        }
        UserDetailsImpl principal = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpServletResponse.SC_NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        user.setEmail(req.getEmail());
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Email updated successfully"));
    }

    @PutMapping("/profile/password")
    public ResponseEntity<?> updatePassword(Authentication authentication, @Valid @RequestBody UpdatePasswordRequest req) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserDetailsImpl)) {
            return ResponseEntity.status(HttpServletResponse.SC_UNAUTHORIZED)
                    .body(new MessageResponse("Unauthorized"));
        }
        UserDetailsImpl principal = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpServletResponse.SC_NOT_FOUND)
                    .body(new MessageResponse("User not found"));
        }
        // Optionally verify current password matches
        if (req.getCurrentPassword() != null && !encoder.matches(req.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpServletResponse.SC_BAD_REQUEST)
                    .body(new MessageResponse("Current password is incorrect"));
        }
        user.setPassword(encoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
    }
}
