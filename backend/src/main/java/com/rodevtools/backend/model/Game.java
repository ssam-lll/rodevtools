package com.rodevtools.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Data
@RequiredArgsConstructor


public class Game {

    @Id
    private Long universeId;

    @Column(nullable = false)
    private String gameName;

    private String description;

    private Long visits;

    private Long playing;

    private Long likes;

    private Long dislikes;

    private Double rating;

    private String creatorName;

    private Long creatorId;

    private LocalDateTime robloxCreatedAt;

    private LocalDateTime robloxUpdatedAt;

    private LocalDateTime lastSyncedAt;




}
