package com.utilityzone.service;

public interface EmailService {
    void sendPasswordReset(String email, String rawToken);
}
