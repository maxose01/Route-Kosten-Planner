import { useEffect, useState } from "react";
import type { VehicleProfile } from "@route-cost/shared";

const STORAGE_KEY = "route-cost:vehicle-profile";

const defaultProfile: VehicleProfile = {
  name: "Mijn auto",
  fuelType: "petrol",
  consumptionPer100Km: 6.5,
  energyPrice: 2.1
};

export const useVehicleProfile = () => {
  const [profile, setProfile] = useState<VehicleProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return defaultProfile;
    }

    try {
      return JSON.parse(stored) as VehicleProfile;
    } catch {
      return defaultProfile;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  return { profile, setProfile };
};
