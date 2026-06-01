package com.rodevtools.backend.repository.projection;

public interface RisingStarProjection {
    Long getUniverseId();
    String getName();
    Long getCurrentCcu();
    Double getGrowthRate();
    String getCreatorName();
    Double getHealthScore();
}
