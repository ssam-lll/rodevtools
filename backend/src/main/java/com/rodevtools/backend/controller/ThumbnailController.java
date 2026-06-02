package com.rodevtools.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Set;

@RestController
@RequestMapping("/api/thumbnails")
@RequiredArgsConstructor
public class ThumbnailController {

    private final RestTemplate restTemplate;

    private static final Set<String> ALLOWED_SIZES = Set.of(
        "150x150", "256x256", "420x420", "512x512"
    );

    @GetMapping
    public ResponseEntity<String> getThumbnails(
            @RequestParam("universeIds") String universeIds,
            @RequestParam(value = "size", defaultValue = "150x150") String size) {

        if (!universeIds.matches("^[0-9]+(,[0-9]+)*$")) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"Invalid universeIds format. Only comma-separated numbers allowed.\"}");
        }

        if (!ALLOWED_SIZES.contains(size)) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"Invalid size. Allowed values: " + ALLOWED_SIZES + "\"}");
        }

        String[] ids = universeIds.split(",");
        if (ids.length > 100) {
            return ResponseEntity.badRequest()
                .body("{\"error\": \"Maximum 100 universe IDs per request.\"}");
        }

        String robloxUrl = "https://thumbnails.roblox.com/v1/games/icons?universeIds=" + universeIds
                + "&returnPolicy=PlaceHolder&size=" + size + "&format=Png&isCircular=false";

        try {
            String response = restTemplate.getForObject(robloxUrl, String.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body("{\"error\": \"Failed to fetch thumbnails from upstream service\"}");
        }
    }
}
