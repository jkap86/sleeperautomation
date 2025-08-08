"use client";

import Link from "next/link";
import useLoadCommonData from "@/hooks/useLoadCommonData";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

export default function Home() {
  const { isLoggingIn, errorLoggingIn, isLoadingLeagues, errorLeagues } =
    useSelector((state: RootState) => state.common);

  useLoadCommonData();

  const links = [
    {
      href: "/putplayerotb",
      text: "Put Player OTB",
    },
    {
      href: "/setoptimallineups",
      text: "Set Optimal Lineups",
    },
  ];

  return (
    <div className="h-screen">
      {isLoggingIn ? (
        <h1>Logging In</h1>
      ) : isLoadingLeagues ? (
        <h1>Loading Leagues</h1>
      ) : (
        <div className="h-full flex flex-col items-center">
          {links.map((link) => {
            return (
              <div key={link.href} className="m-2">
                <Link href={link.href}>{link.text}</Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
