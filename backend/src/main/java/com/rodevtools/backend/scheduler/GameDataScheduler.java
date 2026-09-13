package com.rodevtools.backend.scheduler;

import com.rodevtools.backend.service.GameService;
import com.rodevtools.backend.service.SnapshotConsolidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Component
@RequiredArgsConstructor
public class GameDataScheduler {

    private final GameService gameService;
    private final SnapshotConsolidationService snapshotConsolidationService;

    @Value("${app.scheduler.game-sync.cutoff-hours:6}")
    private int cutoffHours;

    @Value("${app.scheduler.game-sync.batch-size:100}")
    private int batchSize;

    @Scheduled(cron = "${app.scheduler.game-sync.cron:0 0 * * * ?}")
    public void syncPendingGames() {
        Instant cutoff = Instant.now().minus(cutoffHours, ChronoUnit.HOURS);

        List<Long> gameIdsToSync = gameService.getGamesToSync(cutoff, batchSize);

        if (gameIdsToSync.isEmpty()) {
            return;
        }

        long startTime = System.currentTimeMillis();
        log.info("SCHEDULER: Starting batch synchronization for {} games.", gameIdsToSync.size());
        gameService.syncGames(gameIdsToSync);
        long duration = System.currentTimeMillis() - startTime;
        log.info("SCHEDULER: Batch synchronization for {} games completed in {} ms.", gameIdsToSync.size(), duration);
    }

    /**
     * Runs daily at 03:00 AM to consolidate snapshots older than 14 days into daily rollups and purge old raw records.
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void consolidateOldSnapshots() {
        log.info("SCHEDULER: Starting scheduled daily snapshot consolidation...");
        try {
            var result = snapshotConsolidationService.consolidateAndPurge();
            log.info("SCHEDULER: Daily snapshot consolidation completed. Consolidated {} records, purged {} snapshots in {} ms.",
                    result.getDailyRecordsUpserted(), result.getSnapshotsDeleted(), result.getDurationMs());
        } catch (Exception e) {
            log.error("SCHEDULER: Error occurred during daily snapshot consolidation: {}", e.getMessage(), e);
        }
    }
}
