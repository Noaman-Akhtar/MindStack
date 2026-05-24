import { useEffect, useRef, useState } from "react";
import type Delta from "quill-delta";
import "../App.css";
import { Button } from "../components/ui/Button";
import { PlusIcon } from "../components/icons/plusIcon";
import { Card } from "../components/ui/Card";
import { Sidebar } from "../components/sidebar/Sidebar";
import { BACKEND_URL } from "../config";
import axios from "axios";
import { Overlay } from "../components/ui/Overlay";
import { CreateContentModal } from "../components/modals/CreateContentModal";
import { ViewContentModal } from "../components/modals/viewModal";
import { SearchContentModel } from "../components/modals/SearchContentModel";
import { DeleteConfirmModal } from "../components/modals/DeleteConfirmModal";
import { LoaderCircle } from "lucide-react";

type Filter = "all" | "twitter" | "youtube" | "random";

type Content = {
  richNote: string | undefined;
  richNoteDelta: Delta | null;
  id?: string;
  _id?: string;
  title: string;
  link: string;
  type: "twitter" | "youtube";
  note?: string;
  score: number | undefined;
};

const CONTENT_PAGE_LIMIT = 6;
const SCROLL_LOAD_OFFSET = 500;
const DEBUG_PAGINATION = false;

type DashboardNavProps = {
  scrolled: boolean;
  onAddContent: () => void;
  onSearch: () => void;
};

function DashboardNav({
  scrolled,
  onAddContent,
  onSearch,
}: DashboardNavProps) {
  return (
    <div
      className={`fixed top-0 right-0 left-0 z-20 flex items-center justify-end gap-2 py-2 pt-4 sm:gap-5 transition-all duration-300 bg-[#0F0F1A] px-4 ${
        scrolled ? "border-b border-gray-800" : "border-b border-transparent"
      }`}
    >
      <div className="flex items-center justify-end sm:gap-5 gap-2">
        <input
          placeholder="Search"
          className="px-2 py-2 p-1 rounded-xl border-1 border-[#C4C2FF]  sm:text-base  text-[#C4C2FF] w-28 sm:w-56 focus:outline-none"
          onFocus={onSearch}
        ></input>
        <Button
          variant="primary"
          size="md"
          text="Add Content"
          startIcon={<PlusIcon size="md" />}
          onClick={onAddContent}
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const [filter, setFilter] = useState<Filter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [extended, setExtended] = useState(true);
  const [cards, setCards] = useState<Content[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/v1/me`, {
          headers: { Authorization: localStorage.getItem("token") ?? "" },
        });

        if (data?.email) {
          setEmail(data.email);
        }
      } catch (error) {
        console.error("Failed to load current user", error);
      }
    };

    fetchCurrentUser();
  }, []);

  const fetchCards = async (pageToFetch = 1, replace = false) => {
    if (loadingRef.current) return;

    try {
      loadingRef.current = true;
      setLoading(true);
      if (DEBUG_PAGINATION) {
        console.log("[pagination] fetching", {
          page: pageToFetch,
          replace,
          filter,
        });
      }
      const { data } = await axios.get(`${BACKEND_URL}/api/v1/content`, {
        headers: { Authorization: localStorage.getItem("token") ?? "" },
        params: {
          page: pageToFetch,
          limit: CONTENT_PAGE_LIMIT,
          type: filter,
        },
      });
      const newCards = data?.content ?? [];

      setCards((prev) => (replace ? newCards : [...prev, ...newCards]));
      setHasMore(data?.hasMore ?? false);
      if (DEBUG_PAGINATION) {
        console.log("[pagination] response", {
          requestedPage: pageToFetch,
          received: newCards.length,
          hasMore: data?.hasMore,
          totalItems: data?.totalItems,
          totalPages: data?.totalPages,
        });
      }
    } catch {
      if (replace) setCards([]);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setCards([]);
    setHasMore(true);
    fetchCards(1, true);
  }, [filter]);
  useEffect(() => {
    if (page === 1) return;

    fetchCards(page, false);
  }, [page]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (DEBUG_PAGINATION) {
          console.log("[pagination] sentinel", {
            isIntersecting: entry.isIntersecting,
            hasMore,
            loading: loadingRef.current,
            searchMode,
          });
        }

        if (entry.isIntersecting && hasMore && !loadingRef.current && !searchMode) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: `${SCROLL_LOAD_OFFSET}px`,
        threshold: 0,
      },
    );

    observer.observe(loader);

    return () => observer.disconnect();
  }, [cards.length, hasMore, loading, searchMode]);

  const requestDelete = (id: string) => {
    const card = cards.find((c) => (c._id ?? c.link) === id);
    setPendingDelete({ id, title: card?.title ?? "" });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    const prev = cards;
    setCards(prev.filter((c) => c._id !== id));
    try {
      await axios.delete(`${BACKEND_URL}/api/v1/content/${id}`, {
        headers: { Authorization: localStorage.getItem("token") ?? "" },
      });
    } catch (e) {
      setCards(prev);
      console.error(e);
      alert("Failed to delete. Try again.");
    }
  };

  const handleSearchComplete = (
    query: string,
    results: Array<{ _id: string; score?: number }>,
  ) => {
    setSearchMode(true);
    setSearchQuery(query);
    const byId = new Map(cards.map((c) => [String(c._id), c]));

    // Preserve Pinecone order: walk results in order and pick matching cards
    const ranked = results
      .map((r) => {
        const card = byId.get(String(r._id));
        return card ? { ...card, score: r.score } : null;
      })
      .filter((c): c is Content => !!c);

    setSearchResults(ranked);
    setSearch(false);
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const filteredSearchResults = searchMode
    ? searchResults.filter((c) => (filter === "all" ? true : c.type === filter))
    : [];
  const listToRender = searchMode ? filteredSearchResults : cards;

  const viewingContent = cards.find((c) => c._id === viewingId) || null;
  return (
    <div className="min-h-screen bg-[#0F0F1A] ">
      <DashboardNav
        scrolled={scrolled}
        onAddContent={() => setModalOpen(true)}
        onSearch={() => setSearch(true)}
      />
      {/* Sidebar */}

      <Sidebar
        extended={extended}
        setExtended={setExtended}
        onSelectType={(f: Filter) => setFilter(f)}
        active={filter}
        email={email}
      />

      {/* Main content  */}
      <div
        className={`flex-1 px-4 justify-center  transition-all duration-300 pt-15 ${
          extended ? "sm:ml-70" : "sm:ml-8"
        }`}
      >
        <Overlay
          open={search}
          onClose={() => setSearch(false)}
          Modal={
            <SearchContentModel
              onClose={() => setSearch(false)}
              open={search}
              onViewAll={handleSearchComplete}
            />
          }
        />

        <Overlay
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onContentAdded={fetchCards}
          Modal={
            <CreateContentModal
              onClose={() => setModalOpen(false)}
              onContentAdded={() => {
                setPage(1);
                fetchCards(1, true);
              }}
            />
          }
        />
        <Overlay
          open={!!viewingContent}
          onClose={() => setViewingId(null)}
          Modal={
            viewingContent ? (
              <ViewContentModal
                content={viewingContent}
                onClose={() => setViewingId(null)}
                onUpdated={(updated) => {
                  // Patch local state
                  setCards((prev) =>
                    prev.map((c) =>
                      c._id === updated._id ? { ...c, ...updated } : c,
                    ),
                  );
                }}
              />
            ) : undefined
          }
        />

        {/* Search Banner */}

        {searchMode && (
          <div className="my-2 text-lg text-gray-100 ">
            Showing results for: “{searchQuery}”
            <button
              onClick={clearSearch}
              className="ml-2 underline text-lg font-bold cursor-pointer text-gray-100"
            >
              Clear
            </button>
          </div>
        )}
        {/* cards */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-10 justify-items-center py-2 ${
            extended
              ? "lg:grid-cols-2 xl:grid-cols-3"
              : "lg:grid-cols-3 xl:grid-cols-4"
          }`}
        >
          {listToRender.map((card) => (
            <Card
              key={card._id}
              _id={card._id}
              type={card.type}
              text={card.title}
              link={card.link}
              note={card.note}
              richNote={card.richNote}
              richNoteDelta={card.richNoteDelta}
              onDelete={requestDelete}
              onView={setViewingId}
              searchScore={searchMode ? card.score : undefined}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <LoaderCircle className="h-7 w-7 animate-spin text-[#C4C2FF]" />
          </div>
        )}

        {!searchMode && <div ref={loaderRef} className="h-8" />}

        {/* Delete confirmation modal */}
        <DeleteConfirmModal
          open={!!pendingDelete}
          title={pendingDelete?.title}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
