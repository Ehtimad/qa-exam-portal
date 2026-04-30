export interface ScoredQuestion {
  id: number;
  points: number;
  earned: number;
  type: string;
  correctAnswers: number[];
  givenDisplayAnswers: number[];   // display-space indices (shuffled)
  givenOriginalAnswers: number[];  // original-space indices (for DB lookup)
}

/**
 * Convert display-space answer indices to original-space using the option order.
 * optionOrder[i] = original index shown at display position i
 */
export function toOriginalIndices(displayAnswers: number[], optionOrder: number[]): number[] {
  return displayAnswers.map((di) => optionOrder[di] ?? di);
}

/**
 * Calculate score for one question.
 *
 * Single: full points if exactly correct, else 0.
 * Multiple: partial = max(0, correct_hits − wrong_hits) / total_correct * points
 */
export function scoreQuestion(
  type: string,
  correctAnswers: number[],
  givenOriginal: number[],
  points: number
): number {
  const correctSet = new Set(correctAnswers);
  if (type === "single") {
    if (givenOriginal.length === 1 && correctSet.has(givenOriginal[0])) return points;
    return 0;
  }
  // multiple
  let correctHits = 0;
  let wrongHits = 0;
  for (const g of givenOriginal) {
    if (correctSet.has(g)) correctHits++;
    else wrongHits++;
  }
  const raw = Math.max(0, correctHits - wrongHits) / correctAnswers.length * points;
  return Math.round(raw * 100) / 100; // 2 decimal precision
}

interface DBQuestion {
  id: number;
  type: string;
  points: number;
  correctAnswers: number[] | string; // string when coming straight from DB JSON
}

/**
 * Full exam scoring.
 * score = sum of earned points (same scale as maxScore = sum of question points).
 * The maxScore param is kept for backward compat but ignored — dynamicMax is computed internally.
 */
export function calculateExamScore(
  answers: Record<string, number[]>,
  questionOrder: number[],
  optionOrders: Record<string, number[]>,
  dbQuestions: DBQuestion[],
  _maxScore = 500
): { score: number; correctCount: number; details: ScoredQuestion[] } {
  const qMap = new Map(dbQuestions.map((q) => [q.id, q]));

  let rawScore = 0;
  let correctCount = 0;
  const details: ScoredQuestion[] = [];

  for (const qId of questionOrder) {
    const q = qMap.get(qId);
    if (!q) continue;

    const correctAnswers: number[] =
      typeof q.correctAnswers === "string"
        ? JSON.parse(q.correctAnswers)
        : q.correctAnswers;

    const displayAnswers = answers[String(qId)] ?? [];
    const optionOrder = optionOrders[String(qId)] ?? Array.from({ length: 10 }, (_, i) => i);
    const originalAnswers = toOriginalIndices(displayAnswers, optionOrder);

    const earned = scoreQuestion(q.type, correctAnswers, originalAnswers, q.points);
    rawScore += earned;
    if (earned === q.points) correctCount++;

    details.push({
      id: qId,
      points: q.points,
      earned,
      type: q.type,
      correctAnswers,
      givenDisplayAnswers: displayAnswers,
      givenOriginalAnswers: originalAnswers,
    });
  }

  return { score: Math.round(rawScore * 100) / 100, correctCount, details };
}
