package com.rodevtools.backend.controller;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.dto.RisingStarResponseDto;
import com.rodevtools.backend.model.Game;
import com.rodevtools.backend.repository.projection.RisingStarProjection;
import com.rodevtools.backend.service.GameAnalyticsService;
import com.rodevtools.backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/universes")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final GameAnalyticsService gameAnalyticsService;
    private final com.rodevtools.backend.service.SnapshotConsolidationService snapshotConsolidationService;

    @PostMapping("/snapshots/consolidate")
    public ResponseEntity<?> consolidateSnapshots(
            @RequestParam(value = "days", defaultValue = "14") int days) {
        return ResponseEntity.ok(snapshotConsolidationService.consolidateAndPurge(days));
    }

    @GetMapping
    public ResponseEntity<?> getUniverses(
            @RequestParam(value = "id", required = false) Long id,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "playing") String sortField,
            @RequestParam(value = "dir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "category", required = false) String category) {

        if (id != null) {
            return gameService.findById(id)
                    .map(game -> ResponseEntity.ok(gameService.getXRayDetails(game)))
                    .orElseGet(() -> {
                        Game synced = gameService.syncGame(id);
                        if (synced != null) {
                            return ResponseEntity.ok(gameService.getXRayDetails(synced));
                        }
                        return ResponseEntity.notFound().build();
                    });
        }

        if (size > 100) size = 100;
        if (size < 1) size = 1;

        Sort sort = Sort.by(
            "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC,
            mapSortField(sortField)
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Game> gamePage = gameService.findAllPaginated(pageable, search, category);

        Page<GameResponseDto> responsePage = gamePage.map(game -> {
            double monthlyRevenue = gameService.calculateMonthlyRevenue(game.getPlaying());
            int playtime = gameService.calculateEstimatedPlaytime(game.getPlaying(), game.getVisits());
            return new GameResponseDto(
                    game.getUniverseId(),
                    game.getGameName(),
                    game.getCreatorName(),
                    game.getPlaying(),
                    game.getVisits(),
                    game.getRating(),
                    game.getCategory(),
                    monthlyRevenue,
                    playtime
            );
        });

        return ResponseEntity.ok(responsePage);
    }

    @GetMapping("/rising")
    public ResponseEntity<?> getRisingStars(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", defaultValue = "growth24h") String sortField,
            @RequestParam(value = "dir", defaultValue = "desc") String sortDir,
            @RequestParam(value = "minPlaying", defaultValue = "100") Long minPlaying,
            @RequestParam(value = "maxPlaying", defaultValue = "100000000") Long maxPlaying,
            @RequestParam(value = "hours", defaultValue = "24") int hours,
            @RequestParam(value = "search", required = false) String search) {

        if (size > 100) size = 100;
        if (size < 1) size = 1;

        Instant since = Instant.now().minus(hours, java.time.temporal.ChronoUnit.HOURS);

        Sort sort = Sort.by(
            "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC,
            mapRisingStarSortField(sortField)
        );
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<RisingStarProjection> projectionPage = gameAnalyticsService.getRisingStars(
                minPlaying, maxPlaying, since, search, pageable
        );

        Page<RisingStarResponseDto> responsePage = projectionPage.map(proj -> {
            long currentCcu = proj.getCurrentCcu() != null ? proj.getCurrentCcu() : 0L;
            double growthRate = proj.getGrowthRate() != null ? Math.round(proj.getGrowthRate() * 100.0) / 100.0 : 0.0;
            double monthlyRevenueEst = gameService.calculateMonthlyRevenue(currentCcu);
            double healthScore = proj.getHealthScore() != null ? Math.round(proj.getHealthScore() * 10.0) / 10.0 : 0.0;

            return new RisingStarResponseDto(
                    proj.getUniverseId(),
                    proj.getName(),
                    proj.getCreatorName(),
                    currentCcu,
                    growthRate,
                    monthlyRevenueEst,
                    healthScore
            );
        });

        return ResponseEntity.ok(responsePage);
    }

    private String mapSortField(String field) {
        return switch (field) {
            case "name" -> "gameName";
            case "creator" -> "creatorName";
            case "activePlayers", "playing" -> "playing";
            case "visits" -> "visits";
            case "healthScore", "rating" -> "rating";
            case "category" -> "category";
            default -> "playing";
        };
    }

    private String mapRisingStarSortField(String field) {
        return switch (field) {
            case "name" -> "name";
            case "creator", "creatorName" -> "creatorName";
            case "activePlayers", "playing", "currentCcu" -> "currentCcu";
            case "growth24h", "growthRate" -> "growthRate";
            case "healthScore", "rating" -> "healthScore";
            default -> "growthRate";
        };
    }
}
