import { config } from "./config.js";

export interface CharacterCreatePayload {
  character_name: string;
  player_name: string;
  race: string;
  class_name: string;
  level: number;
  discord_username: string;
  discord_user_id: string;
}

export interface CharacterResponse {
  id: number;
  character_name: string;
  player_name: string;
  discord_username: string;
  discord_user_id: string;
  ledger: Record<string, unknown>;
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
