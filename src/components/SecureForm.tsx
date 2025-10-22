// SECURE FORM COMPONENT - Input Validation & Security
// ===================================================

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { 
  sanitizeInput, 
  isValidEmail, 
  isValidPhone, 
  isValidCardNumber, 
  isValidCVV, 
  isValidExpiryDate,
  isValidAddress,
  containsSQLInjection,
  RateLimiter,
  INPUT_LIMITS,
  logSecurityEvent
} from '@/utils/security';

interface SecureFormProps {
  onSubmit: (data: any) => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
}

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'card' | 'cvv' | 'expiry' | 'address';
  validation: ValidationRule;
  placeholder?: string;
}

const SecureForm: React.FC<SecureFormProps> = ({ onSubmit, onError, children }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityScore, setSecurityScore] = useState(0);
  const rateLimiter = new RateLimiter();

  const validateField = (name: string, value: string, rules: ValidationRule): string | null => {
    // Sanitize input first
    const sanitizedValue = sanitizeInput(value);
    
    // Check for SQL injection
    if (containsSQLInjection(sanitizedValue)) {
      logSecurityEvent('SQL_INJECTION_ATTEMPT', { field: name, value: sanitizedValue });
      return 'Invalid input detected';
    }
    
    // Required field check
    if (rules.required && !sanitizedValue.trim()) {
      return 'This field is required';
    }
    
    if (!sanitizedValue.trim()) return null; // Empty optional field is OK
    
    // Length checks
    if (rules.minLength && sanitizedValue.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }
    
    // Pattern check
    if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
      return rules.message;
    }
    
    // Custom validation
    if (rules.custom && !rules.custom(sanitizedValue)) {
      return rules.message;
    }
    
    return null;
  };

  const validateForm = (data: Record<string, string>, fieldConfigs: FieldConfig[]): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Rate limiting check
    const clientId = 'form_submission';
    if (!rateLimiter.isAllowed(clientId, 5, 60000)) {
      newErrors._rateLimit = 'Too many attempts. Please wait before trying again.';
      isValid = false;
    }
    
    fieldConfigs.forEach(field => {
      const value = data[field.name] || '';
      const error = validateField(field.name, value, field.validation);
      
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (data: Record<string, string>, fieldConfigs: FieldConfig[]) => {
    setIsSubmitting(true);
    
    try {
      // Security validation
      if (!validateForm(data, fieldConfigs)) {
        if (onError) {
          onError('Please fix the errors below');
        }
        return;
      }
      
      // Log successful submission
      logSecurityEvent('FORM_SUBMISSION_SUCCESS', { 
        fields: Object.keys(data),
        timestamp: new Date().toISOString()
      });
      
      // Submit the form
      await onSubmit(data);
      
    } catch (error) {
      logSecurityEvent('FORM_SUBMISSION_ERROR', { 
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      if (onError) {
        onError(error.message || 'Submission failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateSecurityScore = (data: Record<string, string>): number => {
    let score = 0;
    const totalChecks = 5;
    
    // Check for strong inputs
    if (data.email && isValidEmail(data.email)) score++;
    if (data.phone && isValidPhone(data.phone)) score++;
    if (data.cardNumber && isValidCardNumber(data.cardNumber)) score++;
    if (data.cvv && isValidCVV(data.cvv)) score++;
    if (data.expiryDate && isValidExpiryDate(data.expiryDate)) score++;
    
    return Math.round((score / totalChecks) * 100);
  };

  useEffect(() => {
    const score = calculateSecurityScore(formData);
    setSecurityScore(score);
  }, [formData]);

  return (
    <div className="space-y-4">
      {/* Security Score Indicator */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <Shield className="w-5 h-5 text-blue-600" />
        <span className="text-sm font-medium">Security Score:</span>
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              securityScore >= 80 ? 'bg-green-500' : 
              securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${securityScore}%` }}
          />
        </div>
        <span className="text-sm font-medium">{securityScore}%</span>
      </div>
      
      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Form Content */}
      {children}
    </div>
  );
};

// Secure Input Component
interface SecureInputProps {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'password' | 'card' | 'cvv' | 'expiry' | 'address';
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  name,
  label,
  type,
  placeholder,
  required = false,
  value,
  onChange,
  error
}) => {
  const getValidationRules = (): ValidationRule => {
    switch (type) {
      case 'email':
        return {
          required,
          maxLength: INPUT_LIMITS.EMAIL,
          custom: isValidEmail,
          message: 'Please enter a valid email address'
        };
      case 'tel':
        return {
          required,
          maxLength: INPUT_LIMITS.PHONE,
          custom: isValidPhone,
          message: 'Please enter a valid phone number'
        };
      case 'card':
        return {
          required,
          maxLength: INPUT_LIMITS.CARD_NUMBER,
          custom: isValidCardNumber,
          message: 'Please enter a valid card number'
        };
      case 'cvv':
        return {
          required,
          maxLength: INPUT_LIMITS.CVV,
          custom: isValidCVV,
          message: 'Please enter a valid CVV'
        };
      case 'expiry':
        return {
          required,
          maxLength: INPUT_LIMITS.EXPIRY,
          custom: isValidExpiryDate,
          message: 'Please enter a valid expiry date (MM/YY)'
        };
      case 'address':
        return {
          required,
          minLength: 10,
          maxLength: INPUT_LIMITS.ADDRESS,
          custom: isValidAddress,
          message: 'Please enter a valid address'
        };
      default:
        return {
          required,
          maxLength: INPUT_LIMITS.NAME,
          message: 'Please enter a valid value'
        };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Format based on input type
    if (type === 'card') {
      newValue = newValue.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    } else if (type === 'expiry') {
      newValue = newValue.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/');
    } else if (type === 'cvv') {
      newValue = newValue.replace(/\D/g, '');
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {!error && value && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </Label>
      
      <Input
        id={name}
        type={type === 'card' || type === 'cvv' ? 'text' : type}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        className={error ? 'border-red-500' : ''}
        maxLength={getValidationRules().maxLength}
      />
      
      {error && (
        <p className="text-sm text-red-500 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

export default SecureForm;
