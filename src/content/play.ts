export type PlayItem = {
  slug: string;
  name: string;
  kind: "game" | "tool";
  blurb: string;
  /** Shown on the card so expectations match reality. */
  meta: string;
};

export const playItems: PlayItem[] = [
  {
    slug: "chess",
    name: "Chess",
    kind: "game",
    blurb:
      "Play white against a negamax engine with alpha-beta pruning. Full rules — castling, en passant, promotion.",
    meta: "vs engine · 3 depths",
  },
  {
    slug: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    kind: "game",
    blurb:
      "Play against a minimax opponent that never loses, or drop it to an easier setting and take the win.",
    meta: "1 player vs AI · 3 difficulties",
  },
  {
    slug: "snake",
    name: "Snake",
    kind: "game",
    blurb:
      "The classic. Arrow keys on desktop, swipe on mobile, and a high score kept in your browser.",
    meta: "Keyboard & touch · Local high score",
  },
  {
    slug: "memory",
    name: "Memory Match",
    kind: "game",
    blurb:
      "Match pairs in as few moves as possible. The cards are terms from the AI stack this site runs on.",
    meta: "3 difficulties · Best score saved",
  },
  {
    slug: "typing",
    name: "Typing Speed Test",
    kind: "game",
    blurb:
      "Words per minute and accuracy over 15, 30 or 60 seconds, on passages about AI engineering.",
    meta: "Standard WPM · Live accuracy",
  },
  {
    slug: "number-guess",
    name: "Number Guess",
    kind: "game",
    blurb:
      "Find the number in as few guesses as possible. The remaining range narrows so you can watch binary search work.",
    meta: "3 ranges · Best score saved",
  },
  {
    slug: "ai-quiz",
    name: "AI & ML Quiz",
    kind: "game",
    blurb:
      "Ten questions on LLMs, retrieval, fine-tuning and agent safety — each with the reasoning behind the answer.",
    meta: "10 questions · Explained answers",
  },
  {
    slug: "dsa-quiz",
    name: "DSA Quiz",
    kind: "game",
    blurb:
      "Complexity, trees, graphs and the classic algorithms. The interview staples, with explanations.",
    meta: "10 questions · Explained answers",
  },
  {
    slug: "pomodoro",
    name: "Pomodoro Timer",
    kind: "tool",
    blurb:
      "Focus sessions with configurable work and break lengths, session counting, and a finish chime.",
    meta: "Configurable · Session tracking",
  },
  {
    slug: "word-counter",
    name: "Word Counter",
    kind: "tool",
    blurb:
      "Words, characters, sentences, reading time and most-used words — computed entirely in your browser.",
    meta: "Live stats · Nothing uploaded",
  },
];

export const games = playItems.filter((i) => i.kind === "game");
export const tools = playItems.filter((i) => i.kind === "tool");

export function getPlayItem(slug: string) {
  return playItems.find((i) => i.slug === slug);
}
