import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGithubReadmeSummaryText,
  formatAiNewsOverviewPages,
  formatArxivOverviewPages,
  formatGithubOverviewPages,
  fetchAiNewsDigest,
  getAiNewsDigestCacheDate,
  getAiNewsTranslationInstruction,
  getArxivAbstractSummaryInstruction,
  getDigestItemLimit,
  getGithubReadmeSummaryInstruction,
  getGithubReadmeSummaryMaxChars,
} from "./sources";

test("GitHub README summary input uses a 5000 character README limit by default", () => {
  const original = process.env.GITHUB_README_SUMMARY_MAX_CHARS;
  delete process.env.GITHUB_README_SUMMARY_MAX_CHARS;

  try {
    assert.equal(getGithubReadmeSummaryMaxChars(), 5000);
  } finally {
    if (original === undefined) {
      delete process.env.GITHUB_README_SUMMARY_MAX_CHARS;
    } else {
      process.env.GITHUB_README_SUMMARY_MAX_CHARS = original;
    }
  }
});

test("GitHub README summary input trims long README content before calling the LLM", () => {
  const input = buildGithubReadmeSummaryText(
    {
      fullName: "owner/repo",
      description: "A useful project",
      language: "TypeScript",
    },
    `${"a".repeat(5000)}SHOULD_NOT_BE_SENT`,
    5000,
  );

  assert.equal(input.includes("SHOULD_NOT_BE_SENT"), false);
  assert.equal(input.includes("Project: owner/repo"), true);
  assert.equal(input.includes("Language: TypeScript"), true);
});

test("digest AI prompts require concise Chinese output between 80 and 120 characters", () => {
  const instruction = getGithubReadmeSummaryInstruction();
  const newsInstruction = getAiNewsTranslationInstruction();
  const arxivInstruction = getArxivAbstractSummaryInstruction();

  assert.match(instruction, /中文|简体中文/);
  assert.match(instruction, /80\s*到\s*120\s*字/);
  assert.match(instruction, /最多不超过\s*120\s*字/);
  assert.match(instruction, /不要输出 Markdown/);
  assert.match(newsInstruction, /80\s*到\s*120\s*字/);
  assert.match(newsInstruction, /最多不超过\s*120\s*字/);
  assert.match(arxivInstruction, /80\s*到\s*120\s*字/);
  assert.match(arxivInstruction, /最多不超过\s*120\s*字/);
  assert.doesNotMatch(`${instruction}\n${newsInstruction}\n${arxivInstruction}`, /3\s*到\s*4\s*句/);
});

test("AIHOT news items are rewritten by the digest LLM before rendering", async () => {
  const originalFetch = globalThis.fetch;
  const originalProvider = process.env.AI_NEWS_PROVIDER;
  const originalMode = process.env.AIHOT_DIGEST_MODE;
  const originalAihotBaseUrl = process.env.AIHOT_API_BASE_URL;
  const originalLlmApiKey = process.env.LLM_API_KEY;
  const originalLlmBaseUrl = process.env.LLM_API_BASE_URL;
  const originalLlmModel = process.env.LLM_MODEL;
  let llmCalls = 0;
  let llmRequestBody = "";

  process.env.AI_NEWS_PROVIDER = "aihot";
  process.env.AIHOT_DIGEST_MODE = "daily";
  process.env.AIHOT_API_BASE_URL = "https://aihot.test";
  process.env.LLM_API_KEY = "test-key";
  process.env.LLM_API_BASE_URL = "https://llm.test/compatible-mode/v1";
  process.env.LLM_MODEL = "qwen-plus";

  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url === "https://aihot.test/api/public/daily/2026-05-12") {
      return new Response(
        JSON.stringify({
          date: "2026-05-12",
          sections: [
            {
              label: "模型发布",
              items: [
                {
                  title: "AIHOT 测试标题",
                  summary: "AIHOT原始摘要，长度和风格不稳定，需要统一改写后再进入推送表格。",
                  sourceUrl: "https://example.com/aihot",
                  sourceName: "AIHOT",
                },
              ],
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://llm.test/compatible-mode/v1/chat/completions") {
      llmCalls += 1;
      llmRequestBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          id: "chatcmpl-test",
          object: "chat.completion",
          created: 0,
          model: "qwen-plus",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content:
                  "LLM统一摘要会保留标题里的核心主体，并把原始摘要压缩成稳定长度，说明事件动作、影响和适合关注的人群。",
              },
              finish_reason: "stop",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    throw new Error(`Unexpected fetch: ${url}`);
  };

  try {
    const pages = await fetchAiNewsDigest(1, { digestDate: "2026-05-12" });
    assert.equal(llmCalls, 1);
    assert.match(pages[0], /LLM统一摘要/);
    assert.doesNotMatch(pages[0], /AIHOT原始摘要/);
    assert.match(llmRequestBody, /AIHOT 测试标题/);
    assert.match(llmRequestBody, /AIHOT原始摘要/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) {
      delete process.env.AI_NEWS_PROVIDER;
    } else {
      process.env.AI_NEWS_PROVIDER = originalProvider;
    }
    if (originalMode === undefined) {
      delete process.env.AIHOT_DIGEST_MODE;
    } else {
      process.env.AIHOT_DIGEST_MODE = originalMode;
    }
    if (originalAihotBaseUrl === undefined) {
      delete process.env.AIHOT_API_BASE_URL;
    } else {
      process.env.AIHOT_API_BASE_URL = originalAihotBaseUrl;
    }
    if (originalLlmApiKey === undefined) {
      delete process.env.LLM_API_KEY;
    } else {
      process.env.LLM_API_KEY = originalLlmApiKey;
    }
    if (originalLlmBaseUrl === undefined) {
      delete process.env.LLM_API_BASE_URL;
    } else {
      process.env.LLM_API_BASE_URL = originalLlmBaseUrl;
    }
    if (originalLlmModel === undefined) {
      delete process.env.LLM_MODEL;
    } else {
      process.env.LLM_MODEL = originalLlmModel;
    }
  }
});

test("AIHOT daily cache date waits until the daily report is ready", () => {
  const originalProvider = process.env.AI_NEWS_PROVIDER;
  const originalMode = process.env.AIHOT_DIGEST_MODE;
  const originalReadyTime = process.env.AIHOT_DAILY_READY_TIME;
  process.env.AI_NEWS_PROVIDER = "aihot";
  process.env.AIHOT_DIGEST_MODE = "daily";
  process.env.AIHOT_DAILY_READY_TIME = "08:10";

  try {
    assert.equal(
      getAiNewsDigestCacheDate(new Date("2026-05-08T00:09:00.000Z"), "Asia/Shanghai"),
      "2026-05-07",
    );
    assert.equal(
      getAiNewsDigestCacheDate(new Date("2026-05-08T00:10:00.000Z"), "Asia/Shanghai"),
      "2026-05-08",
    );
  } finally {
    if (originalProvider === undefined) {
      delete process.env.AI_NEWS_PROVIDER;
    } else {
      process.env.AI_NEWS_PROVIDER = originalProvider;
    }
    if (originalMode === undefined) {
      delete process.env.AIHOT_DIGEST_MODE;
    } else {
      process.env.AIHOT_DIGEST_MODE = originalMode;
    }
    if (originalReadyTime === undefined) {
      delete process.env.AIHOT_DAILY_READY_TIME;
    } else {
      process.env.AIHOT_DAILY_READY_TIME = originalReadyTime;
    }
  }
});

test("daily digest limit defaults to 12 overview source items", () => {
  const original = process.env.DIGEST_ITEM_LIMIT;
  delete process.env.DIGEST_ITEM_LIMIT;

  try {
    assert.equal(getDigestItemLimit(), 12);
  } finally {
    if (original === undefined) {
      delete process.env.DIGEST_ITEM_LIMIT;
    } else {
      process.env.DIGEST_ITEM_LIMIT = original;
    }
  }
});

test("daily digest limit is capped to four pages of three rows", () => {
  const original = process.env.DIGEST_ITEM_LIMIT;
  process.env.DIGEST_ITEM_LIMIT = "99";

  try {
    assert.equal(getDigestItemLimit(), 12);
  } finally {
    if (original === undefined) {
      delete process.env.DIGEST_ITEM_LIMIT;
    } else {
      process.env.DIGEST_ITEM_LIMIT = original;
    }
  }
});

test("GitHub overview renders four list pages with stars inline with the title", () => {
  const longSummary = "这是一段用于验证摘要长度放宽到二百字的内容".repeat(6);
  const pages = formatGithubOverviewPages(
    Array.from({ length: 12 }, (_, index) => ({
      fullName: `owner/repo-${index + 1}`,
      url: `https://github.com/owner/repo-${index + 1}`,
      description: `Repo ${index + 1} helps developers build useful AI tools.`,
      language: "TypeScript",
      totalStars: "1,234",
      forks: "99",
      starsToday: "56",
      aiSummary: index === 0
        ? longSummary
        : `这是第 ${index + 1} 个项目的一句话总结，说明问题、能力和适用人群。`,
    })),
  );

  assert.equal(pages.length, 4);
  assert.match(
    pages[0],
    /\*\*1\. \[owner\/repo-1\]\(https:\/\/github\.com\/owner\/repo-1\)\*\*  ⭐ \[1,234 \/ \+56\]/,
  );
  assert.match(
    pages[1],
    /^\*\*4\. \[owner\/repo-4\]\(https:\/\/github\.com\/owner\/repo-4\)\*\*  ⭐ \[1,234 \/ \+56\]/,
  );
  assert.match(pages[0], new RegExp(longSummary));
  assert.equal(
    pages[0].split("\n").filter((line) => /^\*\*\d+\. \[owner\/repo-/.test(line)).length,
    3,
  );
  assert.doesNotMatch(pages.join("\n"), /总览 \d+\/\d+|\| 项目 \| 一句话总结 \||<br>|语言|TypeScript|Star 趋势|Fork|fork|🍴|99/);
});

test("AI news overview renders four list pages without source, category, and daily columns", () => {
  const longSummary = "这是一段用于验证新闻摘要长度放宽到二百字的内容".repeat(6);
  const pages = formatAiNewsOverviewPages(
    Array.from({ length: 12 }, (_, index) => ({
      title: `AI news ${index + 1}`,
      url: `https://example.com/news-${index + 1}`,
      source: "AIHOT",
      summary: index === 0 ? longSummary : `这是一条 AI 新闻摘要，保留主体、动作和影响。`,
      meta: "日报: 2026-05-08 | 分类: 模型发布/更新",
    })),
  );

  assert.equal(pages.length, 4);
  assert.match(pages[0], /^\*\*1\. \[AI news 1\]\(https:\/\/example\.com\/news-1\)\*\*/);
  assert.match(pages[1], /^\*\*4\. \[AI news 4\]\(https:\/\/example\.com\/news-4\)\*\*/);
  assert.match(pages[0], /\*\*1\. \[AI news 1\]\(https:\/\/example\.com\/news-1\)\*\*/);
  assert.match(pages[0], new RegExp(longSummary));
  assert.equal(
    pages[0].split("\n").filter((line) => /^\*\*\d+\. \[AI news /.test(line)).length,
    3,
  );
  assert.doesNotMatch(pages.join("\n"), /总览 \d+\/\d+|\| 标题 \| 一句话摘要 \||来源|AIHOT|分类|日报/);
});

test("arXiv overview renders four list pages with published date inline", () => {
  const longSummary = "这是一段用于验证论文摘要长度放宽到二百字的内容".repeat(6);
  const pages = formatArxivOverviewPages(
    Array.from({ length: 12 }, (_, index) => ({
      title: `Paper ${index + 1}`,
      url: `https://arxiv.org/abs/2605.${String(index + 1).padStart(5, "0")}`,
      authors: ["Alice", "Bob"],
      summary: index === 0
        ? longSummary
        : "本文提出一种新的 AI 方法，用于提升模型推理效率并降低训练成本。",
      published: "2026-05-08T00:00:00Z",
      primaryCategory: "cs.AI",
    })),
  );

  assert.equal(pages.length, 4);
  assert.match(
    pages[0],
    /\*\*1\. \[Paper 1\]\(https:\/\/arxiv\.org\/abs\/2605\.00001\)\*\*  `2026-05-08`/,
  );
  assert.match(
    pages[1],
    /^\*\*4\. \[Paper 4\]\(https:\/\/arxiv\.org\/abs\/2605\.00004\)\*\*  `2026-05-08`/,
  );
  assert.match(pages[0], new RegExp(longSummary));
  assert.equal(
    pages[0].split("\n").filter((line) => /^\*\*\d+\. \[Paper /.test(line)).length,
    3,
  );
  assert.doesNotMatch(pages.join("\n"), /总览 \d+\/\d+|\| 论文 \| 发布时间 \| 一句话摘要 \||作者|分类|Alice|Bob|cs\.AI/);
});
