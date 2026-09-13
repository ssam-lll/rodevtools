package com.rodevtools.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GameResponseDto {
    private Long universeId;
    private Long rootPlaceId;
    private String name;
    private String creator;
    private Long activePlayers;
    private Long visits;
    private Double healthScore;
    private String category;
    private Double monthlyRevenue;
    private Integer playtime;
}
