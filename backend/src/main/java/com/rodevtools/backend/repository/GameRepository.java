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

    Page<Game> findByGameNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Game> findByCategory(String category, Pageable pageable);

    Page<Game> findByGameNameContainingIgnoreCaseAndCategory(String name, String category, Pageable pageable);


    @Query(value = "SELECT universeId, name, currentCcu, pastCcu, growthRate, creatorName, healthScore FROM (" +
            "    SELECT g.universe_id AS universeId, " +
            "           g.name AS name, " +
            "           g.playing AS currentCcu, " +
            "           gs.playing AS pastCcu, " +
            "           ((g.playing - gs.playing) * 100.0 / NULLIF(gs.playing, 0)) AS growthRate, " +
            "           g.creator_name AS creatorName, " +
            "           g.rating AS healthScore " +
            "    FROM games g " +
            "    LEFT JOIN LATERAL (" +
            "        SELECT gs.playing " +
            "        FROM game_snapshots gs " +
            "        WHERE gs.universe_id = g.universe_id " +
            "          AND gs.timestamp >= :sinceTime " +
            "        ORDER BY gs.timestamp ASC " +
            "        LIMIT 1" +
            "    ) gs ON TRUE " +
            "    WHERE g.playing >= :minPlaying AND g.playing <= :maxPlaying " +
            "      AND (:search IS NULL OR :search = '' OR LOWER(g.name) LIKE LOWER(CONCAT('%', :search, '%')))" +
            ") t",
            countQuery = "SELECT count(*) FROM games g WHERE g.playing >= :minPlaying AND g.playing <= :maxPlaying " +
                    "AND (:search IS NULL OR :search = '' OR LOWER(g.name) LIKE LOWER(CONCAT('%', :search, '%')))",
            nativeQuery = true)
    Page<RisingStarProjection> findRisingStarsNative(
            @Param("minPlaying") Long minPlaying,
            @Param("maxPlaying") Long maxPlaying,
            @Param("sinceTime") Instant sinceTime,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT g.universeId FROM Game g WHERE g.lastSyncedAt IS NULL OR g.lastSyncedAt < :cutoff ORDER BY g.lastSyncedAt ASC")
    List<Long> findGamesToSync(@Param("cutoff") Instant cutoff, org.springframework.data.domain.Pageable pageable);
}
