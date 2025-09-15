import { NextRequest, NextResponse } from 'next/server';
import { auditService } from '@/services/auditService';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Input validation patterns
const validationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  trackingNumber: /^[A-Z]{3}\d{9}$/,
  alphanumeric: /^[a-zA-Z0-9\s-_]+$/,
  numeric: /^\d+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Suspicious patterns to detect potential attacks
const suspiciousPatterns = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /\b(union|select|insert|update|delete|drop|create|alter)\b/gi,
  /\.\.\//g,
  /%2e%2e%2f/gi,
  /\x00/g
];

export interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  enableCSRF: boolean;
  enableAuditLogging: boolean;
  strictValidation: boolean;
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100
  },
  enableCSRF: true,
  enableAuditLogging: true,
  strictValidation: true
};

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Main middleware function
  async handle(request: NextRequest): Promise<NextResponse> {
    const response = NextResponse.next();
    const clientIP = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const url = request.url;

    try {
      // Apply security headers
      this.applySecurityHeaders(response);

      // Rate limiting
      if (!this.checkRateLimit(clientIP)) {
        await this.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip: clientIP,
          userAgent,
          url
        });
        return new NextResponse('Rate limit exceeded', { status: 429 });
      }

      // Input validation for POST/PUT requests
      if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const validationResult = await this.validateRequest(request);
        if (!validationResult.isValid) {
          await this.logSecurityEvent('INVALID_INPUT', {
            ip: clientIP,
            userAgent,
            url,
            errors: validationResult.errors
          });
          return new NextResponse(
            JSON.stringify({ error: 'Invalid input', details: validationResult.errors }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check for suspicious patterns
      const suspiciousActivity = this.detectSuspiciousActivity(request);
      if (suspiciousActivity.length > 0) {
        await this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
          ip: clientIP,
          userAgent,
          url,
          patterns: suspiciousActivity
        });
        // Don't block, but log for monitoring
      }

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      return response; // Continue on error to avoid breaking the app
    }
  }

  // Apply security headers to response
  private applySecurityHeaders(response: NextResponse): void {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Get client IP address
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('x-remote-addr');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (remoteAddr) {
      return remoteAddr;
    }
    return 'unknown';
  }

  // Rate limiting check
  private checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const key = `rate_limit_${clientIP}`;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimit.windowMs
      });
      return true;
    }

    if (record.count >= this.config.rateLimit.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  // Validate request input
  private async validateRequest(request: NextRequest): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.clone().json();
        this.validateObject(body, '', errors);
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.clone().formData();
        for (const [key, value] of formData.entries()) {
          this.validateValue(key, value.toString(), errors);
        }
      }
    } catch (error) {
      errors.push('Invalid request format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate object recursively
  private validateObject(obj: any, path: string, errors: string[]): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string') {
        this.validateValue(currentPath, value, errors);
      } else if (typeof value === 'object') {
        this.validateObject(value, currentPath, errors);
      }
    }
  }

  // Validate individual values
  private validateValue(key: string, value: string, errors: string[]): void {
    // Check for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(value)) {
        errors.push(`Suspicious pattern detected in ${key}`);
        break;
      }
    }

    // Length validation
    if (value.length > 10000) {
      errors.push(`Value too long in ${key}`);
    }

    // Specific field validations
    if (key.toLowerCase().includes('email') && !validationPatterns.email.test(value)) {
      errors.push(`Invalid email format in ${key}`);
    }

    if (key.toLowerCase().includes('tracking') && value.startsWith('TRK') && !validationPatterns.trackingNumber.test(value)) {
      errors.push(`Invalid tracking number format in ${key}`);
    }
  }

  // Detect suspicious activity patterns
  private detectSuspiciousActivity(request: NextRequest): string[] {
    const suspicious: string[] = [];
    const url = request.url;
    const userAgent = request.headers.get('user-agent') || '';

    // Check URL for suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url)) {
        suspicious.push(`Suspicious URL pattern: ${pattern.source}`);
      }
    }

    // Check for common attack patterns in headers
    const headers = ['referer', 'x-forwarded-for', 'x-real-ip'];
    for (const headerName of headers) {
      const headerValue = request.headers.get(headerName);
      if (headerValue) {
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(headerValue)) {
            suspicious.push(`Suspicious header ${headerName}: ${pattern.source}`);
          }
        }
      }
    }

    // Check for suspicious user agents
    const suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /nmap/i,
      /masscan/i
    ];

    for (const pattern of suspiciousUserAgents) {
      if (pattern.test(userAgent)) {
        suspicious.push(`Suspicious user agent: ${userAgent}`);
      }
    }

    return suspicious;
  }

  // Log security events
  private async logSecurityEvent(event: string, details: any): Promise<void> {
    if (!this.config.enableAuditLogging) {
      return;
    }

    try {
      await auditService.logAction(
        'system',
        'Security System',
        event,
        'security',
        details,
        { severity: 'high' }
      );
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Clean up rate limit store (call periodically)
  public cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Input sanitization utilities
export class InputSanitizer {
  // Sanitize HTML input
  static sanitizeHTML(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize SQL input (basic)
  static sanitizeSQL(input: string): string {
    return input
      .replace(/[';"\\]/g, '')
      .replace(/\b(union|select|insert|update|delete|drop|create|alter)\b/gi, '');
  }

  // Sanitize file path
  static sanitizeFilePath(input: string): string {
    return input
      .replace(/\.\./g, '')
      .replace(/[<>:"|?*]/g, '')
      .replace(/^[\s\.]+|[\s\.]+$/g, '');
  }

  // Validate and sanitize tracking number
  static validateTrackingNumber(input: string): { isValid: boolean; sanitized: string } {
    const sanitized = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isValid = validationPatterns.trackingNumber.test(sanitized);
    return { isValid, sanitized };
  }

  // Validate email
  static validateEmail(input: string): boolean {
    return validationPatterns.email.test(input.trim().toLowerCase());
  }
}

// Export singleton instance
export const securityMiddleware = new SecurityMiddleware();
export default SecurityMiddleware;