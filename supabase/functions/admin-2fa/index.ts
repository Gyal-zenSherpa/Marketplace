import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption helpers using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyData = Deno.env.get('TOTP_ENCRYPTION_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!keyData) throw new Error('Encryption key not available');
  
  // Use first 32 bytes of SHA-256 hash of the key as AES key
  const encoder = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(keyData));
  
  return crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV and ciphertext, encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function decryptSecret(ciphertext: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
  
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return new TextDecoder().decode(decrypted);
}

// Hash backup codes using SHA-256 (one-way)
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const normalized = code.toUpperCase().replace('-', '');
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(normalized));
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<number> {
  const codeHash = await hashBackupCode(code);
  return hashedCodes.findIndex(h => h === codeHash);
}

// Simple TOTP implementation
function generateSecret(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  for (let i = 0; i < length; i++) {
    secret += chars[randomBytes[i] % chars.length];
  }
  return secret;
}

function base32ToBytes(base32: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = base32.toUpperCase().replace(/=+$/, '');
  
  let bits = '';
  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

async function generateTOTP(secret: string, timeStep = 30): Promise<string> {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setBigUint64(0, BigInt(counter), false);
  
  const secretBytes = base32ToBytes(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
  const hmac = new Uint8Array(signature);
  
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

async function verifyTOTP(secret: string, token: string, window = 1): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const timeStep = 30;
    const counter = Math.floor(Date.now() / 1000 / timeStep) + i;
    
    const counterBytes = new ArrayBuffer(8);
    const view = new DataView(counterBytes);
    view.setBigUint64(0, BigInt(counter), false);
    
    const secretBytes = base32ToBytes(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, counterBytes);
    const hmac = new Uint8Array(signature);
    
    const offset = hmac[hmac.length - 1] & 0xf;
    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  return false;
}

function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    codes.push(code.slice(0, 4) + '-' + code.slice(4, 8));
  }
  return codes;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, token } = await req.json();
    console.log('2FA action:', action, 'for user:', user.id);

    switch (action) {
      case 'setup': {
        // Generate new secret
        const secret = generateSecret();
        const backupCodes = generateBackupCodes();
        
        // Encrypt the TOTP secret
        const encryptedSecret = await encryptSecret(secret);
        
        // Hash backup codes (one-way) for secure storage
        const hashedBackupCodes = await Promise.all(
          backupCodes.map(code => hashBackupCode(code))
        );
        
        const { error: insertError } = await supabase
          .from('admin_totp_secrets')
          .upsert({
            user_id: user.id,
            encrypted_secret: encryptedSecret,
            backup_codes: hashedBackupCodes,
            is_enabled: false,
          });

        if (insertError) {
          console.error('Error storing secret:', insertError);
          throw new Error('Failed to setup 2FA');
        }

        const otpauth = `otpauth://totp/Marketplace:${user.email}?secret=${secret}&issuer=Marketplace&algorithm=SHA1&digits=6&period=30`;

        // Return plaintext codes ONLY during setup (user must save them)
        return new Response(JSON.stringify({ 
          secret,
          otpauth,
          backupCodes // User sees these only once
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'verify': {
        if (!token || token.length !== 6) {
          return new Response(JSON.stringify({ error: 'Invalid token format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: totpData } = await supabase
          .from('admin_totp_secrets')
          .select('encrypted_secret')
          .eq('user_id', user.id)
          .single();

        if (!totpData) {
          return new Response(JSON.stringify({ error: '2FA not setup' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Decrypt the secret for verification
        const decryptedSecret = await decryptSecret(totpData.encrypted_secret);
        const isValid = await verifyTOTP(decryptedSecret, token);
        
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid verification code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Enable 2FA
        await supabase
          .from('admin_totp_secrets')
          .update({ is_enabled: true })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate': {
        if (!token) {
          return new Response(JSON.stringify({ error: 'Token required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: totpData } = await supabase
          .from('admin_totp_secrets')
          .select('encrypted_secret, backup_codes, is_enabled')
          .eq('user_id', user.id)
          .single();

        if (!totpData || !totpData.is_enabled) {
          return new Response(JSON.stringify({ valid: true, reason: '2fa_not_enabled' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check TOTP code
        if (token.length === 6) {
          const decryptedSecret = await decryptSecret(totpData.encrypted_secret);
          const isValid = await verifyTOTP(decryptedSecret, token);
          if (isValid) {
            return new Response(JSON.stringify({ valid: true }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Check backup codes (hashed comparison)
        const backupCodes = totpData.backup_codes || [];
        const codeIndex = await verifyBackupCode(token, backupCodes);

        if (codeIndex !== -1) {
          // Remove used backup code
          backupCodes.splice(codeIndex, 1);
          await supabase
            .from('admin_totp_secrets')
            .update({ backup_codes: backupCodes })
            .eq('user_id', user.id);

          return new Response(JSON.stringify({ valid: true, backupCodeUsed: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ valid: false, error: 'Invalid code' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        const { data: totpData } = await supabase
          .from('admin_totp_secrets')
          .select('is_enabled')
          .eq('user_id', user.id)
          .single();

        return new Response(JSON.stringify({ 
          enabled: totpData?.is_enabled || false 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'disable': {
        if (!token) {
          return new Response(JSON.stringify({ error: 'Token required to disable' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: totpData } = await supabase
          .from('admin_totp_secrets')
          .select('encrypted_secret')
          .eq('user_id', user.id)
          .single();

        if (!totpData) {
          return new Response(JSON.stringify({ error: '2FA not setup' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const decryptedSecret = await decryptSecret(totpData.encrypted_secret);
        const isValid = await verifyTOTP(decryptedSecret, token);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Invalid code' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await supabase
          .from('admin_totp_secrets')
          .delete()
          .eq('user_id', user.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('2FA error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
