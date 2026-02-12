"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

// ─── Config ────────────────────────────────────────────────────────

const COLS = 7;
const ROWS = 3;
const TOTAL_TILES = COLS * ROWS;

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TARGET_WORD = "MARIFLO";

// Target: middle row (row index 1), each column maps to a letter
function buildTargetMap(): Record<number, string> {
  const map: Record<number, string> = {};
  for (let i = 0; i < TARGET_WORD.length; i++) {
    map[COLS * 1 + i] = TARGET_WORD[i];
  }
  return map;
}

const TARGET_MAP = buildTargetMap();
const TARGET_INDICES = new Set(Object.keys(TARGET_MAP).map(Number));

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

// Color palette for tiles
const TILE_COLORS = [
  "#A8D5BA", // mint
  "#E8F5E9", // mint-light
  "#FFFFFF", // white
  "#D4AF37", // gold
  "#8EC5A4", // mint-hover
  "#FAF9F6", // ivory
];

function randomColor(): string {
  return TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];
}

// Wedding-themed symbols for the wave phase
const WEDDING_SYMBOLS = ["♥", "✧", "❀", "◆", "♡", "✦", "❁", "◇", "♢", "✿"];

function randomSymbol(): string {
  return WEDDING_SYMBOLS[Math.floor(Math.random() * WEDDING_SYMBOLS.length)];
}

// ─── Single Flip Tile ──────────────────────────────────────────────

interface TileState {
  char: string;
  bgColor: string;
  textColor: string;
}

interface FlipTileProps {
  current: TileState;
  next: TileState;
  flipping: boolean;
}

function FlipTile({ current, next, flipping }: FlipTileProps) {
  const [displayFront, setDisplayFront] = useState(true);
  const [frontState, setFrontState] = useState<TileState>(current);
  const [backState, setBackState] = useState<TileState>(next);

  useEffect(() => {
    if (flipping) {
      setBackState(next);
      setDisplayFront(true);
      // After half flip, show back face
      const timer = setTimeout(() => {
        setDisplayFront(false);
      }, 150);
      // After full flip, reset for next flip
      const resetTimer = setTimeout(() => {
        setFrontState(next);
        setDisplayFront(true);
      }, 300);
      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [flipping, next]);

  // Keep front state synced when not flipping
  useEffect(() => {
    if (!flipping) {
      setFrontState(current);
    }
  }, [current, flipping]);

  const shown = displayFront ? frontState : backState;

  return (
    <div
      className="relative select-none overflow-hidden"
      style={{
        width: "clamp(40px, 11vw, 80px)",
        height: "clamp(52px, 14vw, 104px)",
        perspective: "400px",
      }}
    >
      <motion.div
        animate={{
          rotateX: flipping ? (displayFront ? -90 : 0) : 0,
        }}
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="flex h-full w-full items-center justify-center rounded-lg"
        style={{
          backgroundColor: shown.bgColor,
          color: shown.textColor,
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.3)",
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "clamp(18px, 5vw, 36px)",
          fontWeight: 600,
          letterSpacing: "0.02em",
          transformStyle: "preserve-3d",
        }}
      >
        {shown.char}
      </motion.div>

      {/* Split line for split-flap effect */}
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top: "49.5%",
          height: "1px",
          background: "rgba(0,0,0,0.06)",
        }}
      />
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────────────────

type Phase = "init" | "scramble" | "wave" | "reveal" | "done";

// Deterministic initial tiles (same on server and client)
const INITIAL_TILES: TileState[] = Array.from({ length: TOTAL_TILES }, (_, i) => ({
  char: CHARS[i % CHARS.length],
  bgColor: TILE_COLORS[i % TILE_COLORS.length],
  textColor: "#1B1B1B",
}));

const EMPTY_NEXT: TileState[] = Array.from({ length: TOTAL_TILES }, () => ({
  char: "",
  bgColor: "#FFFFFF",
  textColor: "#1B1B1B",
}));

export default function LandingPage() {
  const [tiles, setTiles] = useState<TileState[]>(INITIAL_TILES);
  const [nextTiles, setNextTiles] = useState<TileState[]>(EMPTY_NEXT);
  const [flipping, setFlipping] = useState<boolean[]>(
    Array(TOTAL_TILES).fill(false)
  );
  const [phase, setPhase] = useState<Phase>("init");
  const [showContent, setShowContent] = useState(false);

  const phaseRef = useRef<Phase>("init");
  phaseRef.current = phase;

  // Start scramble after mount (avoids hydration mismatch from Math.random)
  useEffect(() => {
    setPhase("scramble");
  }, []);

  // ─── Phase 1: Scramble (0~2s) ─────────────────────────────────
  // Random colorful tiles flip rapidly
  useEffect(() => {
    if (phase !== "scramble") return;

    let count = 0;
    const maxFlips = 7;

    const interval = setInterval(() => {
      count++;

      const numFlips = Math.floor(Math.random() * 5) + 4; // 4-8 tiles
      const indices: number[] = [];
      while (indices.length < numFlips) {
        const idx = Math.floor(Math.random() * TOTAL_TILES);
        if (!indices.includes(idx)) indices.push(idx);
      }

      // Set next state with random colors
      setNextTiles((prev) => {
        const updated = [...prev];
        indices.forEach((idx) => {
          const bg = randomColor();
          updated[idx] = {
            char: randomChar(),
            bgColor: bg,
            textColor: bg === "#FFFFFF" || bg === "#FAF9F6" || bg === "#E8F5E9" ? "#1B1B1B" : "#FFFFFF",
          };
        });
        return updated;
      });

      // Trigger flips
      setFlipping(() => {
        const updated = Array(TOTAL_TILES).fill(false);
        indices.forEach((idx) => {
          updated[idx] = true;
        });
        return updated;
      });

      // Complete flips
      setTimeout(() => {
        if (phaseRef.current !== "scramble") return;
        setTiles((prev) => {
          const updated = [...prev];
          indices.forEach((idx) => {
            updated[idx] = {
              char: randomChar(),
              bgColor: randomColor(),
              textColor: "#1B1B1B",
            };
            // Fix text color based on bg
            const bg = updated[idx].bgColor;
            if (bg === "#A8D5BA" || bg === "#D4AF37" || bg === "#8EC5A4") {
              updated[idx].textColor = "#FFFFFF";
            }
          });
          return updated;
        });
        setFlipping(Array(TOTAL_TILES).fill(false));
      }, 300);

      if (count >= maxFlips) {
        clearInterval(interval);
        setTimeout(() => setPhase("wave"), 200);
      }
    }, 280);

    return () => clearInterval(interval);
  }, [phase]);

  // ─── Phase 2: Wave (2~4s) ─────────────────────────────────────
  // Tiles flip in wave pattern with wedding symbols
  useEffect(() => {
    if (phase !== "wave") return;

    // Wave: flip tiles sequentially (top-left to bottom-right)
    const waveOrder: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        waveOrder.push(row * COLS + col);
      }
    }

    waveOrder.forEach((idx, i) => {
      const delay = i * 70; // ~70ms between each tile

      setTimeout(() => {
        if (phaseRef.current !== "wave") return;

        const symbol = randomSymbol();
        const colors = ["#A8D5BA", "#E8F5E9", "#D4AF37", "#8EC5A4"];
        const bg = colors[i % colors.length];

        setNextTiles((prev) => {
          const updated = [...prev];
          updated[idx] = {
            char: symbol,
            bgColor: bg,
            textColor: bg === "#E8F5E9" ? "#A8D5BA" : "#FFFFFF",
          };
          return updated;
        });

        setFlipping((prev) => {
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });

        setTimeout(() => {
          if (phaseRef.current !== "wave") return;
          setTiles((prev) => {
            const updated = [...prev];
            updated[idx] = {
              char: symbol,
              bgColor: bg,
              textColor: bg === "#E8F5E9" ? "#A8D5BA" : "#FFFFFF",
            };
            return updated;
          });
          setFlipping((prev) => {
            const updated = [...prev];
            updated[idx] = false;
            return updated;
          });
        }, 300);
      }, delay);
    });

    // Move to reveal after wave completes
    const totalWaveTime = waveOrder.length * 70 + 600;
    const timer = setTimeout(() => setPhase("reveal"), totalWaveTime);
    return () => clearTimeout(timer);
  }, [phase]);

  // ─── Phase 3: Reveal (4~6s) ───────────────────────────────────
  // All tiles flip again; target tiles form "MARIFLO" with mint bg
  useEffect(() => {
    if (phase !== "reveal") return;

    // Flip all tiles in a wave from center outward
    const centerRow = 1;
    const centerCol = 3;

    const tilesByDistance: { idx: number; dist: number }[] = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const dist = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        tilesByDistance.push({ idx, dist });
      }
    }
    tilesByDistance.sort((a, b) => a.dist - b.dist);

    tilesByDistance.forEach(({ idx, dist }) => {
      const delay = dist * 120;

      setTimeout(() => {
        if (phaseRef.current !== "reveal") return;

        const isTarget = TARGET_INDICES.has(idx);

        setNextTiles((prev) => {
          const updated = [...prev];
          if (isTarget) {
            updated[idx] = {
              char: TARGET_MAP[idx],
              bgColor: "#A8D5BA",
              textColor: "#FFFFFF",
            };
          } else {
            updated[idx] = {
              char: randomChar(),
              bgColor: "#FFFFFF",
              textColor: "#E8E4DF",
            };
          }
          return updated;
        });

        setFlipping((prev) => {
          const updated = [...prev];
          updated[idx] = true;
          return updated;
        });

        setTimeout(() => {
          if (phaseRef.current !== "reveal") return;
          setTiles((prev) => {
            const updated = [...prev];
            if (isTarget) {
              updated[idx] = {
                char: TARGET_MAP[idx],
                bgColor: "#A8D5BA",
                textColor: "#FFFFFF",
              };
            } else {
              updated[idx] = {
                char: randomChar(),
                bgColor: "#FFFFFF",
                textColor: "#E8E4DF",
              };
            }
            return updated;
          });
          setFlipping((prev) => {
            const updated = [...prev];
            updated[idx] = false;
            return updated;
          });
        }, 300);
      }, delay);
    });

    // After all revealed, move to done
    const maxDist = ROWS + COLS;
    const totalRevealTime = maxDist * 120 + 500;
    const timer = setTimeout(() => {
      setPhase("done");
      setShowContent(true);
    }, totalRevealTime);
    return () => clearTimeout(timer);
  }, [phase]);

  // ─── Phase 4: Done (6s~) ──────────────────────────────────────
  // Ambient gentle flips on non-target tiles
  useEffect(() => {
    if (phase !== "done") return;

    const available = Array.from({ length: TOTAL_TILES }, (_, i) => i).filter(
      (i) => !TARGET_INDICES.has(i)
    );

    const interval = setInterval(() => {
      const count = Math.floor(Math.random() * 2) + 1;
      const indices: number[] = [];
      const pool = [...available];

      while (indices.length < count && pool.length > 0) {
        const pick = Math.floor(Math.random() * pool.length);
        indices.push(pool[pick]);
        pool.splice(pick, 1);
      }

      setNextTiles((prev) => {
        const updated = [...prev];
        indices.forEach((idx) => {
          updated[idx] = {
            char: randomChar(),
            bgColor: "#FFFFFF",
            textColor: "#E8E4DF",
          };
        });
        return updated;
      });

      setFlipping(() => {
        const updated = Array(TOTAL_TILES).fill(false);
        indices.forEach((idx) => {
          updated[idx] = true;
        });
        return updated;
      });

      setTimeout(() => {
        setTiles((prev) => {
          const updated = [...prev];
          indices.forEach((idx) => {
            updated[idx] = {
              char: randomChar(),
              bgColor: "#FFFFFF",
              textColor: "#E8E4DF",
            };
          });
          return updated;
        });
        setFlipping(Array(TOTAL_TILES).fill(false));
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [phase]);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#FAF9F6]">
      {/* Tile Grid */}
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {tiles.map((tile, i) => (
            <FlipTile
              key={i}
              current={tile}
              next={nextTiles[i]}
              flipping={flipping[i]}
            />
          ))}
        </div>

        {/* Content below the grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="mt-10 flex flex-col items-center gap-5 text-center sm:mt-12"
        >
          <p className="max-w-sm text-base font-light text-[#6B7280] sm:text-lg">
            웨딩 문의 자동 응답부터 팔로업까지,
            <br />
            리드 전환의 모든 흐름을 자동화합니다.
          </p>

          <Link
            href="/signup"
            className="inline-block rounded-full bg-[#1B1B1B] px-10 py-4 text-sm font-medium text-[#FAF9F6] shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:text-base"
          >
            마리플로 시작하기
          </Link>

          <Link
            href="/login"
            className="text-sm text-[#6B7280] transition-colors hover:text-[#1B1B1B]"
          >
            이미 계정이 있으신가요?
          </Link>
        </motion.div>
      </div>

      {/* Bottom tagline */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={showContent ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute bottom-8 text-xs text-[#6B7280]"
      >
        Marry + Flow &mdash; 웨딩 리드 자동화 SaaS
      </motion.footer>
    </main>
  );
}
