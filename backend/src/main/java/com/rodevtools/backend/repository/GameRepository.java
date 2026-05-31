package com.rodevtools.backend.repository;

import com.rodevtools.backend.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByGameNameContainingIgnoreCase(String name);

    List<Game> findByPlayingBetween(Long minPlaying, Long maxPlaying);
}
