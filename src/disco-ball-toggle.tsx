"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

/* ------------------------------------------------------------------ */
/* Toggle button                                                       */
/* ------------------------------------------------------------------ */

export function DiscoBallToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const active = mounted && resolvedTheme === "dark"
  // While the ball is being hoisted back up we stay dark; the theme flips
  // to light once it has left the screen.
  const [retracting, setRetracting] = useState(false)

  const handleClick = () => {
    if (retracting) return
    if (active) {
      setRetracting(true)
    } else {
      setTheme("dark")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? "Turn the lights back on" : "Drop the disco ball"}
        aria-pressed={active}
        aria-busy={retracting || undefined}
        className={`relative flex h-10 w-10 items-center justify-center rounded-2xl border bg-card text-foreground transition-[box-shadow,color,background-color] duration-500 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          active
            ? "shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_28px_rgba(255,214,150,0.45)]"
            : ""
        }`}
      >
        <DiscoBallIcon active={active} />
      </button>

      <AnimatePresence>
        {active ? (
          <DiscoScene
            key="disco"
            retracting={retracting}
            onRetracted={() => {
              setTheme("light")
              setRetracting(false)
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  )
}

export function DiscoBallIcon({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? "drop-shadow-[0_0_6px_rgba(255,220,170,0.8)]" : ""}
    >
      {/* hook */}
      <path d="M12 1.5v3" />
      <path d="M10.5 4.5h3" />
      {/* ball */}
      <circle cx="12" cy="13.5" r="8" />
      {/* latitudes */}
      <path d="M4.6 10.5h14.8" />
      <path d="M4 13.5h16" />
      <path d="M4.6 16.5h14.8" />
      {/* meridians */}
      <path d="M12 5.5c-3.2 0-5.5 3.6-5.5 8s2.3 8 5.5 8" />
      <path d="M12 5.5c3.2 0 5.5 3.6 5.5 8s-2.3 8-5.5 8" />
      <path d="M12 5.5v16" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Scene: string, ball, beams, sparkles                                */
/* ------------------------------------------------------------------ */

const BEAM_COLORS = [
  "rgba(255, 79, 216, 0.75)", // pink
  "rgba(79, 163, 255, 0.7)", // blue
  "rgba(255, 169, 71, 0.7)", // gold
  "rgba(95, 224, 138, 0.65)", // green
  "rgba(176, 108, 255, 0.7)", // violet
]

const SPARKLE_COLORS = [
  "#ff6ad5",
  "#5fb8ff",
  "#ffc26b",
  "#7ef2a3",
  "#c99bff",
  "#ffffff",
]

/** Deterministic pseudo-random so the sparkle field is stable across renders. */
function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function DiscoScene({
  retracting,
  onRetracted,
}: {
  retracting: boolean
  onRetracted: () => void
}) {
  const reduceMotion = useReducedMotion()
  const [landed, setLanded] = useState(!!reduceMotion)
  const lightsOn = landed && !retracting

  const sparkles = useMemo(() => {
    const rand = seeded(20260902)
    return Array.from({ length: 56 }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: 8 + rand() * 90,
      size: 2 + rand() * 4,
      color: SPARKLE_COLORS[Math.floor(rand() * SPARKLE_COLORS.length)],
      delay: rand() * 4,
      duration: 2.4 + rand() * 3,
    }))
  }, [])

  const dropTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 42, damping: 11, mass: 1.4 }
  // Hoisted back up: slow start, then steady, like a winch taking up slack.
  const riseTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 1.9, ease: [0.5, 0, 0.7, 0.35] as const, delay: 0.35 }

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      transition={{ duration: 0.6 }}
    >
      {/* Room going dark: soft vignette so the ball reads as the light source */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 30%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.28) 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />

      {/* Light beams: two conic layers rotating opposite directions */}
      <motion.div
        className="absolute inset-0"
        style={{
          maskImage: [
            "radial-gradient(circle at 50% var(--disco-y), transparent 0, transparent var(--disco-r), black calc(var(--disco-r) + 60px))",
            "linear-gradient(to bottom, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) calc(var(--disco-y) - 160px), black calc(var(--disco-y) + 40px))",
          ].join(", "),
          maskComposite: "intersect",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: lightsOn ? 1 : 0 }}
        transition={
          retracting
            ? { duration: 0.5, ease: "easeIn" }
            : { duration: 1.4, ease: "easeOut" }
        }
      >
        <BeamLayer
          colors={BEAM_COLORS}
          duration={reduceMotion ? 0 : 46}
          direction="normal"
          spread={1.5}
          softness={6}
        />
        <BeamLayer
          colors={[...BEAM_COLORS].reverse()}
          duration={reduceMotion ? 0 : 70}
          direction="reverse"
          spread={3}
          softness={12}
          opacity={0.55}
        />
      </motion.div>

      {/* Sparkle field: reflected specks on the walls */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: lightsOn ? 1 : 0 }}
        transition={
          retracting ? { duration: 0.4 } : { duration: 1.6, delay: 0.2 }
        }
      >
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="disco-sparkle absolute rounded-full"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.size * 2.5}px ${s.color}`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              animationPlayState: reduceMotion ? "paused" : undefined,
            }}
          />
        ))}
      </motion.div>

      {/* String + ball, dropping in from above the viewport */}
      <motion.div
        className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center"
        style={{ height: "calc(var(--disco-y) + var(--disco-r))" }}
        initial={{ y: "-100%" }}
        animate={{ y: retracting ? "-100%" : "0%" }}
        transition={retracting ? riseTransition : dropTransition}
        onAnimationComplete={(definition) => {
          const target = (definition as { y?: string }).y
          if (target === "0%") setLanded(true)
          if (target === "-100%") onRetracted()
        }}
      >
        <div
          className="w-px flex-1"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.7))",
            boxShadow: "0 0 2px rgba(255,255,255,0.35)",
          }}
        />
        {/* cap / fitting */}
        <div
          className="h-3 w-3 rounded-[3px]"
          style={{
            background: "linear-gradient(to bottom, #6d6d76, #2b2b31)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.6)",
            marginBottom: -2,
          }}
        />
        <DiscoBallCanvas spinning={landed && !reduceMotion} />
      </motion.div>
    </motion.div>
  )
}

function BeamLayer({
  colors,
  duration,
  direction,
  spread,
  softness,
  opacity = 1,
}: {
  colors: string[]
  duration: number
  direction: "normal" | "reverse"
  /** Half-width of each beam in degrees. */
  spread: number
  /** Extra degrees of feathering on each edge. */
  softness: number
  opacity?: number
}) {
  const step = 360 / colors.length
  const stops = colors
    .map((c, i) => {
      const center = i * step + step / 2
      return `transparent ${center - spread - softness}deg, ${c} ${center - spread}deg, ${c} ${center + spread}deg, transparent ${center + spread + softness}deg`
    })
    .join(", ")

  return (
    <div
      className="disco-beams absolute left-1/2"
      style={{
        top: "var(--disco-y)",
        width: "170vmax",
        height: "170vmax",
        marginLeft: "-85vmax",
        marginTop: "-85vmax",
        // Radial layer fades the beams with distance; black is neutral under screen blend.
        background: `radial-gradient(circle, transparent 0, rgba(0,0,0,0.35) 34vmax, black 78vmax), conic-gradient(from 0deg, ${stops})`,
        mixBlendMode: "screen",
        opacity,
        animationDuration: duration ? `${duration}s` : undefined,
        animationDirection: direction,
        animationPlayState: duration ? undefined : "paused",
      }}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Canvas mirror ball                                                  */
/* ------------------------------------------------------------------ */

const ROWS = 18 // latitude bands
const COLS = 36 // longitude bands
const SPIN_SECONDS = 14 // one full revolution

function hash(i: number, j: number) {
  let h = (i * 374761393 + j * 668265263) >>> 0
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

function DiscoBallCanvas({ spinning }: { spinning: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const spinningRef = useRef(spinning)
  spinningRef.current = spinning

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let raf = 0
    let last = performance.now()
    let rot = 0
    let size = 0
    let dpr = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      size = rect.width
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(size * dpr)
      canvas.height = Math.round(size * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      if (spinningRef.current) {
        rot = (rot + (dt / SPIN_SECONDS) * Math.PI * 2) % (Math.PI * 2)
      }
      const t = now / 1000

      const R = (size / 2) * 0.96
      const cx = size / 2
      const cy = size / 2

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, size, size)

      // Light from upper-left-front, viewer along +z
      const L = normalize([-0.55, 0.7, 0.75])
      const H = normalize([L[0], L[1], L[2] + 1])

      const dTheta = Math.PI / ROWS
      const dPhi = (Math.PI * 2) / COLS

      ctx.lineJoin = "round"

      for (let i = 0; i < ROWS; i++) {
        const theta0 = -Math.PI / 2 + i * dTheta
        const theta1 = theta0 + dTheta
        const thetaC = (theta0 + theta1) / 2
        for (let j = 0; j < COLS; j++) {
          const phi0 = j * dPhi + rot
          const phi1 = phi0 + dPhi
          const phiC = (phi0 + phi1) / 2

          // facet normal (z toward viewer)
          const nx = Math.cos(thetaC) * Math.sin(phiC)
          const ny = Math.sin(thetaC)
          const nz = Math.cos(thetaC) * Math.cos(phiC)
          if (nz <= 0.02) continue

          const p = [
            project(theta0, phi0, R, cx, cy),
            project(theta0, phi1, R, cx, cy),
            project(theta1, phi1, R, cx, cy),
            project(theta1, phi0, R, cx, cy),
          ]

          const diffuse = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])
          const specDot = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2])
          const spec = Math.pow(specDot, 28)

          const r = hash(i, j)
          // glitter: a facet flashes when its phase lines up with the spin
          const flash = Math.pow(
            Math.max(0, Math.sin(t * 2.2 + r * 40 + phiC * 3)),
            18,
          )

          let light = 0.22 + diffuse * 0.5 + spec * 0.9 + (r - 0.5) * 0.14
          light = Math.min(1, light + flash * 0.9)

          let fill: string
          if (flash > 0.35 && r > 0.55) {
            // colored reflection
            const hue = [318, 205, 42, 140, 268][Math.floor(r * 5) % 5]
            fill = `hsl(${hue} 90% ${70 + flash * 25}%)`
          } else {
            const l = Math.round(light * 92)
            fill = `hsl(222 10% ${l}%)`
          }

          ctx.beginPath()
          ctx.moveTo(p[0][0], p[0][1])
          ctx.lineTo(p[1][0], p[1][1])
          ctx.lineTo(p[2][0], p[2][1])
          ctx.lineTo(p[3][0], p[3][1])
          ctx.closePath()
          ctx.fillStyle = fill
          ctx.fill()
          ctx.lineWidth = 0.7
          ctx.strokeStyle = "rgba(10, 10, 16, 0.55)"
          ctx.stroke()
        }
      }

      // sphere shading: rim darkening
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.clip()

      const rim = ctx.createRadialGradient(
        cx - R * 0.3,
        cy - R * 0.35,
        R * 0.2,
        cx,
        cy,
        R,
      )
      rim.addColorStop(0, "rgba(0,0,0,0)")
      rim.addColorStop(0.75, "rgba(0,0,0,0.12)")
      rim.addColorStop(1, "rgba(0,0,0,0.6)")
      ctx.fillStyle = rim
      ctx.fillRect(0, 0, size, size)

      // soft specular bloom
      const bloom = ctx.createRadialGradient(
        cx - R * 0.38,
        cy - R * 0.4,
        0,
        cx - R * 0.38,
        cy - R * 0.4,
        R * 0.55,
      )
      bloom.addColorStop(0, "rgba(255,255,255,0.55)")
      bloom.addColorStop(0.5, "rgba(255,255,255,0.12)")
      bloom.addColorStop(1, "rgba(255,255,255,0)")
      ctx.globalCompositeOperation = "screen"
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, size, size)
      ctx.restore()

      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="block"
      style={{
        width: "calc(var(--disco-r) * 2)",
        height: "calc(var(--disco-r) * 2)",
        filter:
          "drop-shadow(0 0 18px rgba(255,255,255,0.35)) drop-shadow(0 18px 30px rgba(0,0,0,0.6))",
      }}
    />
  )
}

function project(
  theta: number,
  phi: number,
  R: number,
  cx: number,
  cy: number,
): [number, number] {
  return [cx + R * Math.cos(theta) * Math.sin(phi), cy - R * Math.sin(theta)]
}

function normalize(v: number[]) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}
