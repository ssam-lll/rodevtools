package com.rodevtools.backend.scheduler;

import com.rodevtools.backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GameDataScheduler {

    private final GameService gameService;

    @Scheduled(cron = "0 * * * * ?")
    public void syncPendingGames() {
        Instant cutoff = Instant.now().minus(6, ChronoUnit.HOURS);

        List<Long> gameIdsToSync = gameService.getGamesToSync(cutoff, 100);

        if (gameIdsToSync.isEmpty()) {
            return;
        }

        System.out.println("SCHEDULER: Starting batch synchronization for " + gameIdsToSync.size() + " games.");
        gameService.syncGames(gameIdsToSync);
        System.out.println("SCHEDULER: batch synchronization completed.");
    }
}
