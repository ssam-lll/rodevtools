package com.rodevtools.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodevtools.backend.dto.RobloxGameDataDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RobloxApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String ROBLOX_GAMES_API = "https://games.roblox.com/v1/games?universeIds=";
    private static final String ROBLOX_VOTES_API = "https://games.roblox.com/v1/games/votes?universeIds=";

    public List<RobloxGameDataDto> fetchGamesBatch(List<Long> universeIds) {
        if (universeIds == null || universeIds.isEmpty()) {
            return Collections.emptyList();
        }

        List<RobloxGameDataDto> allResults = new ArrayList<>();
        int chunkSize = 50; // Roblox API accepts a maximum of 50 IDs per request

        for (int i = 0; i < universeIds.size(); i += chunkSize) {
            List<Long> chunk = universeIds.subList(i, Math.min(i + chunkSize, universeIds.size()));
            String idsParam = chunk.stream()
                    .map(String::valueOf)
                    .collect(Collectors.joining(","));

            try {
                String gamesUrl = ROBLOX_GAMES_API + idsParam;
                String gamesResponse = restTemplate.getForObject(gamesUrl, String.class);
                JsonNode gamesRoot = objectMapper.readTree(gamesResponse);
                JsonNode gamesArray = gamesRoot.path("data");

                if (!gamesArray.isArray() || gamesArray.isEmpty()) {
                    continue;
                }

                Map<Long, long[]> votesMap = new HashMap<>();
                try {
                    String votesUrl = ROBLOX_VOTES_API + idsParam;
                    String votesResponse = restTemplate.getForObject(votesUrl, String.class);
                    JsonNode votesRoot = objectMapper.readTree(votesResponse);
                    JsonNode votesArray = votesRoot.path("data");
                    if (votesArray.isArray()) {
                        for (JsonNode voteNode : votesArray) {
                            Long uId = voteNode.path("id").asLong();
                            long likes = voteNode.path("upVotes").asLong();
                            long dislikes = voteNode.path("downVotes").asLong();
                            votesMap.put(uId, new long[]{likes, dislikes});
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to fetch batch votes from Roblox API: {}", e.getMessage());
                }

                for (JsonNode gameData : gamesArray) {
                    Long universeId = gameData.path("id").asLong();
                    String name = gameData.path("name").asText();
                    String description = gameData.path("description").asText();
                    Long visits = gameData.path("visits").asLong();
                    Long playing = gameData.path("playing").asLong();
                    String creatorName = gameData.path("creator").path("name").asText();
                    Long creatorId = gameData.path("creator").path("id").asLong();

                    LocalDateTime robloxCreatedAt = parseDateTime(gameData.path("created").asText());
                    LocalDateTime robloxUpdatedAt = parseDateTime(gameData.path("updated").asText());

                    long[] votes = votesMap.getOrDefault(universeId, new long[]{0L, 0L});

                    allResults.add(new RobloxGameDataDto(
                            universeId,
                            name,
                            description,
                            visits,
                            playing,
                            votes[0],
                            votes[1],
                            creatorName,
                            creatorId,
                            robloxCreatedAt,
                            robloxUpdatedAt
                    ));
                }
            } catch (Exception e) {
                log.error("Failed to fetch batch games from Roblox API for IDs {}: {}", idsParam, e.getMessage());
            }
        }
        return allResults;
    }

    private LocalDateTime parseDateTime(String text) {
        if (text == null || text.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.ofInstant(Instant.parse(text), ZoneId.of("UTC"));
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }

    public Optional<RobloxGameDataDto> fetchGameData(Long id) {
        List<RobloxGameDataDto> batch = fetchGamesBatch(List.of(id));
        if (!batch.isEmpty()) {
            return Optional.of(batch.get(0));
        }

        log.info("ROBLOX API: ID {} not found in batch, trying to resolve as place ID...", id);
        try {
            String resolveUrl = "https://apis.roblox.com/universes/v1/places/" + id + "/universe";
            String resolveResponse = restTemplate.getForObject(resolveUrl, String.class);
            JsonNode resolveRoot = objectMapper.readTree(resolveResponse);

            if (resolveRoot.has("universeId") && !resolveRoot.get("universeId").isNull()) {
                Long resolveUniverseId = resolveRoot.get("universeId").asLong();
                if (resolveUniverseId > 0) {
                    log.info("ROBLOX API: Place ID {} resolved to Universe ID {}", id, resolveUniverseId);
                    List<RobloxGameDataDto> resolvedBatch = fetchGamesBatch(List.of(resolveUniverseId));
                    if (!resolvedBatch.isEmpty()) {
                        return Optional.of(resolvedBatch.get(0));
                    }
                }
            }
        } catch (Exception e) {
            log.error("ROBLOX API: Failed to resolve Place ID {}: {}", id, e.getMessage());
        }

        return Optional.empty();
    }
}
