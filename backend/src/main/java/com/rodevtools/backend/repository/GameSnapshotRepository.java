package com.rodevtools.backend.repository;

import com.rodevtools.backend.model.GameSnapshot;
import com.rodevtools.backend.repository.projection.DailyAnalyticsProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface GameSnapshotRepository extends JpaRepository<GameSnapshot, Long> {

    List<GameSnapshot> findByGameUniverseIdOrderBySnapshotTimestampAsc(Long universeId);

    List<GameSnapshot> findByGameUniverseIdAndSnapshotTimestampAfterOrderBySnapshotTimestampAsc(Long universeId, Instant timestamp);

    @Query(value = "SELECT date, averagePlaying, maxVisits FROM (" +
            "    SELECT d.date AS date, " +
            "           d.average_playing AS averagePlaying, " +
            "           d.max_visits AS maxVisits " +
            "    FROM game_daily_analytics d " +
            "    WHERE d.universe_id = :universeId " +
            "    UNION ALL " +
            "    SELECT CAST(g.timestamp AS date) AS date, " +
            "           CAST(ROUND(AVG(g.playing)) AS bigint) AS averagePlaying, " +
            "           MAX(g.visits) AS maxVisits " +
            "    FROM game_snapshots g " +
            "    WHERE g.universe_id = :universeId " +
            "      AND CAST(g.timestamp AS date) > COALESCE(" +
            "          (SELECT MAX(d2.date) FROM game_daily_analytics d2 WHERE d2.universe_id = :universeId), " +
            "          '1970-01-01'::date" +
            "      ) " +
            "    GROUP BY CAST(g.timestamp AS date)" +
            ") combined " +
            "ORDER BY date ASC", nativeQuery = true)
    List<DailyAnalyticsProjection> getDailyAnalytics(@Param("universeId") Long universeId);

    @org.springframework.data.jpa.repository.Modifying
    @Query(value = "INSERT INTO game_daily_analytics (universe_id, date, average_playing, max_visits, min_playing, max_playing, created_at) " +
            "SELECT " +
            "    g.universe_id, " +
            "    CAST(g.timestamp AS date) AS date, " +
            "    CAST(ROUND(AVG(g.playing)) AS bigint) AS average_playing, " +
            "    MAX(g.visits) AS max_visits, " +
            "    MIN(g.playing) AS min_playing, " +
            "    MAX(g.playing) AS max_playing, " +
            "    NOW() AS created_at " +
            "FROM game_snapshots g " +
            "WHERE g.timestamp < :cutoffTimestamp " +
            "GROUP BY g.universe_id, CAST(g.timestamp AS date) " +
            "ON CONFLICT (universe_id, date) DO UPDATE SET " +
            "    average_playing = EXCLUDED.average_playing, " +
            "    max_visits = EXCLUDED.max_visits, " +
            "    min_playing = EXCLUDED.min_playing, " +
            "    max_playing = EXCLUDED.max_playing", nativeQuery = true)
    int consolidateSnapshotsBefore(@Param("cutoffTimestamp") Instant cutoffTimestamp);

    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM GameSnapshot g WHERE g.snapshotTimestamp < :cutoffTimestamp")
    int deleteSnapshotsBefore(@Param("cutoffTimestamp") Instant cutoffTimestamp);

    long countBySnapshotTimestampBefore(Instant cutoffTimestamp);
}
