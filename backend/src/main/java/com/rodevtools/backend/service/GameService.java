package com.rodevtools.backend.service;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.dto.RobloxGameDataDto;
import com.rodevtools.backend.dto.XRayDetailsDto;
import com.rodevtools.backend.model.Game;
import com.rodevtools.backend.model.GameSnapshot;
import com.rodevtools.backend.repository.GameRepository;
import com.rodevtools.backend.repository.GameSnapshotRepository;
import com.rodevtools.backend.repository.projection.DailyAnalyticsProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameService {

    private static final Pattern URL_PATTERN = Pattern.compile("(?:games[/=]|placeId=)(\\d+)");
    private static final Pattern NUMERIC_PATTERN = Pattern.compile("^\\d+$");

    private final GameRepository gameRepository;
    private final GameSnapshotRepository gameSnapshotRepository;
    private final RobloxApiService robloxApiService;
    private final TransactionTemplate transactionTemplate;

    public List<Game> findAll() {
        return gameRepository.findAll();
    }

    public Page<Game> findAllPaginated(Pageable pageable, String search, String category) {
        boolean hasSearch = search != null && !search.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        if (hasSearch && hasCategory) {
            return gameRepository.findByGameNameContainingIgnoreCaseAndCategory(search.trim(), category.trim(),
                    pageable);
        } else if (hasSearch) {
            return gameRepository.findByGameNameContainingIgnoreCase(search.trim(), pageable);
        } else if (hasCategory) {
            return gameRepository.findByCategory(category.trim(), pageable);
        } else {
            return gameRepository.findAll(pageable);
        }
    }

    public Optional<Game> findById(Long universeId) {
        return gameRepository.findById(universeId);
    }

    public Game saveOrUpdate(Game game) {
        return gameRepository.save(game);
    }

    public void delete(Long universeId) {
        gameRepository.deleteById(universeId);
    }

    public List<Long> getGamesToSync(Instant cutoff, int limit) {
        return gameRepository.findGamesToSync(cutoff, PageRequest.of(0, limit));
    }

    public double calculateMonthlyRevenue(Long playing) {
        return playing != null ? playing * 4.5 * 30 : 0.0;
    }

    public int calculateEstimatedPlaytime(Long ccu, Long visits) {
        return 20;
    }

    public GameResponseDto toGameResponseDto(Game game) {
        if (game == null) {
            return null;
        }
        double monthlyRevenue = calculateMonthlyRevenue(game.getPlaying());
        int playtime = calculateEstimatedPlaytime(game.getPlaying(), game.getVisits());
        return new GameResponseDto(
                game.getUniverseId(),
                game.getRootPlaceId(),
                game.getGameName(),
                game.getCreatorName(),
                game.getPlaying(),
                game.getVisits(),
                game.getRating(),
                game.getCategory(),
                monthlyRevenue,
                playtime
        );
    }

    public XRayDetailsDto getXRayDetails(Game game) {
        List<DailyAnalyticsProjection> dailyData = gameSnapshotRepository.getDailyAnalytics(game.getUniverseId());

        List<XRayDetailsDto.DailyMetricDto> metrics = new ArrayList<>();
        Long previousMaxVisits = null;
        LocalDate previousDate = null;
        int avgPlaytime = calculateEstimatedPlaytime(game.getPlaying(), game.getVisits());

        for (DailyAnalyticsProjection dayPoint : dailyData) {
            long dailyVisits = 0;
            if (previousMaxVisits != null) {
                long delta = Math.max(0, dayPoint.getMaxVisits() - previousMaxVisits);
                long daysGap = (previousDate != null)
                        ? Math.max(1, ChronoUnit.DAYS.between(previousDate, dayPoint.getDate()))
                        : 1;
                dailyVisits = delta / daysGap;
            } else {
                dailyVisits = 0;
            }
            previousMaxVisits = dayPoint.getMaxVisits();
            previousDate = dayPoint.getDate();

            String formattedDay = dayPoint.getDate().getMonthValue() + "-" + dayPoint.getDate().getDayOfMonth();

            long avgCcu = dayPoint.getAveragePlaying() != null ? dayPoint.getAveragePlaying() : 0L;
            double dailyRevenue = avgCcu * 0.15;

            metrics.add(new XRayDetailsDto.DailyMetricDto(
                    formattedDay,
                    avgCcu,
                    dailyVisits,
                    avgPlaytime,
                    dailyRevenue));
        }

        double monthlyRevenue = calculateMonthlyRevenue(game.getPlaying());

        return new XRayDetailsDto(
                game.getUniverseId(),
                game.getRootPlaceId(),
                game.getGameName(),
                game.getCreatorName(),
                game.getVisits(),
                game.getPlaying(),
                monthlyRevenue,
                avgPlaytime,
                game.getRating(),
                metrics);
    }

    public Optional<Game> resolveGame(String query) {
        if (query == null || query.isBlank()) {
            return Optional.empty();
        }

        String trimmed = query.trim();

        Matcher matcher = URL_PATTERN.matcher(trimmed);
        if (matcher.find()) {
            String extractedId = matcher.group(1);
            try {
                Long placeId = Long.parseLong(extractedId);
                return resolveByPlaceId(placeId);
            } catch (NumberFormatException ignored) {}
        }

        if (NUMERIC_PATTERN.matcher(trimmed).matches()) {
            try {
                Long numericId = Long.parseLong(trimmed);
                return resolveByNumericId(numericId);
            } catch (NumberFormatException ignored) {}
        }

        Optional<Game> byName = gameRepository.findFirstByGameNameContainingIgnoreCaseOrderByPlayingDesc(trimmed);
        if (byName.isPresent()) {
            return byName;
        }

        return Optional.empty();
    }

    private Optional<Game> resolveByPlaceId(Long placeId) {
        Optional<Game> byRootPlace = gameRepository.findByRootPlaceId(placeId);
        if (byRootPlace.isPresent()) {
            return byRootPlace;
        }

        Optional<Long> universeIdOpt = robloxApiService.resolvePlaceIdToUniverseId(placeId);
        if (universeIdOpt.isPresent()) {
            Long universeId = universeIdOpt.get();
            Optional<Game> byUniverse = gameRepository.findById(universeId);
            if (byUniverse.isPresent()) {
                return byUniverse;
            }
            Game synced = syncGame(universeId);
            if (synced != null) {
                return Optional.of(synced);
            }
        }

        return Optional.empty();
    }

    private Optional<Game> resolveByNumericId(Long id) {
        // 1. Check if this numeric ID is a known rootPlaceId in DB
        Optional<Game> byRootPlace = gameRepository.findByRootPlaceId(id);
        if (byRootPlace.isPresent()) {
            return byRootPlace;
        }

        // 2. Check if this numeric ID is a valid Roblox Place ID (URLs and player queries are overwhelmingly Place IDs)
        Optional<Long> universeIdOpt = robloxApiService.resolvePlaceIdToUniverseId(id);
        if (universeIdOpt.isPresent()) {
            Long universeId = universeIdOpt.get();
            Optional<Game> byUniverse = gameRepository.findById(universeId);
            if (byUniverse.isPresent()) {
                return byUniverse;
            }
            Game synced = syncGame(universeId);
            if (synced != null) {
                return Optional.of(synced);
            }
        }

        // 3. Check if it's already in DB by Universe ID
        Optional<Game> byUniverse = gameRepository.findById(id);
        if (byUniverse.isPresent()) {
            return byUniverse;
        }

        // 4. Finally, attempt to sync directly as a Universe ID
        Game synced = syncGame(id);
        return Optional.ofNullable(synced);
    }

    public Game syncGame(Long id) {
        Optional<RobloxGameDataDto> apiDataOpt = robloxApiService.fetchGameData(id);

        if (apiDataOpt.isEmpty()) {
            return null;
        }

        return transactionTemplate.execute(status -> persistGameData(apiDataOpt.get()));
    }

    public Game persistGameData(RobloxGameDataDto apiData) {
        Game game = gameRepository.findById(apiData.universeId()).orElse(new Game());
        game.setUniverseId(apiData.universeId());
        game.setRootPlaceId(apiData.rootPlaceId());
        game.setGameName(apiData.gameName());
        game.setDescription(apiData.description());
        game.setVisits(apiData.visits());
        game.setPlaying(apiData.playing());
        game.setLikes(apiData.likes());
        game.setDislikes(apiData.dislikes());
        game.setCreatorName(apiData.creatorName());
        game.setCreatorId(apiData.creatorId());
        game.setRobloxCreatedAt(apiData.robloxCreatedAt());
        game.setRobloxUpdatedAt(apiData.robloxUpdatedAt());
        game.setLastSyncedAt(Instant.now());

        double totalVotes = apiData.likes() + apiData.dislikes();
        Double rating = totalVotes > 0 ? (apiData.likes() * 100.0) / totalVotes : 0.0;
        game.setRating(rating);

        gameRepository.save(game);

        GameSnapshot snapshot = new GameSnapshot();
        snapshot.setGame(game);
        snapshot.setPlaying(apiData.playing());
        snapshot.setVisits(apiData.visits());
        gameSnapshotRepository.save(snapshot);

        return game;
    }

    public List<Game> syncGames(List<Long> universeIds) {
        if (universeIds == null || universeIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Game> syncedGames = new ArrayList<>();
        int batchSize = 100;

        for (int i = 0; i < universeIds.size(); i += batchSize) {
            List<Long> subList = universeIds.subList(i, Math.min(i + batchSize, universeIds.size()));
            List<RobloxGameDataDto> dtos = robloxApiService.fetchGamesBatch(subList);

            if (dtos.isEmpty()) {
                continue;
            }

            List<Game> savedBatch = transactionTemplate.execute(status -> persistGamesBatch(dtos));
            if (savedBatch != null) {
                syncedGames.addAll(savedBatch);
            }
        }

        return syncedGames;
    }

    public List<Game> persistGamesBatch(List<RobloxGameDataDto> dtos) {
        List<Game> gamesToSave = new ArrayList<>();
        List<GameSnapshot> snapshotsToSave = new ArrayList<>();

        for (RobloxGameDataDto dto : dtos) {
            Game game = gameRepository.findById(dto.universeId()).orElse(new Game());
            game.setUniverseId(dto.universeId());
            game.setRootPlaceId(dto.rootPlaceId());
            game.setGameName(dto.gameName());
            game.setDescription(dto.description());
            game.setVisits(dto.visits());
            game.setPlaying(dto.playing());
            game.setLikes(dto.likes());
            game.setDislikes(dto.dislikes());
            game.setCreatorName(dto.creatorName());
            game.setCreatorId(dto.creatorId());
            game.setRobloxCreatedAt(dto.robloxCreatedAt());
            game.setRobloxUpdatedAt(dto.robloxUpdatedAt());
            game.setLastSyncedAt(Instant.now());

            double totalVotes = dto.likes() + dto.dislikes();
            Double rating = totalVotes > 0 ? (dto.likes() * 100.0) / totalVotes : 0.0;
            game.setRating(rating);

            gamesToSave.add(game);

            GameSnapshot snapshot = new GameSnapshot();
            snapshot.setGame(game);
            snapshot.setPlaying(dto.playing());
            snapshot.setVisits(dto.visits());
            snapshotsToSave.add(snapshot);
        }

        List<Game> saved = gameRepository.saveAll(gamesToSave);
        gameSnapshotRepository.saveAll(snapshotsToSave);
        return saved;
    }
}
