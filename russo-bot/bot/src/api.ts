import { config } from "./config.js";

export interface CharacterCreatePayload {
  character_name: string;
  player_name: string;
  race: string;
  class_name: string;
  level: number;
  alignment?: string | null;
  hp_max?: number | null;
  hp_current?: number | null;
  armor_class?: number | null;
  discord_username: string;
  discord_user_id: string;
}

export interface CharacterResponse {
  id: number;
  character_name: string;
  player_name: string;
  discord_username: string;
  discord_user_id: string;
  is_active: boolean;
  status: string;
  ledger: Record<string, unknown>;
}

export interface LedgerPatchPayload {
  patch: Record<string, unknown>;
  actor_discord_user_id?: string;
  actor_is_admin?: boolean;
  audit_action?: string;
}

export interface CharacterActorPayload {
  actor_discord_user_id: string;
  actor_is_admin?: boolean;
}

export interface EquipmentAddPayload extends CharacterActorPayload {
  item_name: string;
  quantity?: number;
  weight?: number;
  location?: string;
  notes?: string | null;
}

export interface EquipmentQuantityPayload extends CharacterActorPayload {
  item_name: string;
  quantity?: number;
}

export interface EquipmentMovePayload extends CharacterActorPayload {
  item_name: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`RUSSO API ${response.status}: ${body}`);
  }

  return response.json() as Promise<T>;
}

export function createCharacter(payload: CharacterCreatePayload): Promise<CharacterResponse> {
  return request<CharacterResponse>("/characters", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getCharacterByDiscord(discordUserId: string): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/by-discord/${discordUserId}`);
}

export function listCharacters(discordUserId: string): Promise<CharacterResponse[]> {
  return request<CharacterResponse[]>(`/characters?discord_user_id=${encodeURIComponent(discordUserId)}`);
}

export function lookupCharacter(
  actorDiscordUserId: string,
  actorIsAdmin: boolean,
  characterName?: string | null
): Promise<CharacterResponse> {
  const params = new URLSearchParams({
    actor_discord_user_id: actorDiscordUserId,
    actor_is_admin: String(actorIsAdmin)
  });
  if (characterName) {
    params.set("character_name", characterName);
  }
  return request<CharacterResponse>(`/characters/lookup?${params.toString()}`);
}

export function activateCharacter(
  characterId: number,
  payload: CharacterActorPayload
): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/activate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function patchCharacterLedger(
  characterId: number,
  payload: LedgerPatchPayload
): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/ledger`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function addEquipment(characterId: number, payload: EquipmentAddPayload): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/equipment/add`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function removeEquipment(
  characterId: number,
  payload: EquipmentQuantityPayload
): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/equipment/remove`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function equipEquipment(characterId: number, payload: EquipmentMovePayload): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/equipment/equip`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function unequipEquipment(characterId: number, payload: EquipmentMovePayload): Promise<CharacterResponse> {
  return request<CharacterResponse>(`/characters/${characterId}/equipment/unequip`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
