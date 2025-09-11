package com.utilityzone.repository;

import com.utilityzone.model.Blog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BlogRepository extends JpaRepository<Blog, Long> {
    List<Blog> findAllByOrderByPublishDateDesc();
}
