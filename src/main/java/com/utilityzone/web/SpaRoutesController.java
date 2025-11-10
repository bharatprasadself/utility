package com.utilityzone.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA route forwarder: in production the built React app is served from /index.html.
 * Deep links (direct browser navigation) to client-side routes like /reset-password
 * would 404 without a backend forward because Spring only serves existing static files.
 *
 * We explicitly forward known client-side routes (without a trailing file extension)
 * to index.html so the React router can take over. API and upload paths are excluded
 * by not being mapped here.
 */
@Controller
public class SpaRoutesController {

    @GetMapping({
            "/reset-password",
            "/forgot-password",
            "/login",
            "/register",
            "/profile"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html"; // Let React Router handle the actual view
    }
}
