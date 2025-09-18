package com.utilityzone.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpStatus;
import java.util.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.concurrent.locks.ReentrantLock;
//http://localhost:8080/api/currency/convert?amount=100&from=USD&to=INR
@RestController
@RequestMapping("/api/currency")
public class CurrencyController {
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String RATES_API = "https://api.frankfurter.dev/v1/latest";
    private static final String CURRENCIES_API = "https://api.frankfurter.dev/v1/currencies";

    // Caching
    private Map<String, Object> cachedRatesResponse = null;
    private LocalDateTime ratesCacheExpiry = LocalDateTime.MIN;
    private Map<String, String> cachedCurrencies = null;
    private LocalDateTime currenciesCacheExpiry = LocalDateTime.MIN;
    private final ReentrantLock cacheLock = new ReentrantLock();

    private LocalDateTime next1630CET() {
        // CET is UTC+1 or CEST (summer) is UTC+2
        ZoneId cetZone = ZoneId.of("Europe/Paris"); // Paris observes CET/CEST
        ZonedDateTime nowCET = ZonedDateTime.now(cetZone);
        ZonedDateTime today1630 = nowCET.withHour(16).withMinute(30).withSecond(0).withNano(0);
        if (nowCET.isAfter(today1630)) {
            today1630 = today1630.plusDays(1);
        }
        // Convert back to server local time
        return today1630.withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convertCurrency(
            @RequestParam BigDecimal amount,
            @RequestParam String from,
            @RequestParam String to) {
        try {
            String fromCurrency = from.toUpperCase();
            String toCurrency = to.toUpperCase();

            Map response;
            cacheLock.lock();
            try {
                boolean cacheValid = cachedRatesResponse != null && ratesCacheExpiry.isAfter(LocalDateTime.now());
                if (!cacheValid) {
                    // Fetch new rates (for all currencies)
                    cachedRatesResponse = restTemplate.getForObject(RATES_API, Map.class);
                    ratesCacheExpiry = next1630CET();
                }
                response = cachedRatesResponse;
            } finally {
                cacheLock.unlock();
            }

            if (response == null || !response.containsKey("rates")) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Failed to fetch rates from provider."));
            }
            Map<String, Object> rates = (Map<String, Object>) response.get("rates");
            // If fromCurrency is not EUR, we need to convert via EUR (Frankfurter base is EUR)
            BigDecimal baseAmount = amount;
            if (!"EUR".equals(fromCurrency)) {
                // Convert from 'fromCurrency' to EUR
                Object fromRateObj = rates.get(fromCurrency);
                if (fromRateObj == null) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid source currency or not supported by provider."));
                }
                BigDecimal fromRate = new BigDecimal(fromRateObj.toString());
                baseAmount = amount.divide(fromRate, 8, RoundingMode.HALF_UP);
            }
            // Now convert from EUR to target
            Object toRateObj = rates.get(toCurrency);
            if (toRateObj == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid target currency or not supported by provider."));
            }
            BigDecimal toRate = new BigDecimal(toRateObj.toString());
            BigDecimal result = baseAmount.multiply(toRate).setScale(2, RoundingMode.HALF_UP);

            Map<String, Object> conversionResult = new HashMap<>();
            conversionResult.put("from", fromCurrency);
            conversionResult.put("to", toCurrency);
            conversionResult.put("amount", amount);
            conversionResult.put("result", result);
            conversionResult.put("rate", result.divide(amount, 6, RoundingMode.HALF_UP));

            return ResponseEntity.ok(Map.of("data", conversionResult));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/currencies")
    public ResponseEntity<Map<String, Object>> getAvailableCurrencies() {
        try {
            Map<String, String> currencies;
            cacheLock.lock();
            try {
                boolean cacheValid = cachedCurrencies != null && currenciesCacheExpiry.isAfter(LocalDateTime.now());
                if (!cacheValid) {
                    cachedCurrencies = restTemplate.getForObject(CURRENCIES_API, Map.class);
                    currenciesCacheExpiry = next1630CET();
                }
                currencies = cachedCurrencies;
            } finally {
                cacheLock.unlock();
            }
            if (currencies == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", "Failed to fetch currencies from provider."));
            }
            // Build a list of { code, description } objects
            List<Map<String, String>> currencyList = new ArrayList<>();
            for (Map.Entry<String, String> entry : currencies.entrySet()) {
                currencyList.add(Map.of("code", entry.getKey(), "description", entry.getValue()));
            }
            return ResponseEntity.ok(Map.of("data", Map.of("currencies", currencyList)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error: " + e.getMessage()));
        }
    }
}
