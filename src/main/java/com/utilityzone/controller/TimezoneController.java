package com.utilityzone.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import java.time.ZonedDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.time.zone.ZoneRulesException;
//http://localhost:8080/timezone/convert?fromTimezone=Europe/London&toTimezone=Asia/Kolkata
@RestController
public class TimezoneController {
    
    private final Set<String> majorTimezones = new LinkedHashSet<>(Arrays.asList(
        "America/New_York",      // New York, USA
        "America/Los_Angeles",   // Los Angeles, USA
        "America/Chicago",       // Chicago, USA
        "Europe/London",         // London, UK
        "Europe/Paris",          // Paris, France
        "Europe/Berlin",         // Berlin, Germany
        "Asia/Kolkata",         // Mumbai/New Delhi/Kolkata, India (IST)
        "Asia/Tokyo",           // Tokyo, Japan
        "Asia/Shanghai",        // Shanghai, China
        "Asia/Dubai",           // Dubai, UAE
        "Asia/Singapore",       // Singapore
        "Australia/Sydney",     // Sydney, Australia
        "Pacific/Auckland"      // Auckland, New Zealand
    ));

    private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss z");

    @GetMapping("/timezones")
    public ResponseEntity<Map<String, Object>> getAvailableTimezones() {
        Map<String, Object> response = new HashMap<>();
        response.put("timezones", majorTimezones);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/timezone/current")
    public ResponseEntity<?> getCurrentTime(@RequestParam String timezone) {
        try {
            ZoneId zoneId = ZoneId.of(timezone);
            ZonedDateTime zonedDateTime = ZonedDateTime.now(zoneId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("timezone", timezone);
            response.put("currentTime", zonedDateTime.format(formatter));
            response.put("offset", zonedDateTime.getOffset().toString());
            
            return ResponseEntity.ok(response);
        } catch (ZoneRulesException e) {
            return ResponseEntity.badRequest()
                .body("Invalid timezone. Please use one of the supported timezones from /timezones endpoint");
        }
    }

    @GetMapping("/timezone/convert")
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
            
            Map<String, Object> response = new HashMap<>();
            response.put("fromTimezone", fromTimezone);
            response.put("toTimezone", toTimezone);
            response.put("sourceTime", sourceTime.format(formatter));
            response.put("convertedTime", targetTime.format(formatter));
            response.put("hoursDifference", 
                (targetZone.getRules().getOffset(targetTime.toInstant()).getTotalSeconds() - 
                 sourceZone.getRules().getOffset(sourceTime.toInstant()).getTotalSeconds()) / 3600.0);
            
            return ResponseEntity.ok(response);
        } catch (ZoneRulesException e) {
            return ResponseEntity.badRequest()
                .body("Invalid timezone. Please use one of the supported timezones from /timezones endpoint");
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body("Error: " + e.getMessage() + ". For custom time, use format: yyyy-MM-dd HH:mm:ss");
        }
    }
}
