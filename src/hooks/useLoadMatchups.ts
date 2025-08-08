"use client";

import {
  setMatchups,
  setOptimal,
  setProjections,
  setSchedule,
} from "@/redux/matchupsSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { getOptimalStarters } from "@/utils/getOptimalStarters";
import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function useLoadMatchups(week: string) {
  const dispatch: AppDispatch = useDispatch();
  const { leagues, allplayers } = useSelector(
    (state: RootState) => state.common
  );
  const { matchups, schedule, projections } = useSelector(
    (state: RootState) => state.matchups
  );

  console.log({ leagues });

  useEffect(() => {
    const fetchMatchups = async () => {
      const response = await axios.post("/api/matchups", {
        week,
        league_ids: Object.keys(leagues.data),
      });

      dispatch(setMatchups(response.data));
    };

    if (
      Object.keys(leagues.data).length > 0 &&
      ((matchups.updated_at < new Date().getTime() - 1 * 60 * 1000 &&
        parseInt(week) > 0) ||
        matchups.week !== week)
    ) {
      fetchMatchups();
    }
  }, [leagues, week, matchups, dispatch]);

  console.log({ matchups });

  useEffect(() => {
    const fetchSchedule = async () => {
      const response = await axios.get("/api/schedule", {
        params: {
          week,
        },
      });

      dispatch(setSchedule(response.data));
    };

    if (
      (schedule.updated_at < new Date().getTime() - 12 * 60 * 60 * 1000 &&
        parseInt(week) > 0) ||
      schedule.week !== week
    ) {
      fetchSchedule();
    }
  }, [week, schedule, dispatch]);

  useEffect(() => {
    const fetchProjections = async () => {
      const response = await axios.get("/api/projections", {
        params: {
          week,
        },
      });

      dispatch(setProjections(response.data));
    };

    if (
      (projections.updated_at < new Date().getTime() - 5 * 60 * 1000 &&
        parseInt(week) > 0) ||
      projections.week !== week
    ) {
      fetchProjections();
    }
  }, [week, projections, dispatch]);

  useEffect(() => {
    if (
      matchups.week === week &&
      schedule.week === week &&
      projections.week === week
    ) {
      const optimalMap: {
        [league_id: string]: {
          index: number;
          slot__index: string;
          optimal_player_id: string;
          optimal_player_position: string;
          optimal_player_value: number;
          current_player_id: string;
          current_player_value: number;
          kickoff: number;
        }[];
      } = {};

      Object.keys(matchups.data).forEach((league_id) => {
        const user_roster_id = leagues.data[league_id].user_roster.roster_id;
        const user_matchup = matchups.data[league_id].find(
          (m) => m.roster_id === user_roster_id
        );

        const optimal = getOptimalStarters(
          allplayers.data,
          leagues.data[league_id].roster_positions,
          user_matchup?.players || [],
          user_matchup?.starters || [],
          projections.data,
          leagues.data[league_id].scoring_settings,
          schedule.data
        );

        optimalMap[league_id] = optimal;
      });

      dispatch(setOptimal({ data: optimalMap, week }));
    }
  }, [allplayers, leagues, matchups, projections, schedule, week, dispatch]);
}
