package com.utilityzone.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.Arrays;

public class FileFormatValidator implements ConstraintValidator<ValidFileFormat, String> {
    
    private String[] allowedFormats;

    @Override
    public void initialize(ValidFileFormat constraintAnnotation) {
        this.allowedFormats = constraintAnnotation.allowedFormats();
    }

    @Override
    public boolean isValid(String format, ConstraintValidatorContext context) {
        if (format == null || format.trim().isEmpty()) {
            return false;
        }
        return Arrays.asList(allowedFormats)
                    .stream()
                    .anyMatch(f -> f.equalsIgnoreCase(format.trim()));
    }
}