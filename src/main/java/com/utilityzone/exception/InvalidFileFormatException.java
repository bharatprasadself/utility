package com.utilityzone.exception;

public class InvalidFileFormatException extends FileConversionException {
    
    public InvalidFileFormatException(String message) {
        super(message);
    }

    public InvalidFileFormatException(String message, Throwable cause) {
        super(message, cause);
    }
}