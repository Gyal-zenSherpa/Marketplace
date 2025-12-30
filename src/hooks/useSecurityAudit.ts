/**
 * Security Audit Hook
 * Provides security-related functionality for components
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Hook for security monitoring and audit logging
 */
export function useSecurityAudit() {
  const lastActivityRef = useRef<number>(Date.now());

  // Track user activity for session management
  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  /**
   * Log a security event (for critical actions)
   */
  const logSecurityEvent = useCallback(async (event: SecurityEvent) => {
    try {
      // Only log to console in development for debugging
      if (import.meta.env.DEV) {
        console.debug('[Security Audit]', event);
      }

      // In production, this would be sent to the edge function
      // The edge function handles insertion with service role
    } catch (error) {
      // Silently fail - don't disrupt user experience for logging failures
      console.error('Failed to log security event:', error);
    }
  }, []);

  /**
   * Check for session timeout
   */
  const checkSessionTimeout = useCallback((timeoutMs: number = 30 * 60 * 1000) => {
    const inactiveTime = Date.now() - lastActivityRef.current;
    return inactiveTime > timeoutMs;
  }, []);

  /**
   * Validate session is still active
   */
  const validateSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        return false;
      }
      
      // Check if token is expired
      const expiresAt = session.expires_at;
      if (expiresAt && Date.now() / 1000 > expiresAt) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    logSecurityEvent,
    checkSessionTimeout,
    validateSession,
  };
}

/**
 * Hook for detecting suspicious behavior
 */
export function useSuspiciousActivityDetection() {
  const failedAttemptsRef = useRef<number>(0);
  const rapidClicksRef = useRef<{ count: number; startTime: number }>({
    count: 0,
    startTime: Date.now(),
  });

  /**
   * Track failed authentication attempts
   */
  const trackFailedAttempt = useCallback(() => {
    failedAttemptsRef.current++;
    return failedAttemptsRef.current;
  }, []);

  /**
   * Reset failed attempts counter
   */
  const resetFailedAttempts = useCallback(() => {
    failedAttemptsRef.current = 0;
  }, []);

  /**
   * Check if account should be temporarily locked
   */
  const shouldLockAccount = useCallback((maxAttempts: number = 5) => {
    return failedAttemptsRef.current >= maxAttempts;
  }, []);

  /**
   * Track rapid clicks (potential bot behavior)
   */
  const trackClick = useCallback(() => {
    const now = Date.now();
    const windowMs = 1000; // 1 second window
    
    if (now - rapidClicksRef.current.startTime > windowMs) {
      rapidClicksRef.current = { count: 1, startTime: now };
    } else {
      rapidClicksRef.current.count++;
    }
    
    return rapidClicksRef.current.count;
  }, []);

  /**
   * Check for bot-like behavior
   */
  const isSuspiciousClickPattern = useCallback((threshold: number = 10) => {
    return rapidClicksRef.current.count > threshold;
  }, []);

  return {
    trackFailedAttempt,
    resetFailedAttempts,
    shouldLockAccount,
    trackClick,
    isSuspiciousClickPattern,
  };
}
