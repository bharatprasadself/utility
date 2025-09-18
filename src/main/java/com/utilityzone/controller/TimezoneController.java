package com.utilityzone.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.time.zone.ZoneRulesException;
//http://localhost:8080/api/timezone/convert?fromTimezone=Europe/London&toTimezone=Asia/Kolkata
@RestController
@RequestMapping("/api/timezone")
public class TimezoneController {
    
    // Major timezones for quick selection
    private static final List<String> MAJOR_TIMEZONES = List.of(
        "America/New_York",      // New York, USA
        "America/Los_Angeles",   // Los Angeles, USA
        "America/Chicago",       // Chicago, USA
        "Europe/London",         // London, UK
        "Europe/Paris",          // Paris, France
        "Europe/Berlin",         // Berlin, Germany
        "Asia/Kolkata",          // Mumbai/New Delhi/Kolkata, India (IST)
        "Asia/Tokyo",            // Tokyo, Japan
        "Asia/Shanghai",         // Shanghai, China
        "Asia/Dubai",            // Dubai, UAE
        "Asia/Singapore",        // Singapore
        "Australia/Sydney",      // Sydney, Australia
        "Pacific/Auckland"       // Auckland, New Zealand
    );

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

    @GetMapping("/all-timezones")
    public ResponseEntity<Map<String, Object>> getAllTimezones() {
        Set<String> zoneIds = ZoneId.getAvailableZoneIds();
        List<String> timezoneList = new ArrayList<>();
        DateTimeFormatter abbrFormatter = DateTimeFormatter.ofPattern("z");
        for (String zoneId : zoneIds) {
            try {
                ZoneId zid = ZoneId.of(zoneId);
                ZonedDateTime now = ZonedDateTime.now(zid);
                String abbreviation = abbrFormatter.format(now); // More robust abbreviation
                String offset = now.getOffset().toString();
                String info = zoneId + " - " + abbreviation + " (UTC" + offset + ")";
                timezoneList.add(info);
            } catch (Exception e) {
                // skip invalid zone
            }
        }
        Collections.sort(timezoneList);
        return ResponseEntity.ok(Map.of(
            "data", Map.of("timezones", timezoneList)
        ));
    }

    @GetMapping("/major-timezones")
    public ResponseEntity<Map<String, Object>> getMajorTimezones() {
        List<String> timezoneList = new ArrayList<>();
        DateTimeFormatter abbrFormatter = DateTimeFormatter.ofPattern("z");
        for (String zoneId : MAJOR_TIMEZONES) {
            try {
                ZoneId zid = ZoneId.of(zoneId);
                ZonedDateTime now = ZonedDateTime.now(zid);
                String abbreviation = abbrFormatter.format(now);
                String offset = now.getOffset().toString();
                String info = zoneId + " - " + abbreviation + " (UTC" + offset + ")";
                timezoneList.add(info);
            } catch (Exception e) {
                // skip invalid zone
            }
        }
        return ResponseEntity.ok(Map.of(
            "data", Map.of("timezones", timezoneList)
        ));
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentTime(@RequestParam String timezone) {
        try {
            ZoneId zoneId = ZoneId.of(timezone);
            ZonedDateTime zonedDateTime = ZonedDateTime.now(zoneId);
            
            Map<String, Object> info = new HashMap<>();
            info.put("timezone", timezone);
            info.put("currentTime", zonedDateTime.format(formatter));
            info.put("offset", zonedDateTime.getOffset().toString());
            
            return ResponseEntity.ok(Map.of("data", info));
        } catch (ZoneRulesException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid timezone. Please use one of the supported timezones from /timezones endpoint"));
        }
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convertTime(
            @RequestParam String fromTimezone,
            @RequestParam String toTimezone,
            @RequestParam(required = false) String dateTime) {
        
        try {
            ZoneId sourceZone = ZoneId.of(fromTimezone);
            ZoneId targetZone = ZoneId.of(toTimezone);
            
            ZonedDateTime sourceTime;
            if (dateTime != null && !dateTime.trim().isEmpty()) {
                // If dateTime is provided, parse it (expecting format: yyyy-MM-dd HH:mm:ss)
                sourceTime = ZonedDateTime.parse(dateTime.trim() + " " + fromTimezone,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z"));
            } else {
                // Use current time if no dateTime provided
                sourceTime = ZonedDateTime.now(sourceZone);
            }
            
            ZonedDateTime targetTime = sourceTime.withZoneSameInstant(targetZone);
            
            Map<String, Object> conversionInfo = new HashMap<>();
            conversionInfo.put("fromTimezone", fromTimezone);
            conversionInfo.put("toTimezone", toTimezone);
            conversionInfo.put("sourceTime", sourceTime.format(formatter));
            conversionInfo.put("convertedTime", targetTime.format(formatter));
            conversionInfo.put("hoursDifference", 
                (targetZone.getRules().getOffset(targetTime.toInstant()).getTotalSeconds() - 
                 sourceZone.getRules().getOffset(sourceTime.toInstant()).getTotalSeconds()) / 3600.0);
            
            return ResponseEntity.ok(Map.of("data", conversionInfo));
        } catch (ZoneRulesException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Invalid timezone. Please use one of the supported timezones from /timezones endpoint"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("message", "Error: " + e.getMessage() + ". For custom time, use format: yyyy-MM-dd HH:mm:ss"));
        }
    }
}
