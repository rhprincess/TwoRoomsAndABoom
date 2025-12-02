
export enum Team {
  BLUE = 'BLUE', // President's team
  RED = 'RED',   // Bomber's team
  GREY = 'GREY'  // Neutral/Gamblers
}

export enum GameStatus {
  LOBBY = 'LOBBY',
  DISTRIBUTING = 'DISTRIBUTING', // Animation phase
  READY_TO_START = 'READY_TO_START', // Cards revealed, waiting for start
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED', // Between rounds
  FINISHED = 'FINISHED'
}

export interface Role {
  id: string;
  name: string; // Traditional Chinese
  description: string;
  team: Team;
  isKeyRole: boolean; // President or Bomber
  relatedRoleId?: string;
  relatedRoleName?: string;
  isCustom?: boolean;
  winCondition?: string;
  constraints?: string;
}

export interface CardSet {
  id: string;
  name: string;
  roles: Role[];
  created_at?: string;
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
  room_number: 1 | 2 | null;
  is_leader: boolean;
  verification_code?: string; // Random 6-digit code for linked roles
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
    exchange_counts: number[]; // [1, 1, 1] hostages per round
    min_players: number;
    debug_mode: boolean;
  };
  custom_roles: Role[]; // The active "Special Roles" deck list
  pending_exchanges?: {
    room1_target_ids?: string[]; // Array of IDs
    room2_target_ids?: string[]; // Array of IDs
  };
  exchange_status?: {
    room1_ready: boolean;
    room2_ready: boolean;
    swap_executed: boolean;
  };
}
