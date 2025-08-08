"use client";

import useLoadCommonData from "@/hooks/useLoadCommonData";
import { LeagueDetailed } from "@/lib/types";
import { RootState } from "@/redux/store";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

export default function PutPlayerOtbPage() {
  const { token, isLoggingIn, isLoadingLeagues, leagues, allplayers } =
    useSelector((state: RootState) => state.common);
  const [player, setPlayer] = useState("");
  const [filteredLeagues, setFilteredLeagues] = useState<LeagueDetailed[]>([]);
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<string[]>([]);

  useLoadCommonData();

  const putPlayerOtb = async () => {
    for (const selectedLeagueId of selectedLeagueIds) {
      const response = await axios.post("/api/otb", {
        token,
        player_id: player,
        league_id: selectedLeagueId,
      });
    }
  };

  useEffect(() => {
    const filtered = Object.keys(leagues.data)
      .filter((league_id) =>
        leagues.data[league_id].user_roster.players.includes(player)
      )
      .map((league_id) => leagues.data[league_id]);

    setFilteredLeagues(filtered);
  }, [leagues, player]);

  useEffect(() => {
    setSelectedLeagueIds(filteredLeagues.map((l) => l.league_id));
  }, [filteredLeagues]);

  const ownedPlayers = useMemo(() => {
    return Array.from(
      new Set(
        Object.keys(leagues.data).flatMap((league_id) =>
          leagues.data[league_id].user_roster.players.map(
            (player_id) => player_id
          )
        )
      )
    );
  }, [leagues]);

  return (
    <div className="h-screen">
      {isLoggingIn ? (
        <h1>Logging In</h1>
      ) : isLoadingLeagues ? (
        <h1>Loading Leagues</h1>
      ) : (
        <div className="h-full flex flex-col items-center">
          <h1>Put Player OTB</h1>

          <div className="flex flex-col items-center">
            <label>{allplayers.data[player]?.full_name}</label>
            <input
              list="players"
              name="player"
              type="text"
              id="player"
              onChange={(e) => setPlayer(e.target.value)}
              placeholder="Select Player"
              className="text-center w-[50%]"
            />
            <datalist id="players">
              {ownedPlayers.map((player_id) => {
                return (
                  <option key={player_id} value={player_id}>
                    {allplayers.data[player_id].full_name}
                  </option>
                );
              })}
            </datalist>
          </div>

          <table className="w-full table-fixed">
            <tbody>
              {filteredLeagues.map((league) => {
                const checked = selectedLeagueIds.includes(league.league_id);
                return (
                  <tr key={league.league_id}>
                    <td
                      colSpan={1}
                      className="text-center bg-gray-700 shadow-[inset_0_0_3rem_black]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedLeagueIds((prevState) =>
                            checked
                              ? prevState.filter(
                                  (league_id) => league.league_id !== league_id
                                )
                              : [...prevState, league.league_id]
                          )
                        }
                      />
                    </td>
                    <td
                      colSpan={4}
                      className="bg-gray-700 shadow-[inset_0_0_3rem_black]"
                    >
                      {league.name}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {selectedLeagueIds.length > 0 ? (
            <button
              onClick={() => putPlayerOtb()}
              className="bg-gray-400 m-8 p-2 text-gray-900"
            >
              Submit
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
