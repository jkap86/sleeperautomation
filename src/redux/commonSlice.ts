import { Allplayer, LeagueDetailed } from "@/lib/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchAllplayers, fetchLeagues, login } from "./commonActions";

export interface CommonState {
  isLoggingIn: boolean;
  token: string;
  user_id: string;
  errorLoggingIn: string;

  isLoadingAllplayers: boolean;
  allplayers: {
    data: {
      [player_id: string]: Allplayer;
    };
    updated_at: number;
  };
  errorAllplayers: string;

  isLoadingLeagues: boolean;
  leagues: {
    data: { [league_id: string]: LeagueDetailed };
    updated_at: number;
  };
  errorLeagues: string;
}

const initialState: CommonState = {
  isLoggingIn: false,
  token: "",
  user_id: "",
  errorLoggingIn: "",

  isLoadingAllplayers: false,
  allplayers: { data: {}, updated_at: 0 },
  errorAllplayers: "",

  isLoadingLeagues: false,
  leagues: {
    data: {},
    updated_at: 0,
  },
  errorLeagues: "",
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeagues.pending, (state) => {
        state.isLoadingLeagues = true;
      })
      .addCase(fetchLeagues.fulfilled, (state, action) => {
        state.isLoadingLeagues = false;
        state.leagues = action.payload;
      })
      .addCase(fetchLeagues.rejected, (state, action) => {
        state.isLoadingLeagues = false;
        state.errorLeagues = action.error.message || "Error loading leagues";
      });

    builder
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.token = action.payload.token;
        state.user_id = action.payload.user_id;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.errorLoggingIn = action.error.message || "Error Logging In";
      });

    builder
      .addCase(fetchAllplayers.pending, (state) => {
        state.isLoadingAllplayers = true;
      })
      .addCase(fetchAllplayers.fulfilled, (state, action) => {
        state.isLoadingAllplayers = false;
        state.allplayers = action.payload;
      })
      .addCase(fetchAllplayers.rejected, (state, action) => {
        state.isLoadingAllplayers = false;
        state.errorAllplayers =
          action.error.message || "Error Fetching Allplayers";
      });
  },
});

export default commonSlice.reducer;
