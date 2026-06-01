package com.rodevtools.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodevtools.backend.dto.RobloxGameDataDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RobloxApiService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String ROBLOX_GAMES_API = "https://games.roblox.com/v1/games?universeIds=";
    private static final String ROBLOX_VOTES_API = "https://games.roblox.com/v1/games/votes?universeIds=";

    public Optional<RobloxGameDataDto> fetchGameData(Long id) {
        Long universeId = id;
        try {
            String gamesUrl = ROBLOX_GAMES_API + universeId;
            String gamesResponse = restTemplate.getForObject(gamesUrl, String.class);
            JsonNode gamesRoot = objectMapper.readTree(gamesResponse);
            JsonNode gameData = gamesRoot.path("data").get(0);

            if (gameData == null) {
                System.out.println("ROBLOX API: ID " + id + " not found, trying to resolve as place ID...");
                try {
                    String resolveUrl = "https://apis.roblox.com/universes/v1/places/" + id + "/universe";
                    String resolveResponse = restTemplate.getForObject(resolveUrl, String.class);
                    JsonNode resolveRoot = objectMapper.readTree(resolveResponse);

                    if (resolveRoot.has("universeId") && !resolveRoot.get("universeId").isNull()) {
                        Long resolveUniverseId = resolveRoot.get("universeId").asLong();
                        if (resolveUniverseId > 0) {
                            System.out.println("ROBLOX API: Place ID " + id + " resolved to Universe ID " + resolveUniverseId);
                            universeId = resolveUniverseId;

                            gamesUrl = ROBLOX_GAMES_API + universeId;
                            gamesResponse = restTemplate.getForObject(gamesUrl, String.class);
                            gamesRoot = objectMapper.readTree(gamesResponse);
                            gameData = gamesRoot.path("data").get(0);
                        }
                    }
                } catch (Exception e) {
                    System.err.println("ROBLOX API: Failed to resolve Place ID " + id + ": " + e.getMessage());
                }
            }

            if (gameData == null) {
                return Optional.empty();
            }

            String name = gameData.path("name").asText();
            String description = gameData.path("description").asText();
            Long visits = gameData.path("visits").asLong();
            Long playing = gameData.path("playing").asLong();
            String creatorName = gameData.path("creator").path("name").asText();
            Long creatorId = gameData.path("creator").path("id").asLong();

            String createdStr = gameData.path("created").asText();
            String updatedStr = gameData.path("updated").asText();
            LocalDateTime robloxCreatedAt = LocalDateTime.ofInstant(Instant.parse(createdStr), ZoneId.of("UTC"));
            LocalDateTime robloxUpdatedAt = LocalDateTime.ofInstant(Instant.parse(updatedStr), ZoneId.of("UTC"));

            String votesUrl = ROBLOX_VOTES_API + universeId;
            String votesResponse = restTemplate.getForObject(votesUrl, String.class);
            JsonNode votesRoot = objectMapper.readTree(votesResponse);
            JsonNode votesData = votesRoot.path("data").get(0);

            Long likes = 0L;
            Long dislikes = 0L;
            if (votesData != null) {
                likes = votesData.path("upVotes").asLong();
                dislikes = votesData.path("downVotes").asLong();
            }

            return Optional.of(new RobloxGameDataDto(
                universeId,
                name,
                description,
                visits,
                playing,
                likes,
                dislikes,
                creatorName,
                creatorId,
                robloxCreatedAt,
                robloxUpdatedAt
            ));
        } catch (Exception e) {
            System.err.println("Failed to fetch game from Roblox API with ID " + universeId + ": " + e.getMessage());
            return Optional.empty();
        }
    }
}
