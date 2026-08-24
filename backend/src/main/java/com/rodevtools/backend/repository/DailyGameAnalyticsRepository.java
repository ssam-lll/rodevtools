package com.rodevtools.backend.repository;

import com.rodevtools.backend.model.DailyGameAnalytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyGameAnalyticsRepository extends JpaRepository<DailyGameAnalytics, Long> {

    List<DailyGameAnalytics> findByGameUniverseIdOrderByDateAsc(Long universeId);

    @Query("SELECT MAX(d.date) FROM DailyGameAnalytics d WHERE d.game.universeId = :universeId")
    Optional<LocalDate> findMaxDateByUniverseId(@Param("universeId") Long universeId);
}
