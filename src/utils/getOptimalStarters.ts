import { Allplayer } from "@/lib/types";

export const position_map: { [key: string]: string[] } = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
  WRRB_FLEX: ["RB", "WR"],
  REC_FLEX: ["WR", "TE"],
  K: ["K"],
  DEF: ["DEF"],
  DL: ["DL"],
  LB: ["LB"],
  DB: ["DB"],
  IDP_FLEX: ["DL", "LB", "DB"],
};

export const getSlotAbbrev = (slot: string) => {
  switch (slot) {
    case "FLEX":
      return "FLX";
    case "SUPER_FLEX":
      return "SF";
    case "WRRB_FLEX":
      return "W/R";
    case "REC_FLEX":
      return "W/T";
    case "IDP_FLEX":
      return "IDP";
    default:
      return slot;
  }
};

export const getPlayerTotal = (
  scoring_settings: { [key: string]: number },
  stat_obj: { [key: string]: number }
) => {
  const projection = Object.keys(stat_obj || {})
    .filter((key) => Object.keys(scoring_settings).includes(key))
    .reduce((acc, cur) => acc + scoring_settings[cur] * stat_obj[cur], 0);

  return projection;
};

export const getOptimalStarters = (
  allplayers: { [player_id: string]: Allplayer },
  roster_positions: string[],
  players: string[],
  starters: string[],
  stat_obj: { [player_id: string]: { [key: string]: number } },
  scoring_settings: { [cat: string]: number },
  schedule: { [team: string]: { kickoff: number; opp: string } }
) => {
  const values: { [player_id: string]: number } = {};

  players.forEach((player_id) => {
    values[player_id] = getPlayerTotal(
      scoring_settings,
      stat_obj[player_id] || {}
    );
  });

  const playersWithValues = players
    .flatMap((player_id) => {
      return (allplayers?.[player_id]?.fantasy_positions || []).map(
        (position) => {
          return {
            player_id,
            position,
            value: values?.[player_id] || 0,
            kickoff: schedule[allplayers[player_id]?.team]?.kickoff || 0,
          };
        }
      );
    })
    .sort((a, b) => b.value - a.value);

  const optimal_starters: {
    index: number;
    slot__index: string;
    optimal_player_id: string;
    optimal_player_position: string;
    optimal_player_value: number;
    current_player_id: string;
    current_player_value: number;
    kickoff: number;
  }[] = [];

  (roster_positions || []).forEach((slot, index) => {
    if (position_map[slot]) {
      const slot_options = playersWithValues.filter(
        (player) =>
          position_map[slot].includes(player.position) &&
          !optimal_starters.find(
            (os) => os.optimal_player_id === player.player_id
          )
      );

      const optimal_player = slot_options[0] || { player_id: "0", value: 0 };

      optimal_starters.push({
        index,
        slot__index: `${slot}__${index}`,
        optimal_player_id: optimal_player.player_id,
        optimal_player_position: optimal_player.position,
        optimal_player_value: optimal_player.value,
        current_player_id: starters[index],
        current_player_value: values[starters[index]],
        kickoff: schedule[allplayers[starters[index]]?.team]?.kickoff || 0,
      });
    } else {
      optimal_starters.push({
        index,
        slot__index: `${slot}__${index}`,
        optimal_player_id: starters[index],
        optimal_player_position: "-",
        optimal_player_value: 0,
        current_player_id: "0",
        current_player_value: 0,
        kickoff: 0,
      });
    }
  });

  const optimal_starters_ordered: {
    index: number;
    slot__index: string;
    optimal_player_id: string;
    optimal_player_position: string;
    optimal_player_value: number;
    current_player_id: string;
    current_player_value: number;
    inOrder: boolean;
  }[] = [];

  optimal_starters
    .filter((os) => position_map[os.slot__index.split("__")[0]])
    .sort(
      (a, b) =>
        position_map[a.slot__index.split("__")[0]].length -
        position_map[b.slot__index.split("__")[0]].length
    )
    .forEach((os) => {
      const slot_options_optimal = playersWithValues
        .filter(
          (player) =>
            optimal_starters.some(
              (os) => os.optimal_player_id === player.player_id
            ) &&
            position_map[os.slot__index.split("__")[0]].includes(
              player.position
            ) &&
            !optimal_starters_ordered.find(
              (os) => os.optimal_player_id === player.player_id
            )
        )
        .sort((a, b) => a.kickoff - b.kickoff);

      const optimal_player = slot_options_optimal[0] || {
        player_id: "0",
        value: 0,
      };

      const current_player_id = os.current_player_id;
      const current_player_kickoff = os.kickoff;
      const current_player_position = allplayers[current_player_id]?.position;
      const current_slot = os.slot__index.split("__")[0];

      const earlyInFlex = starters.some((s, index2) => {
        const option_player_id = s;
        const option_player_kickoff =
          schedule[allplayers[option_player_id]?.team]?.kickoff || 0;
        const option_player_position = allplayers[option_player_id]?.position;
        const option_slot = roster_positions[index2];

        const early =
          current_player_kickoff < option_player_kickoff &&
          position_map[current_slot].length >
            position_map[option_slot].length &&
          position_map[option_slot].includes(current_player_position) &&
          position_map[current_slot].includes(option_player_position);

        if (roster_positions.includes("WRRB_FLEX") && early) {
          console.log({
            current_player:
              allplayers[current_player_id]?.full_name || current_player_id,
            current_player_kickoff,
            current_player_position,
            current_slot,
            option_player:
              allplayers[option_player_id]?.full_name || option_player_id,
            option_player_kickoff,
            option_player_position,
            option_slot,
          });
        }

        return early;
      });

      const lateNotInFlex = starters.some((s, index2) => {
        const option_player_id = s;
        const option_player_kickoff =
          schedule[allplayers[option_player_id]?.team]?.kickoff || 0;
        const option_player_position = allplayers[option_player_id]?.position;
        const option_slot = roster_positions[index2];

        return (
          current_player_kickoff > option_player_kickoff &&
          position_map[current_slot].length <
            position_map[option_slot].length &&
          position_map[current_slot].includes(option_player_position) &&
          position_map[option_slot].includes(current_player_position)
        );
      });
      optimal_starters_ordered.push({
        index: os.index,
        slot__index: os.slot__index,
        optimal_player_id: optimal_player.player_id,
        optimal_player_position: optimal_player.position,
        optimal_player_value: optimal_player.value,
        current_player_id: os.current_player_id,
        current_player_value: os.current_player_value,
        inOrder: !earlyInFlex && !lateNotInFlex,
      });
    });

  /*
  [...(roster_positions || [])]
    .filter((slot) => position_map[slot])
    .sort(
      (a, b) => (position_map[a]?.length || 0) - (position_map[b]?.length || 0)
    )
    .forEach((slot, index) => {
      if (position_map[slot]) {
        const slot_options_optimal = playersWithValues
          .filter(
            (player) =>
              optimal_starters.some(
                (os) => os.optimal_player_id === player.player_id
              ) &&
              position_map[slot].includes(player.position) &&
              !optimal_starters_ordered.find(
                (os) => os.optimal_player_id === player.player_id
              )
          )
          .sort((a, b) => a.kickoff - b.kickoff);

        const optimal_player = slot_options_optimal[0] || {
          player_id: "0",
          value: 0,
        };

        const current_player_id = starters[index];
        const current_player_kickoff =
          schedule[allplayers[current_player_id]?.team]?.kickoff || 0;
        const current_player_position = allplayers[current_player_id]?.position;
        const current_slot = slot;

        const earlyInFlex = starters
          .filter((s) => s !== current_player_id)
          .some((s, index2) => {
            const option_player_id = s;
            const option_player_kickoff =
              schedule[allplayers[option_player_id]?.team]?.kickoff || 0;
            const option_player_position =
              allplayers[option_player_id]?.position;
            const option_slot = roster_positions[index2];

            return (
              current_player_kickoff < option_player_kickoff &&
              position_map[current_slot].length >
                position_map[option_slot].length &&
              position_map[option_slot].includes(current_player_position) &&
              position_map[current_slot].includes(option_player_position)
            );
          });

        const lateNotInFlex = starters
          .filter((s) => s !== current_player_id)
          .some((s, index2) => {
            const option_player_id = s;
            const option_player_kickoff =
              schedule[allplayers[option_player_id]?.team]?.kickoff || 0;
            const option_player_position =
              allplayers[option_player_id]?.position;
            const option_slot = roster_positions[index2];

            return (
              current_player_kickoff > option_player_kickoff &&
              position_map[current_slot].length <
                position_map[option_slot].length &&
              position_map[current_slot].includes(option_player_position) &&
              position_map[option_slot].includes(current_player_position)
            );
          });

        optimal_starters_ordered.push({
          index: roster_positions.indexOf(slot),
          slot__index: `${slot}__${index}`,
          optimal_player_id: optimal_player.player_id,
          optimal_player_position: optimal_player.position,
          optimal_player_value: optimal_player.value,
          current_player_id: starters[index],
          current_player_value: values[starters[index]],
          inOrder: !earlyInFlex && !lateNotInFlex,
        });
      } else {
        optimal_starters_ordered.push({
          index: roster_positions.indexOf(slot),
          slot__index: `${slot}__${index}`,
          optimal_player_id: starters[index],
          optimal_player_position: "-",
          optimal_player_value: 0,
          current_player_id: "0",
          current_player_value: 0,
          inOrder: true,
        });
      }
    });
  */

  return optimal_starters_ordered.sort((a, b) => a.index - b.index);
};
