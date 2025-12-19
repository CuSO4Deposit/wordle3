"use client";

import { useState, useEffect, useMemo } from "react";
import { GameData } from "./data";

type Token = {
  id: number;
  value: string;
  isPunctuation: boolean;
  source: "title" | "content";
};

export default function WordleGame() {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [guessedUnits, setGuessedUnits] = useState<Set<string>>(new Set());
  const [nonExistentUnits, setNonExistentUnits] = useState<Set<string>>(
    new Set(),
  );
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchRandomWiki = async () => {
      try {
        const res = await fetch("/api/wikipedia");
        if (!res.ok) {
          throw new Error("Failed to load");
        }
        const data = await res.json();
        setGameData(data);
      } catch {
        setErrorMessage("无法加载维基百科内容，请重试。");
      } finally {
        setLoading(false);
      }
    };

    fetchRandomWiki();
  }, []);

  const isChinese = gameData?.language === "zh";

  const tokenize = (
    text: string,
    source: "title" | "content",
    isChinese: boolean,
  ): Token[] => {
    const punctuationRegex = /\p{P}/u;
    const units = isChinese
      ? Array.from(text)
      : text.split(/\s+/).filter(Boolean);
    return units.map((value, idx) => ({
      id: source === "title" ? idx : idx + 10000,
      value,
      isPunctuation: punctuationRegex.test(value),
      source,
    }));
  };

  const allTokens = useMemo(() => {
    if (!gameData) return [];
    const isChinese = gameData?.language === "zh";
    return [
      ...tokenize(gameData.title, "title", isChinese),
      ...tokenize(gameData.content, "content", isChinese),
    ];
  }, [gameData]);

  const titleNonPunctUnits = useMemo(() => {
    if (!gameData) return new Set<string>();
    const isChinese = gameData?.language === "zh";
    return new Set(
      tokenize(gameData.title, "title", isChinese)
        .filter((t) => !t.isPunctuation)
        .map((t) => t.value),
    );
  }, [gameData]);

  useEffect(() => {
    if (!titleNonPunctUnits.size) return;
    const completed = Array.from(titleNonPunctUnits).every((unit) =>
      guessedUnits.has(unit),
    );
    if (completed && !isComplete) {
      setIsComplete(true);
    }
  }, [guessedUnits, titleNonPunctUnits, isComplete]);

  if (loading) {
    return <div className="p-10">正在加载随机文章……</div>;
  }

  if (!gameData) {
    return (
      <div className="p-10 text-red-600">{errorMessage || "加载失败"}</div>
    );
  }

  const validateInput = (
    input: string,
  ): { valid: boolean; unit?: string; message?: string } => {
    const trimmed = input.trim();
    if (!trimmed) {
      return { valid: false, message: "请输入一个汉字或英文单词" };
    }
    if (trimmed.length === 1 && /^[\u4e00-\u9fff]$/.test(trimmed)) {
      return { valid: true, unit: trimmed };
    }
    if (/^[a-zA-Z]+$/.test(trimmed)) {
      return { valid: true, unit: trimmed };
    }
    return { valid: false, message: "请输入一个汉字或仅由英文字母组成的单词" };
  };

  const handleSubmit = () => {
    setErrorMessage("");
    const { valid, unit, message } = validateInput(inputValue);
    if (!valid) {
      setErrorMessage(message || "输入格式不正确");
      return;
    }

    if (guessedUnits.has(unit!)) {
      setInputValue("");
      return;
    }

    setGuessedUnits((prev) => new Set(prev).add(unit!));

    const exists = allTokens.some((t) => t.value === unit);
    if (!exists) {
      setNonExistentUnits((prev) => new Set(prev).add(unit!));
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const renderToken = (token: Token) => {
    const isGuessed = guessedUnits.has(token.value);

    let displayText = "";
    let className =
      "inline-flex items-center justify-center mx-0.5 rounded font-mono ";

    if (token.isPunctuation) {
      displayText = token.value;
      className += "text-gray-300";
    } else if (isComplete) {
      displayText = token.value;
      className += isGuessed
        ? "bg-green-900/60 text-green-200"
        : "text-gray-300";
    } else if (isGuessed) {
      displayText = token.value;
      className += "bg-green-900/60 text-green-200";
    } else {
      displayText = isChinese ? "●" : "■";
    }

    if (!token.isPunctuation && !isChinese && (isComplete || isGuessed)) {
      className += " min-w-[2rem] px-1 h-8 ";
    } else if (
      isChinese &&
      !token.isPunctuation &&
      !(isComplete || isGuessed)
    ) {
      className += " w-6 h-8 ";
    }

    return (
      <span key={token.id} className={className}>
        {displayText}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6 flex flex-col items-center text-gray-200">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">wordle3</h1>
      <h2 className="text-gray-400 text-sm mb-6">
        对 xiaoce.fun/baike 拙劣的模仿
      </h2>

      {isComplete && (
        <div className="mb-4 px-4 py-2 bg-green-900/50 text-green-300 rounded border border-green-800">
          牛逼
        </div>
      )}

      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 mb-6 border border-gray-700">
        <div className="mb-4 pb-2 border-b border-gray-700">
          {allTokens.filter((t) => t.source === "title").map(renderToken)}
        </div>
        <div>
          {allTokens.filter((t) => t.source === "content").map(renderToken)}
        </div>
      </div>

      {!isComplete && (
        <div className="mb-6 w-full max-w-xs flex flex-col items-center">
          <div className="flex w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isChinese ? "输入一个汉字" : "输入一个英文单词"}
              className="flex-1 px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              猜
            </button>
          </div>
          {errorMessage && (
            <p className="mt-2 text-sm text-red-400">{errorMessage}</p>
          )}
        </div>
      )}

      {!isComplete && nonExistentUnits.size > 0 && (
        <div className="mt-4 w-full max-w-2xl">
          <p className="text-sm text-gray-400 mb-1">未出现的字/词：</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.from(nonExistentUnits).map((unit, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-sm border border-gray-600"
              >
                {unit}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
