import { Allplayer } from "@/lib/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const login = createAsyncThunk("login", async () => {
  const response = await axios.post("/api/login");

  return response.data;
});

export const fetchLeagues = createAsyncThunk(
  "fetchLeagues",
  async ({ user_id }: { user_id: string }) => {
    const responseLeagues = await axios.get("/api/leagues", {
      params: {
        user_id,
      },
    });

    return responseLeagues.data;
  }
);

export const fetchAllplayers = createAsyncThunk("fetchAllplayers", async () => {
  const responseAllplayers = await axios.get("/api/allplayers");

  return {
    data: Object.fromEntries(
      responseAllplayers.data.data.map((allplayer: Allplayer) => [
        allplayer.player_id,
        allplayer,
      ])
    ),
    updated_at: responseAllplayers.data.updated_at,
  };
});
