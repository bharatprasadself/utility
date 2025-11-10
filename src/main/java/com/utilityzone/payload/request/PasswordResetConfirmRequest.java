package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PasswordResetConfirmRequest {
    @NotBlank
    private String token;

    @NotBlank
    @Size(min = 8, max = 40, message = "Password must be at least 8 characters")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$",
            message = "Password must include upper, lower, digit and symbol")
    private String newPassword;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}