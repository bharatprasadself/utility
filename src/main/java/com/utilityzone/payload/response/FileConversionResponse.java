package com.utilityzone.payload.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileConversionResponse {
    private byte[] convertedFile;
    private String contentType;
    private String fileName;
    private String format;
}