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

    @Query(value = "SELECT CAST(g.timestamp AS date) as date, " +
            "ROUND(AVG(g.playing)) as averagePlaying, " +
            "MAX(g.visits) as maxVisits " +
            "FROM game_snapshots g " +
            "WHERE g.universe_id = :universeId " +
            "GROUP BY CAST(g.timestamp AS date) " +
            "ORDER BY date ASC", nativeQuery = true)
    List<DailyAnalyticsProjection> getDailyAnalytics(@Param("universeId") Long universeId);
}
