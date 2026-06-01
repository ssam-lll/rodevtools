package com.rodevtools.backend.repository.projection;

import java.time.LocalDate;

public interface DailyAnalyticsProjection {
    LocalDate getDate();
    Long getAveragePlaying();
    Long getMaxVisits();
}
