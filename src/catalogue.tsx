import { useEffect, useState } from "react";

import { apiFetch } from "@/api/client";
import { endpoints } from "@/api/endpoints";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = {
  id: number;
  title: string;
  description: string;
  current_price: number;
  end_time: string;
  status: string;
};

export default function CataloguePage() {
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
    <div className="min-h-screen bg-stone-100 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catalogue</h1>
            <p className="text-sm text-muted-foreground">
              Browse all active auction items.
            </p>
          </div>

          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back to Home
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by title"
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {loading && <p className="text-sm text-muted-foreground">Loading items...</p>}

        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6 text-sm text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {!loading && !error && items.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No active items found.
            </CardContent>
          </Card>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <a key={item.id} href={`/items/${item.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {item.description}
                    </p>

                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">Current Price:</span> ${item.current_price}
                      </p>
                      <p>
                        <span className="font-medium">Ends:</span>{" "}
                        {new Date(item.end_time).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> {item.status}
                      </p>
                    </div>

                    <Button className="w-full">View Item</Button>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}