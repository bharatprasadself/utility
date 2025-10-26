package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;

public class NewsletterSendRequest {

    @NotBlank
    private String subject;

    @NotBlank
    private String htmlBody;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getHtmlBody() {
        return htmlBody;
    }

    public void setHtmlBody(String htmlBody) {
        this.htmlBody = htmlBody;
    }
}
