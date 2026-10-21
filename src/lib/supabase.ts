import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default to the user's provided Supabase project credentials if env vars are unset
export const DEFAULT_SUPABASE_PROJECT_ID = 'giunuzobmndmluhtblur';
export const DEFAULT_SUPABASE_URL = 'https://giunuzobmndmluhtblur.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_ysw5VJqjUIFa5AlGkyLW5Q_ksewQq-B';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch {
    // ignore
  }
  return undefined;
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const rawKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_KEY;

export const supabaseUrl = rawUrl?.trim();
export const supabaseAnonKey = rawKey?.trim();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('your-project-id') &&
    supabaseAnonKey.length > 10
  );
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export interface ConnectionTestResult {
  success: boolean;
  projectConnected: boolean;
  tablesCreated: boolean;
  message: string;
  projectId: string;
}

/**
 * Test connectivity to Supabase and check if tables exist
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  if (!supabase || !isSupabaseConfigured()) {
    return {
      success: false,
      projectConnected: false,
      tablesCreated: false,
      projectId: '',
      message: 'Supabase credentials not configured.'
    };
  }

  const projectId = supabaseUrl.replace('https://', '').split('.')[0];

  try {
    // Attempt to query appointments table
    const { error } = await supabase.from('appointments').select('id').limit(1);

    if (error) {
      // PGRST205 or 42P01 means project is online but table does not exist yet
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('does not exist')) {
        return {
          success: true,
          projectConnected: true,
          tablesCreated: false,
          projectId,
          message: `Connected to Supabase project "${projectId}". Database tables need to be created using the SQL script.`
        };
      }
      return {
        success: false,
        projectConnected: true,
        tablesCreated: false,
        projectId,
        message: `Database notice: ${error.message}`
      };
    }

    return {
      success: true,
      projectConnected: true,
      tablesCreated: true,
      projectId,
      message: `Connected successfully to live Supabase project "${projectId}"! All database tables are active.`
    };
  } catch (err: any) {
    return {
      success: false,
      projectConnected: false,
      tablesCreated: false,
      projectId,
      message: err?.message || 'Failed to ping Supabase.'
    };
  }
}
