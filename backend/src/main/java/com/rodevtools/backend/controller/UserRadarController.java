package com.rodevtools.backend.controller;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.dto.RadarRequestDto;
import com.rodevtools.backend.model.Game;
import com.rodevtools.backend.model.User;
import com.rodevtools.backend.model.UserRadar;
import com.rodevtools.backend.repository.UserRadarRepository;
import com.rodevtools.backend.repository.UserRepository;
import com.rodevtools.backend.service.GameService;
import com.rodevtools.backend.exception.ResourceNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/radar")
@RequiredArgsConstructor
public class UserRadarController {

    private final UserRadarRepository userRadarRepository;
    private final UserRepository userRepository;
    private final GameService gameService;

    @GetMapping
    public ResponseEntity<List<GameResponseDto>> getRadarList(@RequestAttribute("userId") String userIdStr){
        UUID userId = UUID.fromString(userIdStr);

        List<GameResponseDto> trackedGames = userRadarRepository.findByUserId(userId).stream().map(radar -> {
            Game game = radar.getGame();
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
        }).toList();

        return ResponseEntity.ok(trackedGames);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> addToRadar(@RequestAttribute("userId") String userIdStr, @RequestBody RadarRequestDto request){
        UUID userId = UUID.fromString(userIdStr);
        Long universeId = request.universeId();

        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Game game = gameService.findById(universeId).orElseGet(() ->  gameService.syncGame(universeId));

        if (game == null){
            throw new ResourceNotFoundException("The game could not be found or synchronized with ID " + universeId);
        }

        boolean alreadyTracking = userRadarRepository.findByUserId(userId).stream().anyMatch(r -> r.getGame().getUniverseId().equals(universeId));

        if (alreadyTracking){
            // Silently return OK - game is already tracked (can be in multiple local collections)
            return ResponseEntity.ok("Game already tracked in radar");
        }

        UserRadar userRadar = new UserRadar();
        userRadar.setUser(user);
        userRadar.setGame(game);

        userRadarRepository.save(userRadar);

        return ResponseEntity.ok("Game added to radar");
    }
    @DeleteMapping("/{universeId}")
    @Transactional
    public ResponseEntity<?> removeFromRadar(@RequestAttribute("userId") String userIdStr, @PathVariable Long universeId) {
        UUID userId = UUID.fromString(userIdStr);
        userRadarRepository.deleteByUserIdAndGameUniverseId(userId, universeId);
        return ResponseEntity.ok("Game deleted from radar");
    }



}
