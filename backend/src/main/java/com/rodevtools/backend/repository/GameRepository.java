package com.rodevtools.backend.repository;

import com.rodevtools.backend.model.Game;
import com.rodevtools.backend.repository.projection.RisingStarProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    @Query("SELECT g.universeId FROM Game g")
    java.util.Set<Long> findAllUniverseIds();

    // Paginated query methods
    Page<Game> findByGameNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Game> findByCategory(String category, Pageable pageable);

    Page<Game> findByGameNameContainingIgnoreCaseAndCategory(String name, String category, Pageable pageable);


    @Query(value = "SELECT g.universe_id as universeId, g.name as name, g.playing as currentCcu, gs.playing as pastCcu, " +
            "((g.playing - gs.playing) * 100.0 / NULLIF(gs.playing, 0)) as growthRate, g.creator_name as creatorName, " +
            "g.rating as healthScore " +
            "FROM games g " +
            "LEFT JOIN LATERAL (" +
            "    SELECT gs.playing " +
            "    FROM game_snapshots gs " +
            "    WHERE gs.universe_id = g.universe_id " +
            "      AND gs.timestamp >= :sinceTime " +
            "    ORDER BY gs.timestamp ASC " +
            "    LIMIT 1" +
            ") gs ON TRUE " +
            "WHERE g.playing >= :minPlaying AND g.playing <= :maxPlaying " +
            "ORDER BY growthRate DESC NULLS LAST", nativeQuery = true)
    List<RisingStarProjection> findRisingStarsNative(
            @Param("minPlaying") Long minPlaying,
            @Param("maxPlaying") Long maxPlaying,
            @Param("sinceTime") LocalDateTime sinceTime
    );

    @Query("SELECT g.universeId FROM Game g WHERE g.lastSyncedAt IS NULL OR g.lastSyncedAt < :cutoff ORDER BY g.lastSyncedAt ASC")
    List<Long> findGamesToSync(@Param("cutoff") Instant cutoff, org.springframework.data.domain.Pageable pageable);
}
