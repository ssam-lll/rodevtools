package com.rodevtools.backend.dto;

public record MarketSummaryDto(
    long totalTrackedGames,
    long totalActivePlayers,
    long totalVisits,
    double averageRating,
    double estimatedMarketMonthlyRevenueUsd
) {}
