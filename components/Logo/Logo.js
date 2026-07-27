import { faBrain } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

export const Logo = ({ size = "default" }) => {
  const isLarge = size === "large";

  return (
    <Link
      href="/post/new"
      className={`flex items-center justify-center gap-2.5 hover:no-underline group ${
        isLarge ? "py-2" : "py-1"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500/30 transition-colors ${
          isLarge ? "h-12 w-12" : "h-9 w-9"
        }`}
      >
        <FontAwesomeIcon
          icon={faBrain}
          className={isLarge ? "text-2xl" : "text-lg"}
        />
      </span>
      <span
        className={`font-heading text-white tracking-tight ${
          isLarge ? "text-4xl md:text-5xl" : "text-2xl"
        }`}
      >
        BlogStandard
      </span>
    </Link>
  );
};
