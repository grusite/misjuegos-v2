import { supabase } from "@/lib/supabaseClient"
import type { ParticipantLinkCandidate } from "@/domain/types/participantLink"
import { unwrapNullable } from "@/services/errors"

type CandidateRow = {
  id: string
  display_name: string
  color: string | null
  session_count: number
  match_kind: string
}

export async function findParticipantLinkCandidates(
  displayName: string,
): Promise<ParticipantLinkCandidate[]> {
  const { data, error } = await supabase.rpc("find_participant_link_candidates", {
    search_name: displayName,
  })

  if (error) throw error

  return (data as CandidateRow[]).map(row => ({
    id: row.id,
    displayName: row.display_name,
    color: row.color,
    sessionCount: Number(row.session_count),
    matchKind: row.match_kind === "exact" ? "exact" : "partial",
  }))
}

export async function claimParticipantLink(participantId: string): Promise<void> {
  const { error } = await supabase.rpc("claim_participant_link", {
    participant_id: participantId,
  })

  if (error) throw error
}

export async function searchParticipantLinkCandidates(
  search: string,
): Promise<ParticipantLinkCandidate[]> {
  const normalized = search.trim()
  if (normalized.length < 2) return []

  const { data, error } = await supabase.rpc("search_participant_link_candidates", {
    p_search: normalized,
  })

  if (error) throw error

  return (data as CandidateRow[]).map(row => ({
    id: row.id,
    displayName: row.display_name,
    color: row.color,
    sessionCount: Number(row.session_count),
    matchKind: row.match_kind === "exact" ? "exact" : "partial",
  }))
}

export async function skipParticipantLinkPrompt(): Promise<void> {
  const { error } = await supabase.rpc("skip_participant_link_prompt")

  if (error) throw error
}

export async function fetchParticipantLinkPromptCompleted(
  profileId: string,
): Promise<boolean> {
  const result = await supabase
    .from("profiles")
    .select("participant_link_prompt_completed_at")
    .eq("id", profileId)
    .maybeSingle()

  const row = unwrapNullable(result)
  return Boolean(row?.participant_link_prompt_completed_at)
}
