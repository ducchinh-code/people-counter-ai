package com.peoplecounter.core.module.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsResponse {

    private Long cameraId;
    private String cameraName;
    private String date;
    private int totalIn;
    private int totalOut;
    private int totalPeople;
    private String peakHour;
    private int peakTotal;
    private List<HourlyData> hourlyData;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HourlyData {
        private String hour;
        private int inCount;
        private int outCount;
        private int total;
        private boolean partial;
    }
}