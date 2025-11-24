package com.utilityzone.repository;

import com.utilityzone.model.AuthorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuthorDataRepository extends JpaRepository<AuthorData, Long> {
    // Optionally add custom queries here
}
