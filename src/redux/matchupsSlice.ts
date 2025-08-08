import { Matchup } from "@/lib/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface MatchupsState {
  matchups: {
    data: { [league_id: string]: Matchup[] };
    week: string;
    updated_at: number;
  };
  schedule: {
    data: { [team: string]: { kickoff: number; opp: string } };
    week: string;
    updated_at: number;
  };
  projections: {
    data: { [player_id: string]: { [cat: string]: number } };
    week: string;
    updated_at: number;
  };
  optimal: {
    data: {
      [league_id: string]: {
        index: number;
        slot__index: string;
        optimal_player_id: string;
        optimal_player_position: string;
        optimal_player_value: number;
        current_player_id: string;
        current_player_value: number;
        inOrder: boolean;
      }[];
    };
    week: string;
  };
}

const initialState: MatchupsState = {
  matchups: {
    data: {},
    week: "0",
    updated_at: 0,
  },
  schedule: {
    data: {},
    week: "0",
    updated_at: 0,
  },
  projections: {
    data: {},
    week: "0",
    updated_at: 0,
  },
  optimal: {
    data: {},
    week: "0",
  },
};

const matchupsSlice = createSlice({
  name: "matchups",
  initialState,
  reducers: {
    setMatchups(state, action: PayloadAction<MatchupsState["matchups"]>) {
      state.matchups = action.payload;
    },
    setSchedule(state, action: PayloadAction<MatchupsState["schedule"]>) {
      state.schedule = action.payload;
    },
    setProjections(state, action: PayloadAction<MatchupsState["projections"]>) {
      state.projections = action.payload;
    },
    setOptimal(state, action: PayloadAction<MatchupsState["optimal"]>) {
      state.optimal = action.payload;
    },
  },
});

export const { setMatchups, setSchedule, setProjections, setOptimal } =
  matchupsSlice.actions;

export default matchupsSlice.reducer;
