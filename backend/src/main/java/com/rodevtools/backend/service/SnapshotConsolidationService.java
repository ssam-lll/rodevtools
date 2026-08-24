package com.rodevtools.backend.service;

import com.rodevtools.backend.repository.GameSnapshotRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SnapshotConsolidationService {

    private final GameSnapshotRepository gameSnapshotRepository;

    public static final int DEFAULT_RETENTION_DAYS = 14;

    @Data
    @Builder
    public static class ConsolidationResult {
        private int retentionDays;
        private Instant cutoffTimestamp;
        private long snapshotsFoundBeforeCutoff;
        private int dailyRecordsUpserted;
        private int snapshotsDeleted;
        private long durationMs;
    }

    @Transactional
    public ConsolidationResult consolidateAndPurge(int daysToKeep) {
        long startTime = System.currentTimeMillis();
        Instant cutoffTimestamp = Instant.now().minus(daysToKeep, ChronoUnit.DAYS);

        log.info("CONSOLIDATION: Starting snapshot consolidation and purge for snapshots older than {} days (cutoff: {})...",
                daysToKeep, cutoffTimestamp);

        long countBefore = gameSnapshotRepository.countBySnapshotTimestampBefore(cutoffTimestamp);
        log.info("CONSOLIDATION: Found {} raw snapshots eligible for consolidation.", countBefore);

        if (countBefore == 0) {
            log.info("CONSOLIDATION: No snapshots found to consolidate.");
            return ConsolidationResult.builder()
                    .retentionDays(daysToKeep)
                    .cutoffTimestamp(cutoffTimestamp)
                    .snapshotsFoundBeforeCutoff(0)
                    .dailyRecordsUpserted(0)
                    .snapshotsDeleted(0)
                    .durationMs(System.currentTimeMillis() - startTime)
                    .build();
        }

        // 1. Rollup aggregation into game_daily_analytics
        int upsertedDailyRecords = gameSnapshotRepository.consolidateSnapshotsBefore(cutoffTimestamp);
        log.info("CONSOLIDATION: Successfully aggregated and upserted {} daily analytics records.", upsertedDailyRecords);

        // 2. Delete consolidated raw snapshots
        int deletedSnapshots = gameSnapshotRepository.deleteSnapshotsBefore(cutoffTimestamp);
        log.info("CONSOLIDATION: Successfully purged {} raw snapshots.", deletedSnapshots);

        long duration = System.currentTimeMillis() - startTime;
        log.info("CONSOLIDATION: Completed in {} ms.", duration);

        return ConsolidationResult.builder()
                .retentionDays(daysToKeep)
                .cutoffTimestamp(cutoffTimestamp)
                .snapshotsFoundBeforeCutoff(countBefore)
                .dailyRecordsUpserted(upsertedDailyRecords)
                .snapshotsDeleted(deletedSnapshots)
                .durationMs(duration)
                .build();
    }

    public ConsolidationResult consolidateAndPurge() {
        return consolidateAndPurge(DEFAULT_RETENTION_DAYS);
    }
}
