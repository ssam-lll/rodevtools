package com.rodevtools.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class XRayDetailsDto {
    private Long universeId;
    private String name;
    private String creator;
    private Long visits;
    private Long activePlayers;
    private Double monthlyRevenue;
    private Integer playtime;
    private Double healthScore;
    private List<DailyMetricDto> dailyMetrics;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyMetricDto {
        private String day;
        private Long ccu;
        private Long visits;
        private Integer playtime;
        private Double revenue;
    }
}
