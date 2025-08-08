"use client";

import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { useEffect } from "react";
import { fetchAllplayers, fetchLeagues, login } from "@/redux/commonActions";

export default function useLoadCommonData() {
  const dispatch: AppDispatch = useDispatch();
  const {
    token,
    isLoggingIn,
    errorLoggingIn,
    user_id,
    isLoadingAllplayers,
    errorAllplayers,
    allplayers,
    leagues,
    isLoadingLeagues,
    errorLeagues,
  } = useSelector((state: RootState) => state.common);

  useEffect(() => {
    if (!token && !isLoggingIn && !errorLoggingIn) {
      dispatch(login());
    }
  }, [token, isLoggingIn, errorLoggingIn, dispatch]);

  useEffect(() => {
    if (
      allplayers.updated_at < new Date().getTime() - 12 * 60 * 60 * 1000 &&
      !isLoadingAllplayers &&
      !errorAllplayers
    ) {
      dispatch(fetchAllplayers());
    }
  }, [allplayers, isLoadingAllplayers, errorAllplayers, dispatch]);

  useEffect(() => {
    if (
      leagues.updated_at < new Date().getTime() - 15 * 60 * 1000 &&
      user_id !== "" &&
      !isLoadingLeagues &&
      !errorLeagues
    ) {
      dispatch(fetchLeagues({ user_id }));
    }
  }, [leagues, user_id, isLoadingLeagues, errorLeagues, dispatch]);
}
