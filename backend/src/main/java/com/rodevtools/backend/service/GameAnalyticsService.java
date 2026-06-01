package com.rodevtools.backend.service;

import com.rodevtools.backend.repository.GameRepository;
import com.rodevtools.backend.repository.projection.RisingStarProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameAnalyticsService {

    private final GameRepository gameRepository;

    public List<RisingStarProjection> getRisingStars(Long minPlaying, Long maxPlaying, LocalDateTime since){
        return gameRepository.findRisingStarsNative(minPlaying, maxPlaying, since);
    }
}

