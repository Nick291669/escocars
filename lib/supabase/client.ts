import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseKey = (
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)?.trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  /^https:\/\/.+\.supabase\.co\/?$/i.test(supabaseUrl) &&
  !supabaseUrl.includes('DEIN-PROJEKT') &&
  !supabaseKey.includes('DEIN_')
)

export const supabaseConfigurationError = !isSupabaseConfigured
  ? 'Supabase ist noch nicht vollständig eingerichtet. Prüfe NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (oder NEXT_PUBLIC_SUPABASE_ANON_KEY) in deiner .env.local und starte npm run dev danach neu.'
  : ''

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseKey! : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

export function getSupabaseRequestError(error: unknown) {
  if (!isSupabaseConfigured) return supabaseConfigurationError

  if (error instanceof TypeError && /failed to fetch/i.test(error.message)) {
    return 'Die Verbindung zu Supabase konnte nicht hergestellt werden. Prüfe die Supabase-URL und den Publishable/Anon-Key in .env.local, ob dein Supabase-Projekt aktiv ist, und starte den Next.js-Server danach neu.'
  }

  if (error instanceof Error) return error.message
  return 'Es ist ein unbekannter Verbindungsfehler aufgetreten.'
}
