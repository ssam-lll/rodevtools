package com.rodevtools.backend.controller;

import com.rodevtools.backend.dto.GameResponseDto;
import com.rodevtools.backend.dto.RadarBatchDeleteRequestDto;
import com.rodevtools.backend.dto.RadarRequestDto;
import com.rodevtools.backend.service.UserRadarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
                                             @Valid @RequestBody RadarRequestDto request) {
        String result = userRadarService.addToRadar(UUID.fromString(userIdStr), request.universeId());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{universeId}")
    public ResponseEntity<String> removeFromRadar(@RequestAttribute("userId") String userIdStr,
                                                  @PathVariable("universeId") Long universeId) {
        userRadarService.removeFromRadar(UUID.fromString(userIdStr), universeId);
        return ResponseEntity.ok("Game deleted from radar");
    }

    @DeleteMapping("/batch")
    public ResponseEntity<Map<String, Object>> removeBatchFromRadar(@RequestAttribute("userId") String userIdStr,
                                                                    @Valid @RequestBody RadarBatchDeleteRequestDto request) {
        long deletedCount = userRadarService.removeBatchFromRadar(UUID.fromString(userIdStr), request.universeIds());
        return ResponseEntity.ok(Map.of("message", "Batch removed from radar", "deletedCount", deletedCount));
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearRadar(@RequestAttribute("userId") String userIdStr) {
        long deletedCount = userRadarService.clearRadar(UUID.fromString(userIdStr));
        return ResponseEntity.ok(Map.of("message", "Radar cleared", "deletedCount", deletedCount));
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<String> exportRadarCsv(@RequestAttribute("userId") String userIdStr) {
        String csv = userRadarService.exportRadarToCsv(UUID.fromString(userIdStr));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"radar-games.csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
