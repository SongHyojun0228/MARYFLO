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
    <main className="flex min-h-dvh flex-col overflow-hidden bg-[#FAF9F6]">
      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center px-4">
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

          {/* Tagline + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={showContent ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" as const }}
            className="mt-10 flex flex-col items-center gap-6 text-center sm:mt-12"
          >
            <h1
              className="text-2xl font-medium tracking-wide text-[#1B1B1B] sm:text-3xl"
              style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
            >
              문의가 결혼이 되는 곳
            </h1>

            <p className="max-w-md text-base font-light leading-relaxed text-[#6B7280] sm:text-lg">
              3초 안에 자동 응답. 놓치는 문의 없이.
              <br />
              웨딩 업체의 보이지 않는 플래너.
            </p>

            <Link
              href="/signup"
              className="inline-block rounded-full px-10 py-4 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:text-base"
              style={{ backgroundColor: "#D4AF37" }}
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

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="absolute bottom-8 flex flex-col items-center gap-2 text-[#6B7280]"
        >
          <span className="text-xs">스크롤하여 더 알아보기</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-lg"
          >
            &#8595;
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Pain Point: 토요일 오후의 놓친 DM ─────────────────────── */}
      <section className="flex items-center justify-center px-6 py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="max-w-2xl text-center"
        >
          <h2
            className="mb-8 text-xl font-medium text-[#1B1B1B] sm:text-2xl"
            style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
          >
            토요일 오후, 예식이 한창인데
            <br />
            인스타 DM이 3개 들어왔습니다.
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[#6B7280] sm:text-base">
            <p>
              플래너는 신부 케어 중이고, 사장님은 하객 응대 중이에요.
              <br />
              그 DM은 월요일에야 확인됩니다.
            </p>
            <p>
              근데 그 신부님은 이미 일요일에 다른 곳과 계약했어요.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 rounded-xl border border-[#E8F5E9] bg-white p-6 text-left shadow-sm sm:p-8"
          >
            <p className="text-sm leading-relaxed text-[#1B1B1B] sm:text-base">
              마리플로가 있었다면, 그 3개 DM에
              <strong className="text-[#A8D5BA]"> 3초 안에 </strong>
              자동 응답이 나갔을 거예요.
            </p>
            <p className="mt-4 rounded-lg bg-[#FAF9F6] p-4 text-sm italic text-[#6B7280]">
              &ldquo;안녕하세요! 문의 감사합니다. 담당 플래너가 오늘 중 연락드릴게요.&rdquo;
            </p>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8 text-lg font-medium text-[#1B1B1B] sm:text-xl"
            style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
          >
            그 3초가, 계약 하나의 차이입니다.
          </motion.p>
        </motion.div>
      </section>

      {/* ─── 3 Value Props ────────────────────────────────────────── */}
      <section className="bg-white px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-4xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center text-xl font-medium text-[#1B1B1B] sm:text-2xl"
            style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
          >
            마리플로가 하는 일
          </motion.h2>

          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6">
            {[
              {
                title: "3초의 차이",
                desc: "문의가 들어오면 3초 안에 응답합니다. 30분 이내 응답한 업체와 계약할 확률이 3배 높습니다.",
                accent: "#A8D5BA",
              },
              {
                title: "놓치는 문의, 제로",
                desc: "인스타 DM, 카톡, 네이버 폼, 전화 — 어디서 들어오든 하나도 안 빠지고 대시보드에 잡힙니다.",
                accent: "#D4AF37",
              },
              {
                title: "상담에만 집중하세요",
                desc: "첫 응답, 팔로업, 리포트는 마리플로가 하고, 플래너는 공감과 클로징에 집중합니다.",
                accent: "#A8D5BA",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="rounded-xl border border-[#F0F0EC] bg-[#FAF9F6] p-6 sm:p-8"
              >
                <div
                  className="mb-4 h-1 w-10 rounded-full"
                  style={{ backgroundColor: item.accent }}
                />
                <h3
                  className="mb-3 text-lg font-semibold text-[#1B1B1B]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#6B7280]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison: 플래너 채용 vs 마리플로 ──────────────────── */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-12 text-center text-xl font-medium text-[#1B1B1B] sm:text-2xl"
            style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
          >
            플래너 한 명 더 뽑으면 월 250만원.
            <br />
            마리플로는 그 역할을 대신합니다.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Left: 기존 방식 */}
            <div className="rounded-xl border border-[#E8E4DF] bg-white p-6 text-center">
              <p className="mb-2 text-sm text-[#6B7280]">플래너 추가 채용</p>
              <p className="text-2xl font-semibold text-[#1B1B1B] sm:text-3xl">
                월 250만원
              </p>
              <div className="mt-4 space-y-2 text-left text-xs text-[#6B7280] sm:text-sm">
                <p>퇴근 후 응답 불가</p>
                <p>주말 예식 중 응답 불가</p>
                <p>퇴사 시 인수인계 필요</p>
              </div>
            </div>

            {/* Right: 마리플로 */}
            <div className="rounded-xl border-2 border-[#A8D5BA] bg-[#E8F5E9]/30 p-6 text-center">
              <p className="mb-2 text-sm font-medium text-[#A8D5BA]">MARIFLO</p>
              <p
                className="text-2xl font-semibold sm:text-3xl"
                style={{ color: "#D4AF37" }}
              >
                월 30만원
              </p>
              <div className="mt-4 space-y-2 text-left text-xs text-[#1B1B1B] sm:text-sm">
                <p>24시간 자동 응답</p>
                <p>모든 채널 문의 수집</p>
                <p>자동 팔로업 + 리포트</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center bg-white px-6 py-24 text-center sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            className="text-2xl font-medium text-[#1B1B1B] sm:text-3xl"
            style={{ fontFamily: "'Playfair Display', 'Pretendard Variable', Pretendard, sans-serif" }}
          >
            문의가 결혼이 되는 곳
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-[#6B7280] sm:text-base">
            첫 달 무료로 써보시고, 효과 없으면 바로 해지하세요.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-full px-10 py-4 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl sm:text-base"
            style={{ backgroundColor: "#D4AF37" }}
          >
            마리플로 시작하기
          </Link>
        </motion.div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────── */}
      <footer className="flex items-center justify-center bg-[#FAF9F6] py-8">
        <p className="text-xs text-[#6B7280]">
          &copy; 2026 MARIFLO &mdash; 문의가 결혼이 되는 곳
        </p>
      </footer>
    </main>
  );
}
