"use client";

import useLoadCommonData from "@/hooks/useLoadCommonData";
import useLoadMatchups from "@/hooks/useLoadMatchups";
import { Matchup } from "@/lib/types";
import { setMatchups } from "@/redux/matchupsSlice";
import { AppDispatch, RootState } from "@/redux/store";
import axios from "axios";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function SetOptimalLineupsPage() {
  const dispatch: AppDispatch = useDispatch();
  const { token, isLoggingIn, isLoadingLeagues, allplayers, leagues } =
    useSelector((state: RootState) => state.common);
  const { matchups, optimal } = useSelector(
    (state: RootState) => state.matchups
  );
  const [week, setWeek] = useState("0");
  const [active, setActive] = useState("");

  useLoadCommonData();

  useLoadMatchups(week);

  console.log({ optimal });

  const setLineup = async (league_id: string) => {
    const roster_id = leagues.data[league_id].user_roster.roster_id;
    const starters = optimal.data[league_id].map((o) => o.optimal_player_id);
    const response = await axios.post("/api/setlineup", {
      token,
      league_id,
      roster_id,
      leg: week,
      round: week,
      starters,
    });

    console.log({ response });

    if (response.data.errors) {
      const errors: string[] = [];

      response.data.errors.forEach((err: { message: string }) => {
        errors.push(err.message);
      });

      window.alert(errors.join("\n"));
    }

    if (response.data.data.update_matchup_leg) {
      console.log("updating matchups");
      const matchups_updated = {
        ...matchups.data,
        [league_id]: [
          ...matchups.data[league_id].filter((m) => m.roster_id !== roster_id),
          {
            ...(matchups.data[league_id].find(
              (m) => m.roster_id === roster_id
            ) as Matchup),
            starters: response.data.data.update_matchup_leg.starters.filter(
              (x: string | null) => x
            ),
          },
        ],
      };

      dispatch(
        setMatchups({
          data: matchups_updated,
          week: matchups.week,
          updated_at: matchups.updated_at,
        })
      );
    }
  };

  return (
    <div className="h-screen">
      {isLoggingIn ? (
        <h1>Logging In</h1>
      ) : isLoadingLeagues ? (
        <h1>Loading Leagues</h1>
      ) : (
        <div>
          <h1>Set Optimal Lineups</h1>
          <div className="flex flex-col items-center">
            <select
              onChange={(e) => setWeek(e.target.value)}
              className="text-center w-[25%]"
            >
              <option hidden value={"0"}>
                Select Week
              </option>
              {Array.from(Array(18).keys()).map((key) => {
                return <option key={key + 1}>{key + 1}</option>;
              })}
            </select>
          </div>

          <table className="w-full table-fixed">
            <tbody>
              {Object.keys(matchups.data)
                .filter(
                  (league_id) =>
                    leagues.data[league_id].settings.best_ball !== 1
                )
                .sort((a, b) => leagues.data[a].index - leagues.data[b].index)
                .map((league_id) => {
                  const current_value = optimal.data[league_id]?.reduce(
                    (acc, cur) => acc + (cur.current_player_value || 0),
                    0
                  );

                  const optimal_value = optimal.data[league_id]?.reduce(
                    (acc, cur) => acc + (cur.optimal_player_value || 0),
                    0
                  );

                  const delta = current_value - optimal_value;

                  const current_player_ids = optimal.data[league_id]
                    ?.map((os) => os.current_player_id)
                    ?.filter((x) => x);

                  const optimal_player_ids = optimal.data[league_id]
                    ?.map((os) => os.optimal_player_id)
                    ?.filter((x) => x);

                  return (
                    <React.Fragment key={league_id}>
                      <tr
                        onClick={() =>
                          active === league_id
                            ? setActive("")
                            : setActive(league_id)
                        }
                        className={active === league_id ? "bg-green-900" : ""}
                      >
                        <td
                          colSpan={3}
                          className="p-4 bg-gray-700 shadow-[inset_0_0_3rem_black]"
                        >
                          {leagues.data[league_id]?.name}
                        </td>
                        <td className="text-center bg-gray-700 shadow-[inset_0_0_3rem_black]">
                          {current_value?.toFixed(1)}
                        </td>
                        <td className="text-center bg-gray-700 shadow-[inset_0_0_3rem_black]">
                          {optimal_value?.toFixed(1)}
                        </td>
                        <td className="text-center bg-gray-700 shadow-[inset_0_0_3rem_black]">
                          {optimal_player_ids?.some(
                            (player_id) =>
                              !current_player_ids.includes(player_id)
                          ) ? (
                            <span className="text-red-600">
                              {delta.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-green-600 text-3xl font-bold">
                              &#10003;
                            </span>
                          )}
                        </td>
                        <td className="text-center bg-gray-700 shadow-[inset_0_0_3rem_black]">
                          {optimal.data[league_id]?.some(
                            (os) => !os.inOrder
                          ) ? (
                            <span className="text-red-600 text-3xl font-bold">
                              X
                            </span>
                          ) : (
                            <span className="text-green-600 text-3xl font-bold">
                              &#10003;
                            </span>
                          )}
                        </td>
                      </tr>
                      {active !== league_id ? null : (
                        <tr>
                          <td colSpan={7}>
                            <div className="text-center p-8">
                              <button
                                onClick={() => setLineup(league_id)}
                                className="bg-blue-700 p-2"
                              >
                                Set Optimal
                              </button>
                            </div>
                            <table className="w-full table-fixed">
                              <tbody>
                                {optimal.data[league_id]
                                  ?.filter(
                                    (o) => !o.slot__index.startsWith("BN")
                                  )
                                  ?.map((o) => {
                                    return (
                                      <tr key={o.slot__index}>
                                        <td
                                          className={
                                            "p-2 " +
                                            (!o.inOrder
                                              ? "text-yellow-400"
                                              : "")
                                          }
                                        >
                                          {o.slot__index.split("__")[0]}
                                        </td>
                                        <td
                                          className={
                                            optimal_player_ids.includes(
                                              o.current_player_id
                                            )
                                              ? ""
                                              : "text-red-600"
                                          }
                                        >
                                          {
                                            allplayers.data[o.current_player_id]
                                              ?.full_name
                                          }
                                        </td>
                                        <td
                                          className={
                                            current_player_ids.includes(
                                              o.optimal_player_id
                                            )
                                              ? ""
                                              : "text-green-600"
                                          }
                                        >
                                          {
                                            allplayers.data[o.optimal_player_id]
                                              ?.full_name
                                          }
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
