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
    slug: "pomodoro",
    name: "Pomodoro Timer",
    kind: "tool",
    blurb:
      "Focus sessions with configurable work and break lengths, session counting, and a finish chime.",
    meta: "Configurable · Session tracking",
  },
];

export const games = playItems.filter((i) => i.kind === "game");
export const tools = playItems.filter((i) => i.kind === "tool");

export function getPlayItem(slug: string) {
  return playItems.find((i) => i.slug === slug);
}
