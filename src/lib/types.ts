export type League = {
  league_id: string;
  name: string;
  avatar: string;
  season: string;
  settings: LeagueSettings;
  previous_league_id: string | null;
};

export type LeagueSettings = {
  taxi_slots: number;
  reserve_slots: number;
  best_ball: number;
  type: number;
  reserve_allow_na: number;
  reserve_allow_doubtful: number;
  league_average_match: number;
  draft_rounds: number;
  playoff_week_start: number;
  trade_deadline: number;
  disable_trades: number;
  daily_waivers: number;
};

export type Draft = {
  draft_id: string;
  season: string;
  draft_order: {
    [key: string]: number;
  };
  last_picked: number | null;
  status: string;
  settings: {
    rounds: number;
    slots_k: number;
  };
};

export type Roster = {
  roster_id: number;
  owner_id: string;
  players: string[];
  reserve?: string[];
  settings: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
  };
  starters: string[];
  taxi?: string[];
};

export type User = {
  user_id: string;
  display_name: string;
  avatar: string | null;
};

export type Draftpick = {
  season: string;
  owner_id: number;
  roster_id: number;
  previous_owner_id: number;
  round: number;
};

export type DraftpickDetailed = {
  season: string;
  roster_id: number;
  round: number;
  original_user: {
    avatar: string | null;
    user_id: string;
    username: string;
  };
  order: number | null;
};

export type LeagueDetailed = {
  index: number;
  league_id: string;
  name: string;
  avatar: string;
  season: string;
  settings: LeagueSettings;
  previous_league_id: string | null;
  rosters: Roster[];
  user_roster: Roster;
  roster_positions: string[];
  scoring_settings: { [key: string]: number };
};

export type Allplayer = {
  player_id: string;
  position: string;
  team: string;
  full_name: string;
  first_name: string;
  last_name: string;
  age: string;
  fantasy_positions: string[];
  years_exp: number;
  active: boolean;
};

export type Matchup = {
  matchup_id: number;
  roster_id: number;
  week: number;
  starters: string[];
  players: string[];
};
