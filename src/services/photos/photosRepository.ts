import type { SupabaseClient } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type {
  AppPhoto,
  CreatePhotoInput,
  LinkPhotoInput,
  ListPhotosOptions,
} from "@/domain/types/photo"
import type { AppDatabase } from "@/domain/types/schema"
import { unwrap, unwrapNullable, fromPostgrestError } from "@/services/errors"
import { mapAppPhoto, toPhotoInsert } from "@/services/photos/photoMapper"

export function createPhotosRepository(client: SupabaseClient<AppDatabase>) {
  return {
    async list(options: ListPhotosOptions = {}): Promise<AppPhoto[]> {
      let query = client
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false })

      if (options.sessionId) {
        query = query.eq("session_id", options.sessionId)
      }

      if (options.desiredGameId) {
        query = query.eq("desired_game_id", options.desiredGameId)
      }

      if (options.unassignedOnly) {
        query = query.is("session_id", null).is("desired_game_id", null)
      }

      if (options.assignedOnly) {
        query = query.or("session_id.not.is.null,desired_game_id.not.is.null")
      }

      if (options.limit !== undefined) {
        const offset = options.offset ?? 0
        query = query.range(offset, offset + options.limit - 1)
      }

      return unwrap(await query).map(mapAppPhoto)
    },

    async listForSession(sessionId: string): Promise<AppPhoto[]> {
      const result = await client
        .from("photos")
        .select("*")
        .eq("session_id", sessionId)
        .is("message_id", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      return unwrap(result).map(mapAppPhoto)
    },

    async listForMessage(messageId: string): Promise<AppPhoto[]> {
      const result = await client
        .from("photos")
        .select("*")
        .eq("message_id", messageId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      return unwrap(result).map(mapAppPhoto)
    },

    async listMessageAttachmentsForSession(sessionId: string): Promise<AppPhoto[]> {
      const result = await client
        .from("photos")
        .select("*")
        .eq("session_id", sessionId)
        .not("message_id", "is", null)
        .order("created_at", { ascending: true })

      return unwrap(result).map(mapAppPhoto)
    },

    async listForDesiredGame(desiredGameId: string): Promise<AppPhoto[]> {
      const result = await client
        .from("photos")
        .select("*")
        .eq("desired_game_id", desiredGameId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })

      return unwrap(result).map(mapAppPhoto)
    },

    async create(input: CreatePhotoInput): Promise<AppPhoto> {
      const result = await client
        .from("photos")
        .insert(toPhotoInsert(input))
        .select("*")
        .single()

      return mapAppPhoto(unwrap(result))
    },

    async link(id: string, input: LinkPhotoInput): Promise<AppPhoto> {
      const hasSession = input.sessionId !== undefined
      const hasDesired = input.desiredGameId !== undefined

      if (hasSession && hasDesired) {
        throw new Error("Una foto solo puede enlazarse a una partida o a un deseo, no a ambos")
      }

      const patch =
        hasSession
          ? {
              session_id: input.sessionId ?? null,
              desired_game_id: null,
              message_id: null,
            }
          : hasDesired
            ? {
                session_id: null,
                desired_game_id: input.desiredGameId ?? null,
                message_id: null,
              }
            : {
                session_id: null,
                desired_game_id: null,
                message_id: null,
              }

      const result = await client
        .from("photos")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single()

      return mapAppPhoto(unwrap(result))
    },

    async unlink(id: string): Promise<AppPhoto> {
      return this.link(id, {})
    },

    async getById(id: string): Promise<AppPhoto | null> {
      const result = await client.from("photos").select("*").eq("id", id).maybeSingle()
      const row = unwrapNullable(result)
      return row ? mapAppPhoto(row) : null
    },

    async delete(id: string): Promise<void> {
      const { error } = await client.from("photos").delete().eq("id", id)
      if (error) throw fromPostgrestError(error)
    },
  }
}

export const photosRepository = createPhotosRepository(supabase)
