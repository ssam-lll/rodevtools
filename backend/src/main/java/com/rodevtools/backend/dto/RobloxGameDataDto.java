package com.rodevtools.backend.dto;

import java.time.LocalDateTime;

public record RobloxGameDataDto(
    Long universeId,
    String gameName,
    String description,
    Long visits,
    Long playing,
    Long likes,
    Long dislikes,
    String creatorName,
    Long creatorId,
    LocalDateTime robloxCreatedAt,
    LocalDateTime robloxUpdatedAt
) {}
