package com.utilityzone.payload.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UpdateEmailRequest {
    @NotBlank
    @Email(message = "Invalid email address")
    private String email;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
