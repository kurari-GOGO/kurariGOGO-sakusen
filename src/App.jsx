
import React, { useRef, useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import { Stage, Layer, Rect, Circle, Text, Arrow, Line, Image as KonvaImage, Group } from "react-konva";

const Grid = ({ width, height, size = 40 }) => {
  const lines = [];
  for (let i = 0; i < width / size; i++) {
    lines.push(
      <Line key={`v${i}`} points={[i * size, 0, i * size, height]} stroke="#2a2a2a" strokeWidth={1} />
    );
  }
  for (let j = 0; j < height / size; j++) {
    lines.push(
      <Line key={`h${j}`} points={[0, j * size, width, j * size]} stroke="#2a2a2a" strokeWidth={1} />
    );
  }
  return <Group opacity={0.35}>{lines}</Group>;
};

const ToolButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: "6px 10px",
      borderRadius: 12,
      border: "1px solid #555",
      marginRight: 8,
      marginBottom: 8,
      background: active ? "#fff" : "transparent",
      color: active ? "#000" : "#fff",
      cursor: "pointer"
    }}
  >
    {children}
  </button>
);

const defaultPalette = [
  { label: "タンク",        color: "#ff6b6b" },
  { label: "近接DPS",      color: "#feca57" },
  { label: "キャスターDPS", color: "#5f27cd" },
  { label: "ピュアヒーラー", color: "#48dbfb" },
  { label: "バリアヒーラー", color: "#1dd1a1" },
  { label: "BOSS",          color: "#ffffff" },
  { label: "雑魚",          color: "#c0c0c0" },
];

const modes = {
  SELECT: "SELECT",
  ARROW: "ARROW",
  PEN: "PEN",
  RULER: "RULER",
  PING: "PING",
  CIRCLE: "CIRCLE",
};

export default function App() {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 1100, height: 680 });
  const [tokens, setTokens] = useState([]);
  const [shapes, setShapes] = useState([]);
  const [mode, setMode] = useState(modes.SELECT);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const [ruler, setRuler] = useState(null);
  const [bgUrl, setBgUrl] = useState("");
  const [bgImage, setBgImage] = useState(null);
  const [circleStart, setCircleStart] = useState(null); // 円AoEの中心
  useEffect(() => {
    const onResize = () => {
      const w = Math.min(window.innerWidth - 360, 1400);
      const h = Math.min(window.innerHeight - 120, 900);
      setStageSize({ width: Math.max(800, w), height: Math.max(520, h) });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!bgUrl) return setBgImage(null);
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setBgImage(img);
    img.onerror = () => alert("背景画像の読み込みに失敗しました");
    img.src = bgUrl;
  }, [bgUrl]);

  const addToken = (label, color) => {
    setTokens((t) => [
      ...t,
      { id: uuid(), x: stageSize.width / 2 + Math.random() * 40 - 20, y: stageSize.height / 2 + Math.random() * 40 - 20, label, color, aura: 0, locked: false }
    ]);
  };

  const toggleAura = (id) => {
    setTokens((t) => t.map((tk) => (tk.id === id ? { ...tk, aura: tk.aura === 0 ? 100 : tk.aura === 100 ? 150 : 0 } : tk)));
  };

  const onWheel = (e, id) => {
    e.evt.preventDefault();
    const delta = e.evt.deltaY > 0 ? -5 : 5;
    setTokens((t) => t.map((tk) => (tk.id === id ? { ...tk, aura: Math.max(0, tk.aura + delta) } : tk)));
  };

  const exportPNG = () => {
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const a = document.createElement("a");
    a.download = `raid-whiteboard-${Date.now()}.png`;
    a.href = uri;
    a.click();
  };

  const clearBoard = () => {
    if (!confirm("盤面をクリアします。よろしいですか？")) return;
    setTokens([]);
    setShapes([]);
    setRuler(null);
  };

  const handleStageMouseDown = (e) => {
    const pos = e.target.getStage().getPointerPosition();

    if (mode === modes.PEN) {
      setIsDrawing(true);
      const newLine = { id: uuid(), type: "line", points: [pos.x, pos.y], tension: 0.4 };
      setCurrentLine(newLine);
      setShapes((s) => [...s, newLine]);
    } else if (mode === modes.ARROW) {
      setArrowStart(pos);
    } else if (mode === modes.RULER) {
      setRuler({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    } else if (mode === modes.PING) {
      const id = uuid();
      setShapes((s) => [...s, { id, type: "ping", x: pos.x, y: pos.y, created: Date.now() }]);
      setTimeout(() => setShapes((s) => s.filter((it) => it.id !== id)), 900);
    } else if (mode === modes.CIRCLE) {
    setCircleStart(pos);
    // その場でプレビューを置く
    setShapes((s) => [...s, { id: "circle-preview", type: "circle-preview", x: pos.x, y: pos.y, r: 0 }]);
    }
  };

  const handleStageMouseMove = (e) => {
    const pos = e.target.getStage().getPointerPosition();
    if (mode === modes.PEN && isDrawing) {
      setShapes((s) => s.map((it) => (it.id === currentLine.id ? { ...it, points: [...it.points, pos.x, pos.y] } : it)));
    }
    if (mode === modes.ARROW && arrowStart) {
      setShapes((s) => {
        const existing = s.find((it) => it.type === "arrow-preview");
        const rest = s.filter((it) => it.type !== "arrow-preview");
        return [...rest, { id: "preview", type: "arrow-preview", points: [arrowStart.x, arrowStart.y, pos.x, pos.y] }];
      });
    }
    if (mode === modes.RULER && ruler) {
      setRuler({ ...ruler, x2: pos.x, y2: pos.y });
  if (mode === modes.CIRCLE && circleStart) {
    const r = Math.hypot(pos.x - circleStart.x, pos.y - circleStart.y);
    setShapes((s) =>
      s.map((it) => (it.type === "circle-preview" ? { ...it, r } : it))
    );
  }
    }
  };

  const handleStageMouseUp = (e) => {
    if (mode === modes.PEN) {
      setIsDrawing(false);
      setCurrentLine(null);
    }
    if (mode === modes.ARROW && arrowStart) {
      const pos = e.target.getStage().getPointerPosition();
      setShapes((s) => [
        ...s.filter((it) => it.type !== "arrow-preview"),
        { id: uuid(), type: "arrow", points: [arrowStart.x, arrowStart.y, pos.x, pos.y] }
      ]);
      setArrowStart(null);
    }
    if (mode === modes.RULER && ruler) {
      setTimeout(() => setRuler(null), 1200);
  if (mode === modes.CIRCLE && circleStart) {
    const pos = e.target.getStage().getPointerPosition();
    const r = Math.hypot(pos.x - circleStart.x, pos.y - circleStart.y);
    setShapes((s) => [
      ...s.filter((it) => it.type !== "circle-preview"),
      { id: uuid(), type: "circle", x: circleStart.x, y: circleStart.y, r }
    ]);
    setCircleStart(null);
  }
    }
  };

  const distance = (x1, y1, x2, y2) => Math.round(Math.hypot(x2 - x1, y2 - y1));

  return (
    <div style={{ background: "#0b0b0f", color: "#fff", fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 16 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ width: 300, flexShrink: 0 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Raid Strat Whiteboard</h1>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Mode</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                <ToolButton active={mode === modes.SELECT} onClick={() => setMode(modes.SELECT)}>選択</ToolButton>
                <ToolButton active={mode === modes.ARROW} onClick={() => setMode(modes.ARROW)}>矢印</ToolButton>
                <ToolButton active={mode === modes.PEN} onClick={() => setMode(modes.PEN)}>ペン</ToolButton>
                <ToolButton active={mode === modes.RULER} onClick={() => setMode(modes.RULER)}>定規</ToolButton>
                <ToolButton active={mode === modes.PING} onClick={() => setMode(modes.PING)}>ピン</ToolButton>
                <ToolButton active={mode === modes.CIRCLE} onClick={() => setMode(modes.CIRCLE)}>円AoE</ToolButton>
              </div>
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>・トークン上でホイール：範囲半径変更 / クリック：半径トグル</p>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Palette</div>
              <div style={{ display: "flex", flexWrap: "wrap" }}>
                {defaultPalette.map((p) => (
                  <button key={p.label} onClick={() => addToken(p.label, p.color)}
                    style={{ marginRight: 8, marginBottom: 8, padding: "6px 10px", borderRadius: 12, border: "1px solid #555", background: p.color, color: "#0b0b0f", fontWeight: 700, cursor:"pointer" }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>背景URL</div>
              <input value={bgUrl} onChange={(e) => setBgUrl(e.target.value)} placeholder="画像URLを貼り付け"
                     style={{ width: "100%", padding: "8px 12px", borderRadius: 10, background: "transparent", border: "1px solid #555", color:"#fff" }} />
              <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>（例：フィールドマップの画像）</p>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap" }}>
              <button onClick={exportPNG} style={{ padding: "8px 12px", borderRadius: 12, background: "#fff", color: "#000", marginRight: 8, marginBottom: 8, cursor:"pointer" }}>PNGを書き出し</button>
              <button onClick={clearBoard} style={{ padding: "8px 12px", borderRadius: 12, border: "1px solid #555", background:"transparent", color:"#fff", cursor:"pointer" }}>クリア</button>
            </div>

            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 24, lineHeight: 1.6 }}>
              <p>・ドラッグでユニット移動。<br/>・クリックで範囲リングを表示/切替。<br/>・矢印モード：ドラッグで動線。<br/>・ペン：フリーハンド書き込み。<br/>・定規：距離表示（自動消去）。<br/>・ピン：一時的な強調。</p>
            </div>
          </div>

          <div style={{ flex: 1, borderRadius: 16, overflow: "hidden", border: "1px solid #222", boxShadow: "0 0 0 1px #111" }}>
            <Stage
              width={stageSize.width}
              height={stageSize.height}
              ref={stageRef}
              onMouseDown={handleStageMouseDown}
              onMousemove={handleStageMouseMove}
              onMouseup={handleStageMouseUp}
              style={{ background: "#111318" }}
            >
              <Layer>
                <Rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="#111318" />
                {bgImage && (
                  <KonvaImage image={bgImage} x={0} y={0} width={stageSize.width} height={stageSize.height} opacity={0.9} />
                )}
                <Grid width={stageSize.width} height={stageSize.height} size={40} />

                {shapes.map((s) => {
                  if (s.type === "line") return <Line key={s.id} points={s.points} stroke="#ffffff" strokeWidth={2} lineCap="round" lineJoin="round" tension={s.tension || 0} />;
                  if (s.type === "arrow" || s.type === "arrow-preview") return <Arrow key={s.id} points={s.points} stroke="#ffffff" fill="#ffffff" pointerWidth={10} pointerLength={10} strokeWidth={2} opacity={s.type === "arrow-preview" ? 0.5 : 1} />;
                  if (s.type === "ping") return <Circle key={s.id} x={s.x} y={s.y} radius={20} stroke="#ffd166" strokeWidth={4} opacity={0.8} />;
if (s.type === "circle" || s.type === "circle-preview") {
    return (
      <Circle
        key={s.id}
        x={s.x}
        y={s.y}
        radius={s.r}
        stroke="#ffffff"
        strokeWidth={2}
        dash={s.type === "circle-preview" ? [6, 6] : undefined}
        opacity={s.type === "circle-preview" ? 0.6 : 1}
      />
    );
  }
                  return null;
                })}

                {tokens.map((t) => (
                  <Group key={t.id} x={t.x} y={t.y} draggable onDragEnd={(e) => {
                    const { x, y } = e.target.position();
                    setTokens((arr) => arr.map((it) => (it.id === t.id ? { ...it, x, y } : it)));
                  }} onWheel={(e) => onWheel(e, t.id)} onClick={() => toggleAura(t.id)}>
                    {t.aura > 0 && (
                      <Circle x={0} y={0} radius={t.aura} stroke="#ffffff" dash={[6, 6]} opacity={0.4} />
                    )}
                    <Circle x={0} y={0} radius={18} fill={t.color} shadowBlur={8} />
                    <Text text={t.label} x={-14} y={-8} width={28} align="center" fontStyle="700" fontSize={12} fill="#0b0b0f" />
                  </Group>
                ))}

                {ruler && (
                  <Group>
                    <Line points={[ruler.x1, ruler.y1, ruler.x2, ruler.y2]} stroke="#fffa" strokeWidth={2} dash={[8, 6]} />
                    <Text x={ruler.x2 + 8} y={ruler.y2 + 8} text={`${distance(ruler.x1, ruler.y1, ruler.x2, ruler.y2)} px`} fill="#fff" fontSize={12} />
                  </Group>
                )}
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}
