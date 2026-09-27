package com.rodevtools.backend.controller;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.dto.RadarRequestDto;
import com.rodevtools.backend.service.UserRadarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/radar")
@RequiredArgsConstructor
public class UserRadarController {

    private final UserRadarService userRadarService;

    @GetMapping
    public ResponseEntity<List<GameResponseDto>> getRadarList(@RequestAttribute("userId") String userIdStr) {
        return ResponseEntity.ok(userRadarService.getRadarGames(UUID.fromString(userIdStr)));
    }

    @PostMapping
    public ResponseEntity<String> addToRadar(@RequestAttribute("userId") String userIdStr,
                                            @RequestBody RadarRequestDto request) {
        String result = userRadarService.addToRadar(UUID.fromString(userIdStr), request.universeId());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{universeId}")
    public ResponseEntity<String> removeFromRadar(@RequestAttribute("userId") String userIdStr,
                                                 @PathVariable Long universeId) {
        userRadarService.removeFromRadar(UUID.fromString(userIdStr), universeId);
        return ResponseEntity.ok("Game deleted from radar");
    }
}
