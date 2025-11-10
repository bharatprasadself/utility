package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Email;

public class SignupRequest {
    @NotBlank
    @Size(min = 6, max = 20, message = "Username must be 6-20 characters")
    @Pattern(regexp = "^[A-Za-z0-9._-]{6,20}$", message = "Username may contain letters, digits, dot, underscore and hyphen")
    private String username;
    
    @NotBlank
    @Email(message = "Invalid email address")
    private String email;

    @NotBlank
    @Size(min = 8, max = 40, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$", 
        message = "Password must include upper, lower, digit and symbol")
    private String password;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
