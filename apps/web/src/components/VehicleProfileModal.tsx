import { useEffect, useMemo, useState } from "react";
import { FUEL_OPTIONS, type FuelType, type VehicleProfile } from "@route-cost/shared";

interface VehicleProfileModalProps {
  open: boolean;
  initialValue: VehicleProfile;
  onClose: () => void;
  onSave: (profile: VehicleProfile) => void;
}

export const VehicleProfileModal = ({ open, initialValue, onClose, onSave }: VehicleProfileModalProps) => {
  const [name, setName] = useState(initialValue.name);
  const [fuelType, setFuelType] = useState<FuelType>(initialValue.fuelType);
  const [consumptionPer100Km, setConsumptionPer100Km] = useState(String(initialValue.consumptionPer100Km));
  const [energyPrice, setEnergyPrice] = useState(String(initialValue.energyPrice));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(initialValue.name);
    setFuelType(initialValue.fuelType);
    setConsumptionPer100Km(String(initialValue.consumptionPer100Km));
    setEnergyPrice(String(initialValue.energyPrice));
    setError(null);
  }, [open, initialValue]);

  const unit = useMemo(() => (fuelType === "electric" ? "kWh" : "liter"), [fuelType]);

  if (!open) {
    return null;
  }

  const handleSave = () => {
    const parsedConsumption = Number(consumptionPer100Km);
    const parsedPrice = Number(energyPrice);

    if (!name.trim()) {
      setError("Profielnaam mag niet leeg zijn.");
      return;
    }

    if (!(parsedConsumption > 0)) {
      setError("Verbruik moet groter zijn dan 0.");
      return;
    }

    if (!(parsedPrice > 0)) {
      setError("Prijs moet groter zijn dan 0.");
      return;
    }

    onSave({
      name: name.trim(),
      fuelType,
      consumptionPer100Km: parsedConsumption,
      energyPrice: parsedPrice
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Auto-instellingen">
      <div className="modal">
        <h3>Auto-instellingen</h3>

        <label>
          Profielnaam
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Bijv. Seat Ibiza" />
        </label>

        <label>
          Brandstofsoort
          <select value={fuelType} onChange={(event) => setFuelType(event.target.value as FuelType)}>
            {FUEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Verbruik per 100 km ({unit})
          <input
            type="number"
            min="0"
            step="0.1"
            value={consumptionPer100Km}
            onChange={(event) => setConsumptionPer100Km(event.target.value)}
          />
        </label>

        <label>
          Energieprijs per {unit}
          <input
            type="number"
            min="0"
            step="0.01"
            value={energyPrice}
            onChange={(event) => setEnergyPrice(event.target.value)}
          />
        </label>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            Annuleren
          </button>
          <button type="button" onClick={handleSave}>
            Opslaan
          </button>
        </div>
      </div>
    </div>
  );
};
