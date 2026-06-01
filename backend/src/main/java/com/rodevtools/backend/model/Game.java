package com.rodevtools.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "games")
@Data
@NoArgsConstructor


public class Game {

    @Id
    private Long universeId;

    @Column(name = "name", nullable = false)
    private String gameName;

    @Column(columnDefinition = "TEXT")
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

    @Column(name = "category")
    private String category;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant lastSyncedAt;

}
