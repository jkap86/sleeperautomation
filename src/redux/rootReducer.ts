import { combineReducers } from "redux";
import commonSlice from "./commonSlice";
import matchupsSlice from "./matchupsSlice";

const rootReducer = combineReducers({
  common: commonSlice,
  matchups: matchupsSlice,
});

export default rootReducer;
