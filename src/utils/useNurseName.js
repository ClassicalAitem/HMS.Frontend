// useNurseName.js
import { usersAPI } from "@/services/api/usersAPI";
import { useEffect, useState } from "react";

const nurseCache = new Map(); // module-level cache, shared across all uses

export const useNurseName = (nurseId) => {
  const [nurseName, setNurseName] = useState(nurseCache.get(nurseId) || null);

  useEffect(() => {
    if (!nurseId) {
      setNurseName(null);
      return;
    }

    if (nurseCache.has(nurseId)) {
      setNurseName(nurseCache.get(nurseId));
      return;
    }

    let cancelled = false;
    usersAPI.getUserById(nurseId)
      .then((res) => {
        const user = res?.data?.data || res?.data;
        const name = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || null;
        nurseCache.set(nurseId, name);
        if (!cancelled) setNurseName(name);
      })
      .catch(() => {
        if (!cancelled) setNurseName(null);
      });

    return () => { cancelled = true; };
  }, [nurseId]);

  return nurseName;
};

const fetchNurseName = async (nurseId) => {
  if (!nurseId) return null;
  if (nurseCache.has(nurseId)) return nurseCache.get(nurseId);

  try {
    const res = await usersAPI.getUserById(nurseId);
    const user = res?.data?.data || res?.data;
    const name = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || null;
    nurseCache.set(nurseId, name);
    return name;
  } catch {
    return null;
  }
};

export const enrichVitalsWithNurseNames = async (vitals = []) => {
  const uniqueNurseIds = [...new Set(vitals.map(v => v.nurseId).filter(Boolean))];
  const nameMap = {};

  await Promise.all(
    uniqueNurseIds.map(async (id) => {
      nameMap[id] = await fetchNurseName(id);
    })
  );

  return vitals.map(v => ({
    ...v,
    nurseName: v.nurseId ? (nameMap[v.nurseId] || "Unknown Nurse") : "Unknown Nurse",
  }));
};