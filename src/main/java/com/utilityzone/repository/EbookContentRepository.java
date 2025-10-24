package com.utilityzone.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.utilityzone.model.EbookContentEntity;

@Repository
public interface EbookContentRepository extends JpaRepository<EbookContentEntity, Long> {
}
