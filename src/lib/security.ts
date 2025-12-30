/**
 * Security Utilities
 * Comprehensive security helpers for input validation, sanitization, and XSS prevention
 */

import { z } from 'zod';
import DOMPurify from 'dompurify';

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize string for safe display (escape HTML entities)
 */
export function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
}

/**
 * Sanitize string for use in URLs
 */
export function sanitizeUrlParam(param: string): string {
  return encodeURIComponent(param.trim());
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 255);
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

/**
 * Strong password validation schema
 * Requires: 8+ chars, uppercase, lowercase, number, special char
 */
export const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .transform((email) => email.toLowerCase());

/**
 * Name validation schema (prevents injection attacks)
 */
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[\p{L}\p{M}\s'-]+$/u, 'Name contains invalid characters');

/**
 * Phone validation schema
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number is too long')
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format');

/**
 * Address validation schema
 */
export const addressSchema = z
  .string()
  .trim()
  .min(5, 'Address is too short')
  .max(200, 'Address must be less than 200 characters')
  .regex(/^[\p{L}\p{N}\s,.'-]+$/u, 'Address contains invalid characters');

/**
 * Product name validation (prevents injection)
 */
export const productNameSchema = z
  .string()
  .trim()
  .min(2, 'Product name must be at least 2 characters')
  .max(200, 'Product name must be less than 200 characters');

/**
 * Price validation schema
 */
export const priceSchema = z
  .number()
  .positive('Price must be positive')
  .max(1000000, 'Price exceeds maximum allowed');

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

// ============================================
// RATE LIMITING (Client-side tracking)
// ============================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Client-side rate limit check (supplement server-side rate limiting)
 */
export function checkClientRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================
// CSRF PROTECTION
// ============================================

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Store CSRF token in session storage
 */
export function storeCsrfToken(token: string): void {
  try {
    sessionStorage.setItem('csrf_token', token);
  } catch {
    // Session storage not available (e.g., private browsing)
  }
}

/**
 * Get stored CSRF token
 */
export function getCsrfToken(): string | null {
  try {
    return sessionStorage.getItem('csrf_token');
  } catch {
    return null;
  }
}

// ============================================
// CONTENT SECURITY
// ============================================

/**
 * Validate file type for uploads
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): boolean {
  const mimeType = file.type.toLowerCase();
  return allowedTypes.some(type => mimeType.startsWith(type));
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number
): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Safe file upload validator
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  if (!validateFileSize(file, maxSizeBytes)) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return { valid: false, error: `File must be smaller than ${maxSizeMB}MB` };
  }

  if (!validateFileType(file, allowedTypes)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check for double extensions (potential attack vector)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const dangerousExtensions = ['exe', 'php', 'js', 'html', 'htm', 'sh', 'bat'];
    for (const ext of parts.slice(0, -1)) {
      if (dangerousExtensions.includes(ext.toLowerCase())) {
        return { valid: false, error: 'Invalid file name' };
      }
    }
  }

  return { valid: true };
}

// ============================================
// URL VALIDATION
// ============================================

/**
 * Validate URL to prevent SSRF attacks
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }
    // Block internal IPs and localhost
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'];
    if (blockedHosts.includes(parsed.hostname)) {
      return false;
    }
    // Block internal IP ranges
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(parsed.hostname)) {
      const parts = parsed.hostname.split('.').map(Number);
      // Block 10.x.x.x, 172.16-31.x.x, 192.168.x.x
      if (
        parts[0] === 10 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate image URL specifically
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return true; // Empty is valid (optional)
  if (!isValidUrl(url)) return false;
  
  // Check for common image extensions or data URIs
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowerUrl = url.toLowerCase();
  
  // Allow data URIs for images
  if (lowerUrl.startsWith('data:image/')) return true;
  
  // Check extension
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

// ============================================
// SECURITY HEADERS (for reference)
// ============================================

/**
 * Recommended security headers
 * These should be set at the server/CDN level
 */
export const recommendedSecurityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://ai.gateway.lovable.dev",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
