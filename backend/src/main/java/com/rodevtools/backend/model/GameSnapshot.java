package com.rodevtools.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_snapshots")
@Data
@RequiredArgsConstructor


public class GameSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universe_id", nullable = false)
    private Game game;

    private Long visits;

    private Long playing;

    private LocalDateTime snapshotTimestamp;


}
