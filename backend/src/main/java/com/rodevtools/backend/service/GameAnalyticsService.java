package com.rodevtools.backend.service;

import com.rodevtools.backend.repository.GameRepository;
import com.rodevtools.backend.repository.projection.RisingStarProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class GameAnalyticsService {

    private final GameRepository gameRepository;

    public Page<RisingStarProjection> getRisingStars(Long minPlaying, Long maxPlaying, Instant since, String search, Pageable pageable){
        return gameRepository.findRisingStarsNative(minPlaying, maxPlaying, since, search, pageable);
    }
}

