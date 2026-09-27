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
        userRadarRepository.deleteByUserIdAndGameUniverseId(userId, universeId);
    }
}
