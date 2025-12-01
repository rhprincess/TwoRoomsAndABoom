import { Role, Team } from './types';

export const DEFAULT_ROUND_LENGTHS = [300, 180, 60]; // 5m, 3m, 1m in seconds

export const BASE_ROLES: Role[] = [
  {
    id: 'president',
    name: 'President',
    description: 'BLUE TEAM LEADER. You must avoid the Bomber. If you are in the same room as the Bomber at the end of the game, you die.',
    team: Team.BLUE,
    isKeyRole: true,
  },
  {
    id: 'bomber',
    name: 'Bomber',
    description: 'RED TEAM LEADER. You must find the President. If you are in the same room as the President at the end of the game, you win.',
    team: Team.RED,
    isKeyRole: true,
  },
  {
    id: 'blue_team',
    name: 'Blue Agent',
    description: 'Protect the President. Keep the Bomber away. You win if the President survives.',
    team: Team.BLUE,
    isKeyRole: false,
  },
  {
    id: 'red_team',
    name: 'Red Agent',
    description: 'Help the Bomber find the President. You win if the Bomber blows up the President.',
    team: Team.RED,
    isKeyRole: false,
  },
  {
    id: 'shy_guy_a',
    name: 'Shy Guy (A)',
    description: 'Find Shy Guy (B). You must mutually reveal your cards to win.',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_b',
    relatedRoleName: 'Shy Guy (B)'
  },
  {
    id: 'shy_guy_b',
    name: 'Shy Guy (B)',
    description: 'Find Shy Guy (A). You must mutually reveal your cards to win.',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_a',
    relatedRoleName: 'Shy Guy (A)'
  },
  {
    id: 'gambler',
    name: 'Gambler',
    description: 'At the end of the game, announce which team won correctly to win.',
    team: Team.GREY,
    isKeyRole: false,
  },
  {
    id: 'doctor',
    name: 'Doctor',
    description: 'Blue Team. You are the President\'s confidant. Share your card to build trust.',
    team: Team.BLUE,
    isKeyRole: false,
  },
  {
    id: 'engineer',
    name: 'Engineer',
    description: 'Red Team. You work with the Bomber. Share your card to coordinate.',
    team: Team.RED,
    isKeyRole: false,
  },
  {
    id: 'spy',
    name: 'Spy',
    description: 'Red Team. You are trying to infiltrate the Blue Team.',
    team: Team.RED,
    isKeyRole: false,
  },
  {
    id: 'negotiator',
    name: 'Negotiator',
    description: 'Grey Team. You win if the game ends with you being the hostage (traded).',
    team: Team.GREY,
    isKeyRole: false,
  }
];