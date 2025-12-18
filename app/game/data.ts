export type GameData = {
  title: string;
  content: string;
  language: "zh" | "en";
};

export const sampleGameData: GameData = {
  title: "自然语言处理",
  content:
    "自然语言处理是人工智能和语言学领域的分支，致力于让计算机能理解、生成人类语言。",
  language: "zh",
};
