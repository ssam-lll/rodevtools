package com.rodevtools.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "game_snapshots")
@Data
@NoArgsConstructor
public class GameSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universe_id", nullable = false)
    private Game game;

    private Long visits;

    private Long playing;

    @CreatedDate
    @Column(name = "timestamp", nullable = false, updatable = false)
    private Instant snapshotTimestamp;


    public GameSnapshot(Game game, Long playing, Long visits) {
        this.game = game;
        this.playing = playing;
        this.visits = visits;
    }
}
