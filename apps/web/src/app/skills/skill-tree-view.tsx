"use client";

import { useState } from "react";
import type { SkillNode, SkillEdge, UserSkill } from "./page";

const CATEGORY_LABELS: Record<string, string> = {
  push: "Empurrar",
  pull: "Puxar",
  legs: "Pernas",
  core: "Core",
  skills: "Habilidades",
  cardio: "Cardio",
};

const CATEGORY_EMOJI: Record<string, string> = {
  push: "💪",
  pull: "🏋️",
  legs: "🦵",
  core: "🎯",
  skills: "🤸",
  cardio: "🔥",
};

const CATEGORY_COLOR: Record<string, string> = {
  push: "var(--or)",
  pull: "var(--bl)",
  legs: "var(--gn)",
  core: "var(--yw)",
  skills: "var(--pu)",
  cardio: "var(--pk)",
};

const DIFFICULTY_LABELS = ["", "Iniciante", "Iniciante", "Basico", "Basico", "Intermediario", "Intermediario", "Avancado", "Avancado", "Elite", "Mestre"];

export function SkillTreeView({
  nodes,
  edges,
  userSkills,
  isLoggedIn,
}: {
  nodes: SkillNode[];
  edges: SkillEdge[];
  userSkills: UserSkill[];
  isLoggedIn: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<string>("push");
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  const categories = [...new Set(nodes.map((n) => n.category))];
  const statusMap = new Map(userSkills.map((us) => [us.skill_id, us.status]));

  const categoryNodes = nodes.filter((n) => n.category === activeCategory);

  const getStatus = (nodeId: number) => statusMap.get(nodeId) ?? "locked";

  const isUnlockable = (node: SkillNode) => {
    const parents = edges.filter((e) => e.child_id === node.id);
    if (parents.length === 0) return true;
    return parents.some((e) => getStatus(e.parent_id) === "mastered");
  };

  const getChildren = (nodeId: number) =>
    edges.filter((e) => e.parent_id === nodeId).map((e) => nodes.find((n) => n.id === e.child_id)).filter(Boolean) as SkillNode[];

  const getParents = (nodeId: number) =>
    edges.filter((e) => e.child_id === nodeId).map((e) => nodes.find((n) => n.id === e.parent_id)).filter(Boolean) as SkillNode[];

  const totalInCategory = categoryNodes.length;
  const masteredInCategory = categoryNodes.filter((n) => getStatus(n.id) === "mastered").length;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-20" id="main-content">
      <h1 className="mb-4 text-center font-[family-name:var(--font-display)] text-3xl tracking-wider">
        SKILL TREE
      </h1>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-1.5">
        {categories.map((cat) => {
          const active = cat === activeCategory;
          const catNodes = nodes.filter((n) => n.category === cat);
          const mastered = catNodes.filter((n) => getStatus(n.id) === "mastered").length;
          return (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setSelectedNode(null); }}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 font-[family-name:var(--font-condensed)] text-[10px] font-bold uppercase tracking-wider transition-all"
              style={{
                background: active ? CATEGORY_COLOR[cat] : "var(--s2)",
                color: active ? "#000" : "var(--tx2)",
                border: `1.5px solid ${active ? CATEGORY_COLOR[cat] : "var(--bd)"}`,
              }}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              {CATEGORY_LABELS[cat]}
              {mastered > 0 && (
                <span className="rounded-full bg-black/20 px-1.5 text-[8px]">{mastered}/{catNodes.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-[color:var(--s2)]">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${totalInCategory > 0 ? (masteredInCategory / totalInCategory) * 100 : 0}%`,
              background: CATEGORY_COLOR[activeCategory],
            }}
          />
        </div>
        <span className="font-[family-name:var(--font-condensed)] text-xs font-bold tracking-wider text-[color:var(--tx2)]">
          {masteredInCategory}/{totalInCategory}
        </span>
      </div>

      {/* Skill nodes grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {categoryNodes.map((node, i) => {
          const status = getStatus(node.id);
          const unlockable = isUnlockable(node);
          const nextNodes = getChildren(node.id);
          const isSelected = selectedNode?.id === node.id;
          const color = CATEGORY_COLOR[node.category];

          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(isSelected ? null : node)}
              className="relative flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all"
              style={{
                borderColor: isSelected ? color : status === "mastered" ? color : status === "in_progress" ? color : "var(--bd)",
                background: status === "mastered" ? `color-mix(in srgb, ${color} 10%, var(--s1))` : isSelected ? "var(--s2)" : "var(--s1)",
                opacity: status === "locked" && !unlockable ? 0.35 : 1,
                boxShadow: isSelected ? `0 0 20px color-mix(in srgb, ${color} 20%, transparent)` : "none",
              }}
            >
              {/* Status badge */}
              {status === "mastered" && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px]" style={{ background: color, color: "#000" }}>
                  ✓
                </div>
              )}
              {status === "in_progress" && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 text-[8px]" style={{ borderColor: color, color, background: "var(--s1)" }}>
                  ●
                </div>
              )}

              {/* Difficulty dots */}
              <div className="mb-0.5 flex gap-0.5">
                {Array.from({ length: Math.min(node.difficulty, 5) }, (_, j) => (
                  <div key={j} className="h-1 w-1 rounded-full" style={{ background: color }} />
                ))}
              </div>

              <span className="text-2xl">{node.emoji}</span>
              <span className="font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase leading-tight tracking-wide">
                {node.name}
              </span>

              {/* Lock icon */}
              {status === "locked" && !unlockable && (
                <span className="text-[10px] text-[color:var(--tx3)]">🔒</span>
              )}

              {/* Arrow to next */}
              {nextNodes.length > 0 && i < categoryNodes.length - 1 && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-[color:var(--tx3)]">↓</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected node detail */}
      {selectedNode && (
        <div className="animate-in mt-6 rounded-xl border border-[color:var(--bd)] bg-[color:var(--s1)] p-5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{selectedNode.emoji}</div>
            <div className="flex-1">
              <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wider">
                {selectedNode.name}
              </h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase" style={{ background: `color-mix(in srgb, ${CATEGORY_COLOR[selectedNode.category]} 15%, transparent)`, color: CATEGORY_COLOR[selectedNode.category] }}>
                  {CATEGORY_LABELS[selectedNode.category]}
                </span>
                <span className="rounded-full bg-[color:var(--s2)] px-2 py-0.5 text-[9px] font-bold uppercase text-[color:var(--tx2)]">
                  {DIFFICULTY_LABELS[selectedNode.difficulty]} · Nv {selectedNode.difficulty}
                </span>
              </div>
              {selectedNode.description && (
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--tx2)]">
                  {selectedNode.description}
                </p>
              )}

              {/* Pre-requisitos */}
              {getParents(selectedNode.id).length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
                    Pre-requisitos
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getParents(selectedNode.id).map((p) => (
                      <span
                        key={p.id}
                        className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                        style={{
                          borderColor: getStatus(p.id) === "mastered" ? "var(--gn)" : "var(--bd)",
                          color: getStatus(p.id) === "mastered" ? "var(--gn)" : "var(--tx3)",
                        }}
                      >
                        {p.emoji} {p.name} {getStatus(p.id) === "mastered" ? "✓" : "🔒"}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Desbloqueia */}
              {getChildren(selectedNode.id).length > 0 && (
                <div className="mt-3">
                  <div className="mb-1.5 font-[family-name:var(--font-condensed)] text-[9px] font-bold uppercase tracking-[1.5px] text-[color:var(--tx3)]">
                    Desbloqueia
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {getChildren(selectedNode.id).map((c) => (
                      <span key={c.id} className="flex items-center gap-1 rounded-full border border-[color:var(--bd)] px-2 py-0.5 text-[10px] text-[color:var(--tx3)]">
                        {c.emoji} {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <div className="mt-6 rounded-xl border border-[color:var(--or)]/30 bg-[color:var(--ord)] p-4 text-center text-sm text-[color:var(--or)]">
          <a href="/login" className="underline">Faca login</a> para acompanhar seu progresso na skill tree.
        </div>
      )}
    </main>
  );
}
