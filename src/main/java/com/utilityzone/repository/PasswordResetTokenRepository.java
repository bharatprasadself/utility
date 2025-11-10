package com.utilityzone.repository;

import com.utilityzone.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByTokenHashAndUsedFalse(String tokenHash);
    long deleteByExpiresAtBefore(Instant cutoff);
}