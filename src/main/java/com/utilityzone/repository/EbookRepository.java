package com.utilityzone.repository;

import com.utilityzone.model.EbookEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EbookRepository extends JpaRepository<EbookEntity, Long> {
    List<EbookEntity> findAllByStatus(String status);
}
