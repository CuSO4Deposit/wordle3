import { NextRequest } from "next/server";

const WIKI_API_URL = "https://zh.wikipedia.org/api/rest_v1/page/random/summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "zh";

    if (lang !== "zh") {
      return new Response(
        JSON.stringify({ error: "Only Chinese (zh) is supported for now." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const res = await fetch(WIKI_API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "wordle3/1.0 (https://depoze.com)",
      },
    });

    if (!res.ok) {
      throw new Error(`Wikipedia API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    const { title, extract } = data;

    if (!title || !extract) {
      throw new Error("Missing title or extract");
    }

    const gameData = {
      title: title.trim(),
      content: extract.trim(),
      language: "zh" as const,
    };

    return new Response(JSON.stringify(gameData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching random Wikipedia page:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch random Wikipedia page" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
