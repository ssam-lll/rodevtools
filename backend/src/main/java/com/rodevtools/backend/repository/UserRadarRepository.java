package com.rodevtools.backend.repository;

import com.rodevtools.backend.model.UserRadar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRadarRepository extends JpaRepository<UserRadar, Long> {
    List<UserRadar> findByUserId(UUID userId);
    boolean existsByUserIdAndGameUniverseId(UUID userId, Long universeId);
    long deleteByUserIdAndGameUniverseId(UUID userId, Long universeId);
    long deleteByUserId(UUID userId);
    long deleteByUserIdAndGameUniverseIdIn(UUID userId, List<Long> universeIds);
}
