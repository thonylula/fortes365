declare global {
  interface Window {
    posthog?: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
    };
  }
}

function track(event: string, props?: Record<string, unknown>) {
  try {
    window.posthog?.capture(event, props);
  } catch { /* PostHog not loaded */ }
}

export const analytics = {
  workoutCompleted: (exerciseCount: number, monthId: number) =>
    track("workout_completed", { exercise_count: exerciseCount, month_id: monthId }),

  exerciseToggled: (slug: string, done: boolean) =>
    track("exercise_toggled", { exercise_slug: slug, marked_done: done }),

  achievementUnlocked: (slug: string) =>
    track("achievement_unlocked", { achievement_slug: slug }),

  coachMessageSent: () =>
    track("coach_message_sent"),

  onboardingStepCompleted: (step: number, totalSteps: number) =>
    track("onboarding_step_completed", { step, total_steps: totalSteps }),

  subscriptionStarted: (tier: string) =>
    track("subscription_started", { tier }),

  skillMastered: (slug: string, category: string) =>
    track("skill_mastered", { skill_slug: slug, category }),

  pageViewed: (page: string) =>
    track("$pageview", { page }),
};
