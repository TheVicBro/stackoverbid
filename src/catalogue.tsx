import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiFetch } from "@/api/client";
import { endpoints } from "@/api/endpoints";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Item = {
  id: number;
  title: string;
  description: string;
  current_price: number;
  end_time: string;
  status: string;
};

export default function CataloguePage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadItems(search = "") {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      const path = search.trim()
        ? `${endpoints.catalogue.items}?keyword=${encodeURIComponent(search.trim())}`
        : endpoints.catalogue.items;

      const data = await apiFetch<Item[]>(path, {
        method: "GET",
        token,
      });

      setItems(data);
    } catch (err: any) {
      setError(err?.detail || "Failed to load catalogue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadItems(keyword);
  }

  return (
    <div className="min-h-screen bg-stone-100 text-gray-900 flex flex-col">
      <nav className="sticky top-0 z-50 bg-gray-900 border-b-[3px] border-orange-500">
        <div className="max-w-7xl mx-auto px-4 h-14 grid grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.jpg"
              alt="StackOverbid"
              className="h-8 w-auto rounded"
            />
            <span className="hidden sm:inline text-lg font-bold tracking-tight text-white whitespace-nowrap">
              Stack<span className="text-orange-400">Overbid</span>
            </span>
          </a>

          <form
            onSubmit={handleSearch}
            className="w-full max-w-2xl justify-self-center"
          >
            <div className="flex">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search for anything..."
                className="h-9 rounded-r-none border-none bg-white placeholder:text-gray-400 text-gray-900 shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 bg-orange-500 hover:bg-orange-400 rounded-l-none shrink-0"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 shrink-0 justify-self-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-gray-800 whitespace-nowrap"
              onClick={() => navigate("/")}
            >
              Back Home
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-6">
        <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 md:p-8">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-500/10 to-transparent" />
          <div className="relative">
            <p className="text-orange-400 text-sm font-semibold uppercase tracking-wide">
              Catalogue
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-white leading-snug">
              Browse all active auction items
            </h1>
            <p className="mt-2 text-sm text-gray-300">
              Search and explore live listings in one place.
            </p>
          </div>
        </section>

        {loading && <p className="text-sm text-gray-500">Loading items...</p>}

        {error && (
          <Card className="border-red-200 shadow-sm">
            <CardContent className="pt-6 text-sm text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {!loading && !error && items.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="pt-6 text-sm text-gray-500">
              No active items found.
            </CardContent>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <a key={item.id} href={`/items/${item.id}`} className="group">
                <Card className="overflow-hidden p-0 gap-0 hover:shadow-md hover:border-orange-200 transition-all duration-200 h-full">
                  <div className="aspect-square bg-stone-100" />
                  <CardContent className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {item.description}
                    </p>

                    <p className="mt-2 text-base font-bold text-gray-900">
                      ${item.current_price}
                    </p>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Ends: {new Date(item.end_time).toLocaleString()}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="text-xs text-orange-500 border-orange-200"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <Button className="mt-3 w-full bg-orange-500 text-white hover:bg-orange-400">
                      View Item
                    </Button>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
