package com.utilityzone.repository;

import com.utilityzone.model.AuthorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AuthorDataRepository extends JpaRepository<AuthorData, Long> {
    Optional<AuthorData> findByName(String name);
    Optional<AuthorData> findTopByOrderByIdAsc();
}
