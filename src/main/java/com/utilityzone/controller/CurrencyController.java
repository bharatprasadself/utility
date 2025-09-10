package com.utilityzone.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;
import java.math.BigDecimal;
import java.math.RoundingMode;
//http://localhost:8080/convert?amount=100&fromCurrency=USD&toCurrency=INR
@RestController
public class CurrencyController {
    private final Map<String, BigDecimal> exchangeRates = new HashMap<>();

    public CurrencyController() {
        // Initialize with some major currency exchange rates (relative to USD)
        exchangeRates.put("USD", BigDecimal.ONE);
        exchangeRates.put("EUR", new BigDecimal("0.93")); // 1 USD = 0.93 EUR
        exchangeRates.put("GBP", new BigDecimal("0.79")); // 1 USD = 0.79 GBP
        exchangeRates.put("JPY", new BigDecimal("147.71")); // 1 USD = 147.71 JPY
        exchangeRates.put("AUD", new BigDecimal("1.56")); // 1 USD = 1.56 AUD
        exchangeRates.put("CAD", new BigDecimal("1.36")); // 1 USD = 1.36 CAD
        exchangeRates.put("CHF", new BigDecimal("0.89")); // 1 USD = 0.89 CHF
        exchangeRates.put("CNY", new BigDecimal("7.33")); // 1 USD = 7.33 CNY
        exchangeRates.put("INR", new BigDecimal("83.06")); // 1 USD = 83.06 INR
    }

    @GetMapping("/convert")
    public ResponseEntity<?> convertCurrency(
            @RequestParam BigDecimal amount,
            @RequestParam String fromCurrency,
            @RequestParam String toCurrency) {
        
        try {
            // Validate currencies
            fromCurrency = fromCurrency.toUpperCase();
            toCurrency = toCurrency.toUpperCase();
            
            if (!exchangeRates.containsKey(fromCurrency) || !exchangeRates.containsKey(toCurrency)) {
                return ResponseEntity.badRequest()
                    .body("Invalid currency code. Supported currencies: " + String.join(", ", exchangeRates.keySet()));
            }

            // Convert to USD first (if not already USD)
            BigDecimal amountInUsd;
            if (fromCurrency.equals("USD")) {
                amountInUsd = amount;
            } else {
                amountInUsd = amount.divide(exchangeRates.get(fromCurrency), 6, RoundingMode.HALF_UP);
            }

            // Convert from USD to target currency
            BigDecimal result = amountInUsd.multiply(exchangeRates.get(toCurrency))
                .setScale(2, RoundingMode.HALF_UP);

            Map<String, Object> response = new HashMap<>();
            response.put("from", fromCurrency);
            response.put("to", toCurrency);
            response.put("amount", amount);
            response.put("result", result);
            response.put("rate", exchangeRates.get(toCurrency).divide(exchangeRates.get(fromCurrency), 6, RoundingMode.HALF_UP));

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/currencies")
    public ResponseEntity<Map<String, Object>> getAvailableCurrencies() {
        Map<String, Object> response = new HashMap<>();
        response.put("currencies", exchangeRates.keySet());
        return ResponseEntity.ok(response);
    }
}
