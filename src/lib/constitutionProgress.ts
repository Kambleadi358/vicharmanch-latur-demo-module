/**
 * Local, anonymous learning progress for the Constitution literacy module.
 * Stored only in the visitor's own browser. No personal data, no server storage.
 */

const KEY = "vm_constitution_progress_v1";

export interface ConstitutionProgress {
  articlesViewed: string[]; // article numbers
  topicsExplored: string[]; // category slugs
  lessonsCompleted: string[]; // lesson ids
  searches: number;
  quizAttempts: { at: string; percentage: number; phase: "pre" | "post" | "normal" }[];
  topicScores: Record<string, number>; // category slug -> latest percentage
}

const empty: ConstitutionProgress = {
  articlesViewed: [],
  topicsExplored: [],
  lessonsCompleted: [],
  searches: 0,
  quizAttempts: [],
  topicScores: {},
};

export function readProgress(): ConstitutionProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...empty };
    return { ...empty, ...(JSON.parse(raw) as Partial<ConstitutionProgress>) };
  } catch {
    return { ...empty };
  }
}

function write(p: ConstitutionProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    window.dispatchEvent(new Event("vm-constitution-progress"));
  } catch {
    /* storage may be unavailable (private mode) */
  }
}

export function resetProgress() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event("vm-constitution-progress"));
  } catch {
    /* ignore */
  }
}

const pushUnique = (arr: string[], v: string, max = 500) =>
  arr.includes(v) ? arr : [...arr, v].slice(-max);

export function markArticleViewed(articleNumber: string) {
  const p = readProgress();
  p.articlesViewed = pushUnique(p.articlesViewed, articleNumber);
  write(p);
}

export function markTopicExplored(slug: string) {
  const p = readProgress();
  p.topicsExplored = pushUnique(p.topicsExplored, slug);
  write(p);
}

export function toggleLessonCompleted(lessonId: string) {
  const p = readProgress();
  p.lessonsCompleted = p.lessonsCompleted.includes(lessonId)
    ? p.lessonsCompleted.filter((l) => l !== lessonId)
    : pushUnique(p.lessonsCompleted, lessonId);
  write(p);
}

export function markSearch() {
  const p = readProgress();
  p.searches += 1;
  write(p);
}

export function recordQuizAttempt(
  percentage: number,
  topicScores: Record<string, number>,
  phase: "pre" | "post" | "normal" = "normal"
) {
  const p = readProgress();
  p.quizAttempts = [...p.quizAttempts, { at: new Date().toISOString(), percentage, phase }].slice(-20);
  p.topicScores = { ...p.topicScores, ...topicScores };
  write(p);
}

/**
 * Educational progress indicator only — NOT a legal competency measure.
 * 0-100, weighted: exploration 40, lessons 20, quiz performance 40.
 */
export function literacyScore(
  p: ConstitutionProgress,
  totals: { articles: number; lessons: number; topics: number }
) {
  const exploreArticles = Math.min(1, p.articlesViewed.length / Math.max(1, Math.min(totals.articles, 40)));
  const exploreTopics = Math.min(1, p.topicsExplored.length / Math.max(1, totals.topics));
  const lessons = totals.lessons ? Math.min(1, p.lessonsCompleted.length / totals.lessons) : 0;
  const quizPcts = p.quizAttempts.map((a) => a.percentage);
  const quiz = quizPcts.length ? Math.max(...quizPcts) / 100 : 0;

  const score = exploreArticles * 25 + exploreTopics * 15 + lessons * 20 + quiz * 40;
  return {
    total: Math.round(score),
    breakdown: {
      articles: Math.round(exploreArticles * 100),
      topics: Math.round(exploreTopics * 100),
      lessons: Math.round(lessons * 100),
      quiz: Math.round(quiz * 100),
    },
  };
}

export function prePostSummary(p: ConstitutionProgress) {
  const pre = p.quizAttempts.find((a) => a.phase === "pre") ?? p.quizAttempts[0];
  const post =
    [...p.quizAttempts].reverse().find((a) => a.phase === "post") ??
    (p.quizAttempts.length > 1 ? p.quizAttempts[p.quizAttempts.length - 1] : undefined);
  if (!pre || !post || pre === post) return null;
  return {
    pre: pre.percentage,
    post: post.percentage,
    improvement: Math.round((post.percentage - pre.percentage) * 10) / 10,
  };
}
