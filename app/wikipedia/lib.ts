import wiki, { wikiSummary } from "wikipedia";
import { WBK } from "wikibase-sdk";
import { GameData } from "@/app/game/data";

wiki.setLang("zh");
const wbk = WBK({
  instance: "https://www.wikidata.org",
  sparqlEndpoint: "https://query.wikidata.org/sparql",
});

async function filterWithWB(qid: string): Promise<boolean> {
  // wdt:P31 - instance of
  // wdt:P279 - subclass of
  // wd:Q5 - human
  // wd:Q618123 - geographical feature
  const sparqlQuery = `
    SELECT ?is_person ?is_geo
    WHERE {
      BIND(EXISTS { wd:${qid} wdt:P31/wdt:P279* wd:Q5 } AS ?is_person)
      BIND(EXISTS { wd:${qid} wdt:P31/wdt:P279* wd:Q618123 } AS ?is_geo)
    }
  `;
  const url = wbk.sparqlQuery(sparqlQuery);
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(
        `HTTP status code ${response.status} when fetching wikidata`,
      );
    const data = await response.json();

    const binding = data.results.bindings[0];
    const isPerson = binding?.is_person?.value === "true";
    const isGeo = binding?.is_geo?.value === "true";
    console.log(
      `wikidata says qid ${qid} isPerson? ${isPerson}, isGeo? ${isGeo}`,
    );
    return isPerson || isGeo;
  } catch (err) {
    console.error("Query wikidata failed:", err);
    return false;
  }
}

export async function randomPageFiltered(): Promise<GameData> {
  while (true) {
    const response = await wiki.random();
    const summary = response as wikiSummary;
    const qid = summary.wikibase_item;
    const filtered = await filterWithWB(qid);

    if (!filtered)
      return {
        title: summary.title,
        content: summary.extract,
        language: "zh",
      };

    console.log("不幸抽中地理或人物了，换一个");
    await new Promise((resolve) => setTimeout(resolve, 1000)); // sleep 1s
  }
}
