package com.utilityzone.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
//http://localhost:8080/greeting?name=Shyam
@RestController
public class GreetingController {
    
    @GetMapping("/greeting")
    public String getGreeting(@RequestParam(name = "name", required = false, defaultValue = "Guest") String name) {
        if (name == null || name.trim().isEmpty()) {
            name = "Guest";
        }
        return "Hello, " + name.trim() + "!";
    }
}
