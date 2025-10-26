package com.utilityzone.service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Service
public class NewsletterTokenService {

    private final SecretKey secretKey;

    public NewsletterTokenService(@Value("${app.jwt.secret}") String secret) {
        // Ensure key length is valid for HS256
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(secret);
        } catch (IllegalArgumentException ex) {
            keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateUnsubscribeToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .addClaims(Map.of("type", "unsubscribe"))
                // Unsubscribe tokens can be long-lived; no expiration set intentionally
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String parseEmailFromToken(String token) {
        var claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        Object type = claims.get("type");
        if (type == null || !"unsubscribe".equals(type.toString())) {
            throw new IllegalArgumentException("Invalid token type");
        }
        return claims.getSubject();
    }
}
