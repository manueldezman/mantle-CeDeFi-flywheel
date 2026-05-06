import { useState, useEffect, useRef } from "react";

// Mantle brand colors
const TEAL = "#65B3AE";
const PALE_TEAL = "#008F6A";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const DARK_BG = "#0a0a0a";
const TEAL_DIM = "#1a3a38";

// Mantle sunburst logo SVG
function MantleLogo({ size = 40, color = WHITE }) {
  const spokes = 22;
  const outerR = size / 2;
  const innerR = outerR * 0.28;
  const spokeW = outerR * 0.13;
  const paths = [];
  for (let i = 0; i < spokes; i++) {
    const angle = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 0.55) / spokes) * Math.PI * 2 - Math.PI / 2;
    const x1 = Math.cos(angle) * innerR;
    const y1 = Math.sin(angle) * innerR;
    const x2 = Math.cos(nextAngle) * innerR;
    const y2 = Math.sin(nextAngle) * innerR;
    const x3 = Math.cos((angle + nextAngle) / 2) * outerR * 0.95;
    const y3 = Math.sin((angle + nextAngle) / 2) * outerR * 0.95;
    const x4 = Math.cos(angle) * outerR * 0.82;
    const y4 = Math.sin(angle) * outerR * 0.82;
    paths.push(
      <polygon
        key={i}
        points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`}
        fill={color}
      />
    );
  }
  return (
    <svg width={size} height={size} viewBox={`${-outerR} ${-outerR} ${size} ${size}`}>
      <circle cx={0} cy={0} r={innerR * 0.6} fill={color} />
      {paths}
    </svg>
  );
}

// Nodes arranged in pentagon
const NODES = [
  {
    id: "meth",
    label: "mETH\nProtocol",
    sublabel: "Liquid Staking",
    angle: -90, // top
    color: TEAL,
    description: "Users stake ETH → receive mETH liquid staking token. Earns native staking yield while staying composable across DeFi.",
    stat: "~4.2% APY",
  },
  {
    id: "treasury",
    label: "Mantle\nTreasury",
    sublabel: "DAO Reserve",
    angle: -90 + 72,
    color: TEAL,
    description: "Massive DAO-controlled treasury deploys ETH/mETH across CeFi & DeFi to generate sustainable protocol revenue.",
    stat: "$3B+ AUM",
  },
  {
    id: "cedefi",
    label: "CeDeFi\nProducts",
    sublabel: "Institutional Yield",
    angle: -90 + 144,
    color: TEAL,
    description: "FBTC, COOK and other structured products bridge institutional CeFi liquidity into Mantle's on-chain ecosystem.",
    stat: "FBTC · COOK",
  },
  {
    id: "l2",
    label: "Mantle\nNetwork",
    sublabel: "Layer 2 EVM",
    angle: -90 + 216,
    color: TEAL,
    description: "High-performance Ethereum L2 with low fees. Protocols use mETH as collateral. Transaction fees flow to treasury.",
    stat: "$500M+ TVL",
  },
  {
    id: "grants",
    label: "Ecosystem\nGrants",
    sublabel: "Builder Incentives",
    angle: -90 + 288,
    color: TEAL,
    description: "Treasury funds developer grants & liquidity mining → attracts protocols to Mantle L2 → grows user base & TVL.",
    stat: "Ongoing Rounds",
  },
];

const EDGES = [
  { from: 0, to: 1, label: "staking yield" },
  { from: 1, to: 2, label: "capital deployed" },
  { from: 2, to: 3, label: "TVL & users" },
  { from: 3, to: 4, label: "fee revenue" },
  { from: 4, to: 0, label: "collateral demand" },
];

const R = isMobile ? 110 : 210; // pentagon radius
const CX = isMobile ? 187.5 : 480; // center x
const CY = isMobile ? 300 : 360; // center y

function toRad(deg) { return (deg * Math.PI) / 180; }
function nodePos(angle) {
  return {
    x: CX + R * Math.cos(toRad(angle)),
    y: CY + R * Math.sin(toRad(angle)),
  };
}

// Curved arrow path between two nodes
function arcPath(from, to, curvature = 0.35) {
  const p1 = nodePos(NODES[from].angle);
  const p2 = nodePos(NODES[to].angle);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
}

// Midpoint of quadratic bezier
function bezierMid(from, to, curvature = 0.35) {
  const p1 = nodePos(NODES[from].angle);
  const p2 = nodePos(NODES[to].angle);
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const cx = mx - dy * curvature;
  const cy = my + dx * curvature;
  return {
    x: 0.25 * p1.x + 0.5 * cx + 0.25 * p2.x,
    y: 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y,
  };
}

export default function App() {
  const [activeNode, setActiveNode] = useState(null);
  const [activeEdge, setActiveEdge] = useState(null);
  const [animPhase, setAnimPhase] = useState(0);
  const [pulseEdge, setPulseEdge] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const svgRef = useRef(null);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Animate pulse around the loop
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseEdge((prev) => (prev + 1) % EDGES.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimPhase(1), 100);
    return () => clearTimeout(timeout);
  }, []);

  const NODE_W = isMobile ? 120 : 150;
  const NODE_H = isMobile ? 56 : 68;

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: BLACK,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', 'Courier New', monospace",
        padding: "20px",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Load font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;600;700&family=DM+Sans:wght@300;400;600&display=swap');

        @keyframes dashFlow {
          from { stroke-dashoffset: 40; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px #65B3AE88); }
          50% { filter: drop-shadow(0 0 14px #65B3AEcc); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitPulse {
          0%, 100% { opacity: 0.15; r: 218; }
          50% { opacity: 0.3; r: 222; }
        }
        .node-box {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .node-box:hover rect {
          stroke: #65B3AE !important;
          filter: drop-shadow(0 0 10px #65B3AE66);
        }
        .edge-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          fill: #65B3AE;
          text-anchor: middle;
          pointer-events: none;
        }
        @media (max-width: 768px) {
          .edge-label {
            font-size: 8px;
          }
        }
        .info-panel {
          animation: fadeInUp 0.3s ease forwards;
        }
      `}</style>

      {/* Subtle radial bg glow */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 900, height: 700,
        background: "radial-gradient(ellipse at center, #00281e22 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: isMobile ? 10 : 14,
        marginBottom: isMobile ? 6 : 8, zIndex: 1,
        opacity: animPhase ? 1 : 0,
        transition: "opacity 0.8s ease 0.1s",
      }}>
        <MantleLogo size={isMobile ? 28 : 36} color={WHITE} />
        <div>
          <div style={{ color: WHITE, fontSize: isMobile ? 9 : 11, letterSpacing: "0.25em", fontWeight: 600 }}>
            MANTLE NETWORK
          </div>
          <div style={{ color: TEAL, fontSize: isMobile ? 7 : 9, letterSpacing: "0.15em" }}>
            CEDEFI ECOSYSTEM
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{
        color: WHITE, fontSize: isMobile ? 18 : 22, fontWeight: 700,
        letterSpacing: "0.05em", marginBottom: 2, zIndex: 1,
        opacity: animPhase ? 1 : 0,
        transition: "opacity 0.8s ease 0.2s",
      }}>
        THE CeDeFi FLYWHEEL
      </div>
      <div style={{
        color: "#ffffff55", fontSize: isMobile ? 8 : 10, letterSpacing: "0.18em",
        marginBottom: isMobile ? 12 : 16, zIndex: 1,
        opacity: animPhase ? 1 : 0,
        transition: "opacity 0.8s ease 0.3s",
      }}>
        SELF-REINFORCING YIELD ECOSYSTEM
      </div>

      {/* Main SVG diagram */}
      <div style={{
        position: "relative", zIndex: 1,
        opacity: animPhase ? 1 : 0,
        transition: "opacity 1s ease 0.4s",
        width: "100%",
        maxWidth: isMobile ? "100vw" : "960px",
      }}>
        <svg
          ref={svgRef}
          width="100%"
          height="auto"
          viewBox={isMobile ? "0 0 375 600" : "0 0 960 720"}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: "block" }}
        >
          <defs>
            <marker id="arrowTeal" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={TEAL} />
            </marker>
            <marker id="arrowDim" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="#ffffff22" />
            </marker>
            <filter id="glowTeal">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="glowCenter">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="centerGrad" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#00c48a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#005540" stopOpacity="1" />
            </radialGradient>
            <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#161616" />
              <stop offset="100%" stopColor="#0d0d0d" />
            </linearGradient>
          </defs>

          {/* Orbit ring */}
          <circle
            cx={CX} cy={CY} r={R + 8}
            fill="none"
            stroke={TEAL}
            strokeWidth={0.5}
            strokeDasharray="4 8"
            opacity={0.2}
            style={{ animation: "rotateSlow 30s linear infinite", transformOrigin: `${CX}px ${CY}px` }}
          />

          {/* Spoke lines from center to each node */}
          {NODES.map((node, i) => {
            const pos = nodePos(node.angle);
            return (
              <line
                key={`spoke-${i}`}
                x1={CX} y1={CY}
                x2={pos.x} y2={pos.y}
                stroke="#ffffff"
                strokeWidth={0.5}
                strokeDasharray="3 6"
                opacity={activeNode === i ? 0.4 : 0.1}
                style={{ transition: "opacity 0.3s" }}
              />
            );
          })}

          {/* Curved arrows between nodes */}
          {EDGES.map((edge, i) => {
            const isPulsing = pulseEdge === i;
            const mid = bezierMid(edge.from, edge.to);
            return (
              <g key={`edge-${i}`}>
                {/* Base path */}
                <path
                  d={arcPath(edge.from, edge.to)}
                  fill="none"
                  stroke={isPulsing ? TEAL : "#1e4a46"}
                  strokeWidth={isPulsing ? 2 : 1.5}
                  strokeDasharray={isPulsing ? "none" : "6 4"}
                  markerEnd="url(#arrowTeal)"
                  filter={isPulsing ? "url(#glowTeal)" : "none"}
                  style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
                />
                {/* Animated flow dot on pulsing edge */}
                {isPulsing && (
                  <circle r={4} fill={TEAL} opacity={0.9} filter="url(#glowTeal)">
                    <animateMotion
                      dur="1.2s"
                      repeatCount="1"
                      path={arcPath(edge.from, edge.to)}
                    />
                  </circle>
                )}
                {/* Edge label */}
                <text
                  x={mid.x}
                  y={mid.y - 8}
                  className="edge-label"
                  opacity={isPulsing ? 1 : 0.5}
                  style={{ transition: "opacity 0.3s" }}
                >
                  {edge.label}
                </text>
              </g>
            );
          })}

          {/* Center node */}
          <g style={{ cursor: "default" }} filter="url(#glowCenter)">
            <rect
              x={CX - (isMobile ? 56 : 76)} y={CY - (isMobile ? 32 : 44)}
              width={isMobile ? 112 : 152} height={isMobile ? 64 : 88}
              rx={isMobile ? 6 : 8}
              fill="url(#centerGrad)"
              stroke={TEAL}
              strokeWidth={isMobile ? 1 : 1.5}
            />
            <text
              x={CX} y={CY - (isMobile ? 8 : 12)}
              textAnchor="middle"
              fill={WHITE}
              fontSize={isMobile ? 14 : 18}
              fontWeight={700}
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="1"
            >
              CeDeFi
            </text>
            <text
              x={CX} y={CY + (isMobile ? 8 : 10)}
              textAnchor="middle"
              fill={WHITE}
              fontSize={isMobile ? 14 : 18}
              fontWeight={700}
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing="1"
            >
              FLYWHEEL
            </text>
            <text
              x={CX} y={CY + (isMobile ? 22 : 30)}
              textAnchor="middle"
              fill="#ffffff88"
              fontSize={isMobile ? 7 : 9}
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing={isMobile ? 1.5 : 2}
            >
              ♾ SELF-REINFORCING
            </text>
          </g>

          {/* Node boxes */}
          {NODES.map((node, i) => {
            const pos = nodePos(node.angle);
            const isActive = activeNode === i;
            return (
              <g
                key={node.id}
                className="node-box"
                transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
                onClick={() => setActiveNode(isActive ? null : i)}
                style={{ opacity: animPhase ? 1 : 0, transition: `opacity 0.6s ease ${0.3 + i * 0.1}s` }}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill="url(#nodeGrad)"
                  stroke={isActive ? TEAL : "#2a2a2a"}
                  strokeWidth={isActive ? 1.5 : 1}
                  filter={isActive ? "url(#glowTeal)" : "none"}
                  style={{ transition: "stroke 0.3s" }}
                />
                {/* Teal top accent bar */}
                <rect
                  width={NODE_W}
                  height={2}
                  rx={1}
                  fill={isActive ? TEAL : "#1e4a46"}
                  style={{ transition: "fill 0.3s" }}
                />
                {/* Label lines */}
                {node.label.split("\n").map((line, li) => (
                  <text
                    key={li}
                    x={NODE_W / 2}
                    y={isMobile ? 18 + li * 14 : 22 + li * 18}
                    textAnchor="middle"
                    fill={WHITE}
                    fontSize={isMobile ? 11 : 13}
                    fontWeight={600}
                    fontFamily="'JetBrains Mono', monospace"
                    letterSpacing="0.5"
                  >
                    {line}
                  </text>
                ))}
                {/* Sublabel */}
                <text
                  x={NODE_W / 2}
                  y={NODE_H - (isMobile ? 8 : 10)}
                  textAnchor="middle"
                  fill={TEAL}
                  fontSize={isMobile ? 7 : 8.5}
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing={isMobile ? 1 : 1.5}
                  opacity={0.85}
                >
                  {node.sublabel.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Stat badge on each node */}
          {NODES.map((node, i) => {
            const pos = nodePos(node.angle);
            const isActive = activeNode === i;
            if (!isActive) return null;
            return (
              <text
                key={`stat-${i}`}
                x={pos.x}
                y={pos.y + NODE_H / 2 + (isMobile ? 14 : 18)}
                textAnchor="middle"
                fill={TEAL}
                fontSize={isMobile ? 8 : 10}
                fontWeight={600}
                fontFamily="'JetBrains Mono', monospace"
                opacity={0.9}
              >
                ▲ {node.stat}
              </text>
            );
          })}

          {/* Bottom caption */}
          <text
            x={CX} y={isMobile ? 570 : 690}
            textAnchor="middle"
            fill="#ffffffd8"
            fontSize={isMobile ? 10 : 15}
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing={isMobile ? 2 : 3}
          >
            {isMobile ? "YIELD · ON-CHAIN · TO STAKER" : "LATEST YIELD · COMPOUNDED ON-CHAIN · BACK TO THE STAKER"}
          </text>

        </svg>
      </div>

      {/* Info panel */}
      {activeNode !== null && (
        <div
          className="info-panel"
          style={{
            position: "fixed",
            bottom: isMobile ? 20 : 30,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#0d0d0d",
            border: `1px solid ${TEAL}`,
            borderTop: `3px solid ${TEAL}`,
            padding: isMobile ? "12px 20px" : "16px 28px",
            maxWidth: isMobile ? "95vw" : 480,
            width: "90vw",
            zIndex: 10,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ color: WHITE, fontSize: isMobile ? 12 : 13, fontWeight: 700, letterSpacing: "0.05em", fontFamily: "'JetBrains Mono', monospace" }}>
              {NODES[activeNode].label.replace("\n", " ")}
            </div>
            <div style={{ color: TEAL, fontSize: isMobile ? 10 : 11, fontFamily: "'JetBrains Mono', monospace" }}>
              {NODES[activeNode].stat}
            </div>
          </div>
          <div style={{ color: "#ffffffaa", fontSize: isMobile ? 11 : 12, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
            {NODES[activeNode].description}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 30, height: 1, background: TEAL, opacity: 0.5 }} />
            <div style={{ color: "#ffffff33", fontSize: isMobile ? 8 : 9, letterSpacing: "0.2em", fontFamily: "'JetBrains Mono', monospace" }}>
              CLICK NODE TO DISMISS
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        display: "flex", gap: isMobile ? 16 : 24, marginTop: 8, zIndex: 1,
        opacity: animPhase ? 1 : 0,
        transition: "opacity 0.8s ease 0.8s",
        flexWrap: isMobile ? "wrap" : "nowrap",
        justifyContent: "center",
      }}>
        {[
          { color: TEAL, label: "value flow" },
          { color: "#2a2a2a", label: "node", border: "#2a2a2a" },
          { color: "transparent", label: "click node for details", border: "#ffffff33" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: i === 0 ? (isMobile ? 16 : 20) : (isMobile ? 8 : 10),
              height: i === 0 ? 2 : (isMobile ? 8 : 10),
              background: item.color,
              border: item.border ? `1px solid ${item.border}` : "none",
            }} />
            <span style={{ color: "#ffffffd2", fontSize: isMobile ? 10 : 12, letterSpacing: "0.15em", fontFamily: "'JetBrains Mono', monospace" }}>
              {item.label.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
