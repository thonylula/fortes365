import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { NavTabs } from "@/components/nav-tabs";
import { SkillTreeView } from "./skill-tree-view";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: nodes }, { data: edges }, { data: userSkills }] = await Promise.all([
    supabase.from("skill_nodes").select("*").order("sort_order"),
    supabase.from("skill_edges").select("*"),
    user
      ? supabase.from("user_skills").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [] }),
  ]);

  const userInfo = user
    ? { email: user.email ?? "" }
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--bg)]">
      <Header user={userInfo} />
      <NavTabs />
      <SkillTreeView
        nodes={(nodes ?? []) as SkillNode[]}
        edges={(edges ?? []) as SkillEdge[]}
        userSkills={(userSkills ?? []) as UserSkill[]}
        isLoggedIn={!!user}
      />
    </div>
  );
}

export type SkillNode = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  category: string;
  difficulty: number;
  description: string | null;
  exercise_slug: string | null;
  sort_order: number;
};

export type SkillEdge = {
  id: number;
  parent_id: number;
  child_id: number;
};

export type UserSkill = {
  id: string;
  user_id: string;
  skill_id: number;
  status: "locked" | "in_progress" | "mastered";
  mastered_at: string | null;
};
