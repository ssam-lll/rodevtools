package com.rodevtools.backend.service;

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
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameSnapshotRepository gameSnapshotRepository;
    private final RobloxApiService robloxApiService;

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

    public XRayDetailsDto getXRayDetails(Game game) {
        List<DailyAnalyticsProjection> dailyData = gameSnapshotRepository.getDailyAnalytics(game.getUniverseId());

        List<XRayDetailsDto.DailyMetricDto> metrics = new ArrayList<>();
        Long previousMaxVisits = null;
        int avgPlaytime = calculateEstimatedPlaytime(game.getPlaying(), game.getVisits());

        for (DailyAnalyticsProjection dayPoint : dailyData) {
            long dailyVisits = 0;
            if (previousMaxVisits != null) {
                dailyVisits = Math.max(0, dayPoint.getMaxVisits() - previousMaxVisits);
            } else {
                dailyVisits = 0;
            }
            previousMaxVisits = dayPoint.getMaxVisits();

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
                game.getGameName(),
                game.getCreatorName(),
                game.getVisits(),
                game.getPlaying(),
                monthlyRevenue,
                avgPlaytime,
                game.getRating(),
                metrics);
    }

    @Transactional
    public Game syncGame(Long id) {
        Optional<RobloxGameDataDto> apiDataOpt = robloxApiService.fetchGameData(id);

        if (apiDataOpt.isEmpty()) {
            return gameRepository.findById(id).orElse(null);
        }

        RobloxGameDataDto apiData = apiDataOpt.get();

        Game game = gameRepository.findById(apiData.universeId()).orElse(new Game());
        game.setUniverseId(apiData.universeId());
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

    @Transactional
    public List<Game> syncGames(List<Long> universeIds) {
        if (universeIds == null || universeIds.isEmpty()) {
            return new ArrayList<>();
        }

        List<Game> syncedGames = new ArrayList<>();
        int batchSize = 100;

        for (int i = 0; i < universeIds.size(); i += batchSize) {
            List<Long> subList = universeIds.subList(i, Math.min(i + batchSize, universeIds.size()));
            List<RobloxGameDataDto> dtos = robloxApiService.fetchGamesBatch(subList);

            List<Game> gamesToSave = new ArrayList<>();
            List<GameSnapshot> snapshotsToSave = new ArrayList<>();

            for (RobloxGameDataDto dto : dtos) {
                Game game = gameRepository.findById(dto.universeId()).orElse(new Game());
                game.setUniverseId(dto.universeId());
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

            if (!gamesToSave.isEmpty()) {
                List<Game> saved = gameRepository.saveAll(gamesToSave);
                gameSnapshotRepository.saveAll(snapshotsToSave);
                syncedGames.addAll(saved);
            }
        }

        return syncedGames;
    }
}
