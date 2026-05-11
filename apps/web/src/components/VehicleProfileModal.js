import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { FUEL_OPTIONS } from "@route-cost/shared";
export const VehicleProfileModal = ({ open, initialValue, onClose, onSave }) => {
    const [name, setName] = useState(initialValue.name);
    const [fuelType, setFuelType] = useState(initialValue.fuelType);
    const [consumptionPer100Km, setConsumptionPer100Km] = useState(String(initialValue.consumptionPer100Km));
    const [energyPrice, setEnergyPrice] = useState(String(initialValue.energyPrice));
    const [error, setError] = useState(null);
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
    return (_jsx("div", { className: "modal-backdrop", role: "dialog", "aria-modal": "true", "aria-label": "Auto-instellingen", children: _jsxs("div", { className: "modal", children: [_jsx("h3", { children: "Auto-instellingen" }), _jsxs("label", { children: ["Profielnaam", _jsx("input", { value: name, onChange: (event) => setName(event.target.value), placeholder: "Bijv. Seat Ibiza" })] }), _jsxs("label", { children: ["Brandstofsoort", _jsx("select", { value: fuelType, onChange: (event) => setFuelType(event.target.value), children: FUEL_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value))) })] }), _jsxs("label", { children: ["Verbruik per 100 km (", unit, ")", _jsx("input", { type: "number", min: "0", step: "0.1", value: consumptionPer100Km, onChange: (event) => setConsumptionPer100Km(event.target.value) })] }), _jsxs("label", { children: ["Energieprijs per ", unit, _jsx("input", { type: "number", min: "0", step: "0.01", value: energyPrice, onChange: (event) => setEnergyPrice(event.target.value) })] }), error && _jsx("p", { className: "modal-error", children: error }), _jsxs("div", { className: "modal-actions", children: [_jsx("button", { type: "button", className: "ghost", onClick: onClose, children: "Annuleren" }), _jsx("button", { type: "button", onClick: handleSave, children: "Opslaan" })] })] }) }));
};
