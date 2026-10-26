package com.rodevtools.backend.service;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.exception.ResourceNotFoundException;
import com.rodevtools.backend.model.Game;
import com.rodevtools.backend.model.User;
import com.rodevtools.backend.model.UserRadar;
import com.rodevtools.backend.repository.UserRadarRepository;
import com.rodevtools.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserRadarService {

    private final UserRadarRepository userRadarRepository;
    private final UserRepository userRepository;
    private final GameService gameService;

    @Transactional(readOnly = true)
    public List<GameResponseDto> getRadarGames(UUID userId) {
        return userRadarRepository.findByUserId(userId).stream()
                .map(radar -> gameService.toGameResponseDto(radar.getGame()))
                .toList();
    }

    @Transactional
    public String addToRadar(UUID userId, Long universeId) {
        if (userRadarRepository.existsByUserIdAndGameUniverseId(userId, universeId)) {
            return "Game already tracked in radar";
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Game game = gameService.findById(universeId)
                .orElseGet(() -> gameService.syncGame(universeId));

        if (game == null) {
            throw new ResourceNotFoundException(
                "The game could not be found or synchronized with ID " + universeId);
        }

        UserRadar userRadar = new UserRadar();
        userRadar.setUser(user);
        userRadar.setGame(game);
        userRadarRepository.save(userRadar);

        return "Game added to radar";
    }

    @Transactional
    public void removeFromRadar(UUID userId, Long universeId) {
        long deleted = userRadarRepository.deleteByUserIdAndGameUniverseId(userId, universeId);
        if (deleted == 0) {
            throw new ResourceNotFoundException("Game with universeId " + universeId + " not found in user radar");
        }
    }

    @Transactional
    public long removeBatchFromRadar(UUID userId, List<Long> universeIds) {
        return userRadarRepository.deleteByUserIdAndGameUniverseIdIn(userId, universeIds);
    }

    @Transactional
    public long clearRadar(UUID userId) {
        return userRadarRepository.deleteByUserId(userId);
    }

    @Transactional(readOnly = true)
    public String exportRadarToCsv(UUID userId) {
        List<GameResponseDto> games = getRadarGames(userId);
        StringBuilder sb = new StringBuilder();
        sb.append("universeId,rootPlaceId,name,creator,playing,visits,rating,category,estimatedMonthlyRevenueUsd\r\n");

        for (GameResponseDto game : games) {
            if (game == null) {
                continue;
            }
            sb.append(escapeCsv(game.getUniverseId())).append(',')
              .append(escapeCsv(game.getRootPlaceId())).append(',')
              .append(escapeCsv(game.getName())).append(',')
              .append(escapeCsv(game.getCreator())).append(',')
              .append(escapeCsv(game.getActivePlayers())).append(',')
              .append(escapeCsv(game.getVisits())).append(',')
              .append(escapeCsv(game.getHealthScore())).append(',')
              .append(escapeCsv(game.getCategory())).append(',')
              .append(escapeCsv(game.getMonthlyRevenue())).append("\r\n");
        }

        return sb.toString();
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String str = String.valueOf(value);
        if (str.contains(",") || str.contains("\"") || str.contains("\n") || str.contains("\r")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}
