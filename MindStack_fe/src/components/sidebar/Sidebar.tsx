import { Logo } from "../icons/MindStacklogo.js";
import { TwitterIcon } from "../icons/twitter.js";
import { YoutubeIcon } from "../icons/youtube.js";
import { AllLogo } from "../icons/All.js";
import { SidebarItem } from "./SidebarItem.js";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Random } from "../icons/Random.js";
import { assets } from "../../assets/assets.js";
import { useEffect, useState } from "react";

type Filter = "all" | "twitter" | "youtube" | "random";

export function Sidebar({
  extended,
  setExtended,
  onSelectType,
  active,
  username,
}: {
  extended: boolean;
  setExtended: (v: boolean) => void;
  onSelectType: (f: Filter) => void;
  active: Filter;
  username: string;
}) {
  const navigate = useNavigate();
  const [showToggle, setShowToggle] = useState(!extended);
  const [mobileView, setMobileView] = useState(false);
  const userInitial = username.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (extended) {
      setShowToggle(false);
    } else {
      // Delay the button appearance to match the sidebar's closing animation
      const timer = setTimeout(() => setShowToggle(true), 300);
      return () => clearTimeout(timer);
    }
  }, [extended]);

  const handleMobileSelect=(f: Filter) => {
    onSelectType(f);
    setMobileView(false);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/signin");
  }

  return (
   <>
      {/* --- Mobile View (Visible below md breakpoint) --- */}
      <div className="md:hidden">
        {/* Hamburger Icon */}
        <img
          onClick={() => setMobileView(true)}
          className="cursor-pointer w-8 h-8 bg-[#2D2B55] hover:bg-[#3E3B6D] rounded-full shadow-md p-1 fixed top-5 left-4 z-40"
          src={assets.menu_icon}
          alt="menu"
        />

        {/* Mobile Menu Overlay */}
        {mobileView && (
          <div className="fixed inset-0 bg-[#0F0F1A] z-50 p-4 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Logo />
                <span className="text-2xl font-bold text-white">MindStack</span>
              </div>
             
              <button
                onClick={() => setMobileView(false)}
                className="text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="mt-12 flex-1 flex flex-col gap-2 text-lg">
              <div
                onClick={() => handleMobileSelect("all")}
                className={`p-3 rounded-md cursor-pointer ${
                  active === "all" ? "bg-white/10 font-semibold" : "text-gray-400"
                }`}
              >
                All
              </div>
              <div
                onClick={() => handleMobileSelect("twitter")}
                className={`p-3 rounded-md cursor-pointer ${
                  active === "twitter" ? "bg-white/10 font-semibold" : "text-gray-400"
                }`}
              >
                Tweets
              </div>
              <div
                onClick={() => handleMobileSelect("youtube")}
                className={`p-3 rounded-md cursor-pointer ${
                  active === "youtube" ? "bg-white/10 font-semibold" : "text-gray-400"
                }`}
              >
                YouTube
              </div>
              <div
                onClick={() => handleMobileSelect("random")}
                className={`p-3 rounded-md cursor-pointer ${
                  active === "random" ? "bg-white/10 font-semibold" : "text-gray-400"
                }`}
              >
                Random
              </div>
            </div>
            <div className="mt-auto mb-6 flex items-center justify-between  p-3">
              <div className="group relative flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  title={username || "Account"}
                  aria-label={username || "Account"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C4C2FF]/40 bg-[#303060] text-base font-semibold text-[#C4C2FF]"
                >
                  {userInitial}
                </button>
                {username && (
                  <span className="max-w-40 truncate text-sm font-medium text-gray-300">
                    {username}
                  </span>
                )}
                {username && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {username}
                  </div>
                )}
              </div>
              <div className="group relative">
                <button
                  type="button"
                  title="Logout"
                  aria-label="Logout"
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-6 w-6" />
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Logout
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* --- Desktop View (Hidden below md breakpoint) --- */}
      <div className="hidden md:block">
        <div
          className={`h-screen bg-[#2D2B55] text-[#C4C2FF] border-r border-amber-50/10 w-72 fixed left-0 top-0 z-30 transition-transform duration-300 ${
            extended ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          <div className="flex items-center justify-between px-3 py-1 gap-3 mt-4">
            <div className="flex items-center gap-3">
              <div className="mt-1">
                <Logo />
              </div>
              <span className="text-2xl font-bold">MindStack</span>
            </div>
            <img
              onClick={() => setExtended(!extended)}
              className="cursor-pointer w-7 h-7 bg-[#3E3B6D] hover:bg-[#4D4A80] rounded-full shadow-md p-1"
              src={assets.menu_icon}
              alt="menu"
            />
          </div>

          <div className="mt-4 flex-1">
            <div
              onClick={() => onSelectType("all")}
              className={active === "all" ? "bg-white/10" : ""}
            >
              <SidebarItem text="All" icon={<AllLogo />} />
            </div>
            <div
              onClick={() => onSelectType("twitter")}
              className={active === "twitter" ? "bg-white/10" : ""}
            >
              <SidebarItem text="Tweets" icon={<TwitterIcon />} />
            </div>
            <div
              onClick={() => onSelectType("youtube")}
              className={active === "youtube" ? "bg-white/10" : ""}
            >
              <SidebarItem text="YouTube" icon={<YoutubeIcon />} />
            </div>
            <div
              onClick={() => onSelectType("random")}
              className={active === "random" ? "bg-white/10" : ""}
            >
              <SidebarItem text="Random" icon={<Random />} />
            </div>
          </div>

          <div className="mt-auto mb-6 flex items-center justify-between px-5">
            <div className="group relative flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C4C2FF]/40 bg-[#303060] text-base font-semibold text-[#C4C2FF] transition-colors hover:bg-[#3E3B6D]"
              >
                {userInitial}
              </button>
              {username && (
                <span className="max-w-36 truncate text-sm font-medium text-[#C4C2FF]">
                  {username}
                </span>
              )}
              
            </div>
            <div className="group relative">
              <button
                type="button"
                title="Logout"
                aria-label="Logout"
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-full text-[#C4C2FF] transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-6 w-6" />
              </button>
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                Logout
              </div>
            </div>
          </div>
        </div>
        {showToggle && (
          <img
            onClick={() => setExtended(true)}
            className="cursor-pointer w-8 h-8 bg-[#2D2B55] hover:bg-[#3E3B6D] rounded-full shadow-md p-1 fixed top-5 left-4 z-20 transition-all "
            src={assets.menu_icon}
            alt="menu"
          />
        )}
      </div>
    </>
  );
}
