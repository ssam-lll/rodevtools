package com.rodevtools.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RisingStarResponseDto {
    private Long universeId;
    private String name;
    private String creator;
    private Long activePlayers;
    private Double growth24h;
    private Double monthlyRevenueEst;
    private Double healthScore;
}
