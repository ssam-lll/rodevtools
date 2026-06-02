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

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/universes")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final GameAnalyticsService gameAnalyticsService;

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
            double monthlyRevenue = game.getPlaying() != null ? game.getPlaying() * 4.5 * 30 : 0.0;
            int playtime = 15 + (int)(game.getUniverseId() % 15);
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

        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        List<RisingStarProjection> allStars = gameAnalyticsService.getRisingStars(minPlaying, maxPlaying, since);

        List<RisingStarResponseDto> dtos = allStars.stream().map(proj -> {
            long currentCcu = proj.getCurrentCcu() != null ? proj.getCurrentCcu() : 0L;
            double growthRate = proj.getGrowthRate() != null ? Math.round(proj.getGrowthRate() * 100.0) / 100.0 : 0.0;
            double monthlyRevenueEst = currentCcu * 4.5 * 30;
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
        })
        .filter(dto -> search == null || search.isBlank() ||
                       (dto.getName() != null && dto.getName().toLowerCase().contains(search.toLowerCase().trim())))
        .toList();

        boolean asc = "asc".equalsIgnoreCase(sortDir);
        List<RisingStarResponseDto> sortedDtos = new java.util.ArrayList<>(dtos);
        sortedDtos.sort((a, b) -> {
            int cmp = 0;
            switch (sortField) {
                case "name" -> {
                    String nameA = a.getName() != null ? a.getName() : "";
                    String nameB = b.getName() != null ? b.getName() : "";
                    cmp = nameA.compareToIgnoreCase(nameB);
                }
                case "creator" -> {
                    String creatorA = a.getCreator() != null ? a.getCreator() : "";
                    String creatorB = b.getCreator() != null ? b.getCreator() : "";
                    cmp = creatorA.compareToIgnoreCase(creatorB);
                }
                case "activePlayers", "playing" -> cmp = Long.compare(a.getActivePlayers(), b.getActivePlayers());
                case "growth24h", "growthRate" -> cmp = Double.compare(a.getGrowth24h(), b.getGrowth24h());
                case "monthlyRevenueEst" -> cmp = Double.compare(a.getMonthlyRevenueEst(), b.getMonthlyRevenueEst());
                case "healthScore" -> cmp = Double.compare(a.getHealthScore(), b.getHealthScore());
                default -> cmp = Double.compare(a.getGrowth24h(), b.getGrowth24h());
            }
            return asc ? cmp : -cmp;
        });

        int start = Math.min(page * size, sortedDtos.size());
        int end = Math.min(start + size, sortedDtos.size());
        List<RisingStarResponseDto> pageContent = sortedDtos.subList(start, end);

        Pageable pageable = PageRequest.of(page, size);
        Page<RisingStarResponseDto> responsePage = new PageImpl<>(pageContent, pageable, sortedDtos.size());

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
}
