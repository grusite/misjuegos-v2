import type { UserMetadata } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { AuthProfile } from "@/stores/authStore"

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
}

function mapProfile(row: ProfileRow): AuthProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
  }
}

export function profileFromMetadata(
  userId: string,
  metadata: UserMetadata,
): AuthProfile {
  const displayName =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    "Usuario"

  const avatarUrl =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : null

  return { id: userId, displayName, avatarUrl }
}

export async function getSession() {
  return supabase.auth.getSession()
}

export async function fetchProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle()

  if (error || !data) return null

  return mapProfile(data)
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
      queryParams: {
        prompt: "select_account",
      },
    },
  })

  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthStateChange(
  callback: (userId: string | null, metadata: UserMetadata | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user.id ?? null, session?.user.user_metadata ?? null)
  })

  return data.subscription
}
