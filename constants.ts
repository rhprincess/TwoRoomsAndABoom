
import { Role, Team } from './types';

export const COLORS = {
  BG: '#4d4696',
  SUCCESS_BG: '#5abb2d',
  SUCCESS_TEXT: '#185021',
  
  // Blue Team
  BLUE_LIGHT: '#82a0d2',
  BLUE_DARK: '#4c4595',
  
  // Red Team
  RED_LIGHT: '#ff8fa3',
  RED_DARK: '#8a001a', // Deeper red for text/bg contrast
  
  // Grey Team
  GREY_LIGHT: '#d1d1d1',
  GREY_DARK: '#4a4a4a',
};

export const DEFAULT_ROUND_LENGTHS = [300, 180, 60]; // 5m, 3m, 1m in seconds

export const BASE_ROLES: Role[] = [
  {
    id: 'president',
    name: '總統',
    description: '蓝队领袖。你必须避开炸弹人。如果游戏结束时你和炸弹客在同一个房间，你死亡，蓝队失败。',
    team: Team.BLUE,
    isKeyRole: true,
    winCondition: '存活至游戏结束'
  },
  {
    id: 'bomber',
    name: '炸彈客',
    description: '红队领袖。你必须找到总统。如果游戏结束时你和总统在同一个房间，你引爆炸弹，红队胜利。',
    team: Team.RED,
    isKeyRole: true,
    winCondition: '与总统在同一房间结束游戏'
  },
  {
    id: 'blue_team',
    name: '藍隊特工',
    description: '保护总统。让炸弹人远离总统。如果总统存活，你获胜。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '总统存活'
  },
  {
    id: 'red_team',
    name: '紅隊特工',
    description: '帮助炸弹人找到总统。如果炸弹人炸死总统，你获胜。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '总统死亡'
  },
  {
    id: 'shy_guy_a',
    name: '害羞鬼 (A)',
    description: '找到害羞鬼 (B)。你们必须互相输入核对码确认身份才能获胜。',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_b',
    relatedRoleName: '害羞鬼 (B)',
    winCondition: '与害羞鬼(B)互认'
  },
  {
    id: 'shy_guy_b',
    name: '害羞鬼 (B)',
    description: '找到害羞鬼 (A)。你们必须互相输入核对码确认身份才能获胜。',
    team: Team.GREY,
    isKeyRole: false,
    relatedRoleId: 'shy_guy_a',
    relatedRoleName: '害羞鬼 (A)',
    winCondition: '与害羞鬼(A)互认'
  },
  {
    id: 'gambler',
    name: '賭徒',
    description: '在游戏结束时，你需要大声宣布你认为获胜的队伍。如果猜对，你获胜。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '猜对获胜队伍'
  },
  {
    id: 'doctor',
    name: '醫生',
    description: '蓝队。你是总统的亲信。分享你的卡牌来建立信任。',
    team: Team.BLUE,
    isKeyRole: false,
    winCondition: '总统存活'
  },
  {
    id: 'engineer',
    name: '工程師',
    description: '红队工程师。帮助红队获胜。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '总统死亡'
  },
  {
    id: 'spy',
    name: '間諜',
    description: '红队。你实际上是红队的人，但在卡牌上可能伪装成蓝队（口头撒谎）。试图渗透蓝队。',
    team: Team.RED,
    isKeyRole: false,
    winCondition: '总统死亡'
  },
  {
    id: 'negotiator',
    name: '談判專家',
    description: '灰队。如果游戏结束时你被作为人质（被交换到对立房间），你获胜。',
    team: Team.GREY,
    isKeyRole: false,
    winCondition: '成为人质'
  }
];
