// ─── WCA Hub — Gamificación ───────────────────────────────────────
// Hook central para XP, racha, badges y leaderboard.
// Uso: const gami = useGamification(profileId, studentId, groupId)

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";

// XP thresholds por rango
export const XP_RANKS = [
  { min: 0,    label: "Explorer",  icon: "🥉", color: "#94a3b8" },
  { min: 500,  label: "Learner",   icon: "🥈", color: "#64748b" },
  { min: 2000, label: "Achiever",  icon: "🥇", color: "#d97706" },
  { min: 5000, label: "WCA Pro",   icon: "⭐", color: "#7c3aed" },
];

export function getRank(xp) {
  const sorted = [...XP_RANKS].reverse();
  return sorted.find(r => xp >= r.min) || XP_RANKS[0];
}

export function getXpToNextRank(xp) {
  const next = XP_RANKS.find(r => r.min > xp);
  if (!next) return null;
  return { needed: next.min - xp, next };
}

// ── Main hook ──────────────────────────────────────────────────────
export function useGamification(profileId, studentId) {
  const [data, setData] = useState({
    totalXp:       0,
    xpLevel:       1,
    streak:        0,
    longestStreak: 0,
    badges:        [],
    leaderboard:   [],
    myRank:        null,
    referralCode:  null,
    loading:       true,
  });

  const load = useCallback(async () => {
    if (!profileId) return;

    const [profileRes, badgesRes, leaderboardRes] = await Promise.all([
      // Profile: XP, streak, referral code
      supabase.from("profiles")
        .select("total_xp, xp_level, current_streak, longest_streak, referral_code")
        .eq("id", profileId).maybeSingle(),

      // Earned badges
      studentId
        ? supabase.from("student_badges")
            .select("badge_id, earned_at, badges(id, name, icon, description, xp_reward)")
            .eq("student_id", studentId)
            .order("earned_at", { ascending: false })
        : { data: [] },

      // Monthly leaderboard (top 10 of same group/all students)
      supabase.from("xp_ledger")
        .select("profile_id, amount, profiles(full_name, xp_level, current_streak)")
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .limit(500),
    ]);

    const profile = profileRes.data;

    // Build leaderboard from xp_ledger
    const xpByProfile = {};
    (leaderboardRes.data || []).forEach(row => {
      if (!xpByProfile[row.profile_id]) {
        xpByProfile[row.profile_id] = {
          profile_id: row.profile_id,
          monthly_xp: 0,
          full_name:  row.profiles?.full_name || "—",
          xp_level:   row.profiles?.xp_level  || 1,
          streak:     row.profiles?.current_streak || 0,
        };
      }
      xpByProfile[row.profile_id].monthly_xp += (row.amount || 0);
    });
    const leaderboard = Object.values(xpByProfile)
      .sort((a, b) => b.monthly_xp - a.monthly_xp)
      .slice(0, 10);
    const myPos = leaderboard.findIndex(r => r.profile_id === profileId);

    setData({
      totalXp:       profile?.total_xp       || 0,
      xpLevel:       profile?.xp_level       || 1,
      streak:        profile?.current_streak  || 0,
      longestStreak: profile?.longest_streak  || 0,
      referralCode:  profile?.referral_code   || null,
      badges:        (badgesRes.data || []).map(b => ({
        id:          b.badge_id,
        name:        b.badges?.name,
        icon:        b.badges?.icon,
        description: b.badges?.description,
        xp:          b.badges?.xp_reward,
        earnedAt:    b.earned_at,
      })),
      leaderboard,
      myRank: myPos >= 0 ? myPos + 1 : null,
      loading: false,
    });
  }, [profileId, studentId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, reload: load };
}

// ── Update streak (call after any activity) ────────────────────────
export async function updateStreak(profileId) {
  if (!profileId) return null;
  const { data, error } = await supabase.rpc("update_streak", { p_profile_id: profileId });
  if (error) { console.error("streak error:", error.message); return null; }
  return data; // { streak, xp_bonus, milestone, changed }
}

// ── Award badge ────────────────────────────────────────────────────
export async function awardBadge(studentId, badgeId) {
  if (!studentId || !badgeId) return false;
  const { data, error } = await supabase.rpc("award_badge", {
    p_student_id: studentId,
    p_badge_id:   badgeId,
  });
  if (error) { console.error("badge error:", error.message); return false; }
  return data; // true if newly awarded, false if already had it
}

// ── Check and award automatic badges ──────────────────────────────
export async function checkBadges(studentId, { streak, score, isFirstExam, isLevelUp, isChampion, country }) {
  if (!studentId) return [];
  const awarded = [];

  if (streak >= 7)  { const ok = await awardBadge(studentId, "streak_7");  if (ok) awarded.push("streak_7"); }
  if (streak >= 30) { const ok = await awardBadge(studentId, "streak_30"); if (ok) awarded.push("streak_30"); }
  if (isFirstExam)  { const ok = await awardBadge(studentId, "first_exam");if (ok) awarded.push("first_exam"); }
  if (score === 100){ const ok = await awardBadge(studentId, "perfect");   if (ok) awarded.push("perfect"); }
  if (isLevelUp)    { const ok = await awardBadge(studentId, "level_up");  if (ok) awarded.push("level_up"); }
  if (isChampion)   { const ok = await awardBadge(studentId, "champion");  if (ok) awarded.push("champion"); }
  if (country && country !== "Honduras") {
    const ok = await awardBadge(studentId, "global"); if (ok) awarded.push("global");
  }

  return awarded;
}

// ── Streak flame color ─────────────────────────────────────────────
export function streakColor(streak) {
  if (streak >= 30) return "#ef4444";
  if (streak >= 14) return "#f97316";
  if (streak >= 7)  return "#f59e0b";
  if (streak >= 3)  return "#d97706";
  return "#94a3b8";
}
