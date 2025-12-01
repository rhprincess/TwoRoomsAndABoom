
export enum Team {
  BLUE = 'BLUE', // President's team
  RED = 'RED',   // Bomber's team
  GREY = 'GREY'  // Neutral/Gamblers
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED', // Between rounds
  FINISHED = 'FINISHED'
}

export interface Role {
  id: string;
  name: string;
  description: string;
  team: Team;
  isKeyRole: boolean; // President or Bomber
  relatedRoleId?: string; // e.g., Shy Guy A needs Shy Guy B
  relatedRoleName?: string;
  isCustom?: boolean;
  winCondition?: string; // Explicit win condition text
  constraints?: string; // Usage constraints (e.g., "Must show card")
}

export interface Player {
  id: string;
  room_code: string;
  name: string;
  role: Role | null;
  team: Team;
  is_god: boolean;
  is_revealed: boolean;
  condition_met: boolean; // For linked roles
  joined_at: string;
}

export interface Room {
  code: string;
  status: GameStatus;
  current_round: number;
  round_end_time: string | null; // ISO string
  winner: Team | null;
  settings: {
    rounds: number;
    round_lengths: number[]; // [300, 180, 60] seconds
    min_players: number;
    debug_mode: boolean;
  };
  custom_roles: Role[]; // The active "Special Roles" deck list
}
