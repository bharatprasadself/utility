package com.utilityzone.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class PasswordResetRequest {
    @NotBlank
    @Email(message = "Invalid email")
    private String email;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}