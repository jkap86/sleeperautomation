import {
  League,
  Draft,
  Roster,
  User,
  Draftpick,
  DraftpickDetailed,
} from "@/lib/types";
import axios from "axios";

export const getLeagueDetails = async ({
  leagues,
  user_id,
}: {
  leagues: League[];
  user_id: string;
}) => {
  const leaguesDetailed = [];

  for (const league of leagues) {
    try {
      const rosters = await axios.get(
        `https://api.sleeper.app/v1/league/${league.league_id}/rosters`
      );

      const users = await axios.get(
        `https://api.sleeper.app/v1/league/${league.league_id}/users`
      );

      let leagueDraftPicksObj;
      let upcomingDraft;

      if (league.settings.type === 2) {
        const drafts = await axios.get(
          `https://api.sleeper.app/v1/league/${league.league_id}/drafts`
        );
        const tradedPicks = await axios.get(
          `https://api.sleeper.app/v1/league/${league.league_id}/traded_picks`
        );

        upcomingDraft = drafts.data.find(
          (x: Draft) =>
            x.season === league.season &&
            x.settings.rounds === league.settings.draft_rounds
        );

        leagueDraftPicksObj = getLeagueDraftPicksObj(
          league,
          rosters.data,
          users.data,
          upcomingDraft?.status === "complete" ? undefined : upcomingDraft,
          tradedPicks.data
        );
      } else {
        leagueDraftPicksObj = {};
      }

      const rostersUserInfo = getRostersUserInfo(
        rosters.data,
        users.data,
        leagueDraftPicksObj
      );

      const user_roster = rostersUserInfo.find((r) => r.user_id === user_id);

      if (user_roster?.players && user_roster.players.length > 0)
        leaguesDetailed.push({
          ...league,
          rosters: rostersUserInfo,
          user_roster,
        });
    } catch {}
  }

  return leaguesDetailed;
};

export const getLeagueDraftPicksObj = (
  league: League,
  rosters: Roster[],
  users: User[],
  upcomingDraft: Draft | undefined,
  tradedPicks: Draftpick[]
) => {
  const draftSeason = upcomingDraft
    ? parseInt(league.season)
    : parseInt(league.season) + 1;

  const draft_order = upcomingDraft?.draft_order;

  const leagueDraftPicksObj: {
    [key: number]: DraftpickDetailed[];
  } = {};

  rosters.forEach((roster) => {
    const draftPicksTeam: DraftpickDetailed[] = [];

    const user = users.find((u) => u.user_id === roster.owner_id);

    // loop through seasons (draft season and next two seasons)

    for (let j = draftSeason; j <= draftSeason + 2; j++) {
      // loop through rookie draft rounds

      for (let k = 1; k <= league.settings.draft_rounds; k++) {
        // check if each rookie pick is in traded picks

        const isTraded = tradedPicks.find(
          (pick: Draftpick) =>
            parseInt(pick.season) === j &&
            pick.round === k &&
            pick.roster_id === roster.roster_id
        );

        // if it is not in traded picks, add to original manager

        if (!isTraded) {
          draftPicksTeam.push({
            season: j.toString(),
            round: k,
            roster_id: roster.roster_id,
            original_user: {
              avatar: user?.avatar || "",
              user_id: roster.owner_id,
              username: user?.display_name || "Orphan",
            },
            order:
              (draft_order &&
                j === parseInt(upcomingDraft.season) &&
                draft_order[roster?.owner_id]) ||
              null,
          });
        }
      }
    }

    tradedPicks
      .filter(
        (x) =>
          x.owner_id === roster.roster_id && parseInt(x.season) >= draftSeason
      )
      .forEach((pick) => {
        const original_roster = rosters.find(
          (t) => t.roster_id === pick.roster_id
        );

        const original_user = users.find(
          (u) => u.user_id === original_roster?.owner_id
        );

        if (original_roster) {
          draftPicksTeam.push({
            season: pick.season,
            round: pick.round,
            roster_id: pick.roster_id,
            original_user: {
              avatar: original_user?.avatar || "",
              user_id: original_user?.user_id || "",
              username: original_user?.display_name || "Orphan",
            },
            order:
              (original_user &&
                draft_order &&
                parseInt(pick.season) === parseInt(upcomingDraft.season) &&
                draft_order[original_user?.user_id]) ||
              null,
          });
        }
      });

    tradedPicks
      .filter(
        (x) =>
          x.previous_owner_id === roster.roster_id &&
          parseInt(x.season) >= draftSeason
      )
      .forEach((pick) => {
        const index = draftPicksTeam.findIndex((obj) => {
          return (
            obj.season === pick.season &&
            obj.round === pick.round &&
            obj.roster_id === pick.roster_id
          );
        });

        if (index !== -1) {
          leagueDraftPicksObj[roster.roster_id].splice(index, 1);
        }
      });

    leagueDraftPicksObj[roster.roster_id] = draftPicksTeam;
  });

  return leagueDraftPicksObj;
};

export const getRostersUserInfo = (
  rosters: Roster[],
  users: User[],
  league_draftpicks_obj: { [key: string]: DraftpickDetailed[] }
) => {
  const rosters_username = rosters.map((roster) => {
    const user = users.find((user) => user.user_id === roster.owner_id);

    return {
      roster_id: roster.roster_id,
      username: user?.display_name || "Orphan",
      user_id: roster.owner_id,
      avatar: user?.avatar || null,
      players: roster.players,
      draftpicks: league_draftpicks_obj[roster.roster_id] || [],
      starters: roster.starters || [],
      starters_optimal_dynasty: [],
      starters_optimal_redraft: [],
      taxi: roster.taxi || [],
      reserve: roster.reserve || [],
      wins: roster.settings.wins,
      losses: roster.settings.losses,
      ties: roster.settings.ties,
      fp: parseFloat(
        `${roster.settings.fpts}.${roster.settings.fpts_decimal || 0}`
      ),
      fpa: parseFloat(
        `${roster.settings.fpts_against || 0}.${
          roster.settings.fpts_against_decimal || 0
        }`
      ),
    };
  });

  return rosters_username;
};
