package com.rodevtools.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(
    name = "game_daily_analytics",
    indexes = {
        @Index(name = "idx_game_daily_analytics_universe_date", columnList = "universe_id, date")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_game_daily_analytics_universe_date", columnNames = {"universe_id", "date"})
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyGameAnalytics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "universe_id", nullable = false)
    private Game game;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "average_playing")
    private Long averagePlaying;

    @Column(name = "max_visits")
    private Long maxVisits;

    @Column(name = "min_playing")
    private Long minPlaying;

    @Column(name = "max_playing")
    private Long maxPlaying;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public DailyGameAnalytics(Game game, LocalDate date, Long averagePlaying, Long maxVisits, Long minPlaying, Long maxPlaying) {
        this.game = game;
        this.date = date;
        this.averagePlaying = averagePlaying;
        this.maxVisits = maxVisits;
        this.minPlaying = minPlaying;
        this.maxPlaying = maxPlaying;
    }
}
