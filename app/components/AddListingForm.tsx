"use client";

import { useState, useCallback } from "react";
import { Car } from "../../types/car";

export const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "excellent", label: "Excellent" },
  { value: "very_good", label: "Very Good" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "salvage_rebuilt", label: "Salvage / Rebuilt" },
] as const;

export type ConditionValue = (typeof CONDITION_OPTIONS)[number]["value"];

interface AddListingFormProps {
  onSubmit: (car: Car) => void;
  onCancel: () => void;
  initialCar?: Car;
}

export default function AddListingForm({ onSubmit, onCancel, initialCar }: AddListingFormProps) {
  const isEditing = !!initialCar;

  const getInitialCondition = (): ConditionValue | "" => {
    if (!initialCar) return "";
    const c = initialCar.condition;
    if (typeof c === "string") {
      const found = CONDITION_OPTIONS.find((o) => o.value === c);
      return found ? (c as ConditionValue) : "";
    }
    return "";
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialCar?.image?.startsWith("data:") ? initialCar.image : null
  );
  const [formData, setFormData] = useState({
    year: initialCar ? String(initialCar.year) : "",
    make: initialCar?.make ?? "",
    model: initialCar?.model ?? "",
    trim: initialCar?.trim ?? "",
    body: initialCar?.body ?? "",
    transmission: initialCar?.transmission ?? "",
    vin: initialCar?.vin ?? "",
    state: initialCar?.state ?? "",
    condition: getInitialCondition(),
    odometer: initialCar ? String(initialCar.odometer) : "",
    color: initialCar?.color ?? "",
    interior: initialCar?.interior ?? "",
    sellPrice: initialCar ? String(initialCar.sellingprice) : "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleImageDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const yearNum = parseInt(formData.year, 10);
    if (!formData.year.trim()) next.year = "Year is required";
    else if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1)
      next.year = "Enter a valid year (1900–" + (new Date().getFullYear() + 1) + ")";
    if (!formData.make.trim()) next.make = "Make is required";
    if (!formData.model.trim()) next.model = "Model is required";
    if (!formData.vin.trim()) next.vin = "VIN is required";
    if (!formData.condition) next.condition = "Condition is required";
    const odometerNum = parseFloat(formData.odometer.split(",").join(""));
    if (!formData.odometer.trim()) next.odometer = "Odometer (KM) is required";
    else if (isNaN(odometerNum) || odometerNum < 0) next.odometer = "Enter a valid odometer value";
    if (!formData.sellPrice.trim()) next.sellPrice = "Sell price is required";
    else {
      const sellNum = parseFloat(formData.sellPrice.split(",").join(""));
      if (isNaN(sellNum) || !isFinite(sellNum)) next.sellPrice = "Enter a valid sell price";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const year = parseInt(formData.year, 10);
    const odometer = parseFloat(formData.odometer.split(",").join(""));
    const sellingprice = parseFloat(formData.sellPrice.split(",").join(""));

    const car: Car = {
      ...(initialCar ?? {}),
      year,
      make: formData.make.trim(),
      model: formData.model.trim(),
      trim: formData.trim.trim() || null,
      body: formData.body.trim() || "",
      transmission: formData.transmission.trim() || null,
      vin: formData.vin.trim() || "",
      state: formData.state.trim() || "",
      condition: formData.condition as ConditionValue,
      odometer,
      color: formData.color.trim() || "",
      interior: formData.interior.trim() || "",
      seller: initialCar?.seller ?? "",
      mmr: initialCar?.mmr ?? 0,
      sellingprice,
      saledate: initialCar?.saledate ?? "",
      deal_rating: initialCar?.deal_rating ?? "Fair Market",
      image: imagePreview || initialCar?.image || undefined,
    };

    onSubmit(car);
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-200 px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600";
  const labelClass = "block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300";
  const errorClass = "mt-1 text-xs text-red-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">{isEditing ? "Edit Listing" : "Add New Listing"}</h2>

      <div>
        <label className={labelClass}>Year</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formData.year}
          onChange={(e) => updateField("year", e.target.value.replace(/\D/g, ""))}
          placeholder="e.g. 2020"
          maxLength={4}
          className={inputClass}
          required
        />
        <p className={errorClass}>{errors.year}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Make</label>
          <input
            type="text"
            value={formData.make}
            onChange={(e) => updateField("make", e.target.value)}
            placeholder="e.g. Toyota"
            className={inputClass}
            required
          />
          <p className={errorClass}>{errors.make}</p>
        </div>
        <div>
          <label className={labelClass}>Model</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => updateField("model", e.target.value)}
            placeholder="e.g. Camry"
            className={inputClass}
            required
          />
          <p className={errorClass}>{errors.model}</p>
        </div>
      </div>

      <div>
        <label className={labelClass}>Trim</label>
        <input
          type="text"
          value={formData.trim}
          onChange={(e) => updateField("trim", e.target.value)}
          placeholder="e.g. XLE"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Body</label>
          <input
            type="text"
            value={formData.body}
            onChange={(e) => updateField("body", e.target.value)}
            placeholder="e.g. sedan, suv"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Transmission</label>
          <input
            type="text"
            value={formData.transmission}
            onChange={(e) => updateField("transmission", e.target.value)}
            placeholder="e.g. automatic, manual"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>VIN</label>
        <input
          type="text"
          value={formData.vin}
          onChange={(e) => !isEditing && updateField("vin", e.target.value)}
          placeholder="Vehicle Identification Number"
          className={`${inputClass} ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
          readOnly={isEditing}
          required
        />
        <p className={errorClass}>{errors.vin}</p>
      </div>

      <div>
        <label className={labelClass}>State</label>
        <input
          type="text"
          value={formData.state}
          onChange={(e) => updateField("state", e.target.value)}
          placeholder="e.g. CA"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Condition (required)</label>
        <select
          value={formData.condition}
          onChange={(e) => updateField("condition", e.target.value as ConditionValue)}
          className={`cursor-pointer ${inputClass}`}
          required
        >
          <option value="">Select condition</option>
          {CONDITION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className={errorClass}>{errors.condition}</p>
      </div>

      <div>
        <label className={labelClass}>Odometer (KM)</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.,]*"
          value={formData.odometer}
          onChange={(e) => updateField("odometer", e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="e.g. 50000"
          className={inputClass}
          required
        />
        <p className={errorClass}>{errors.odometer}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Color</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => updateField("color", e.target.value)}
            placeholder="e.g. Black"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Interior</label>
          <input
            type="text"
            value={formData.interior}
            onChange={(e) => updateField("interior", e.target.value)}
            placeholder="e.g. Leather"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Sell Price ($)</label>
        <input
          type="text"
          inputMode="decimal"
          value={formData.sellPrice}
          onChange={(e) => updateField("sellPrice", e.target.value.replace(/[^\d.,]/g, ""))}
          placeholder="e.g. 25000"
          className={inputClass}
          required
        />
        <p className={errorClass}>{errors.sellPrice}</p>
      </div>

      <div>
        <label className={labelClass}>Photo</label>
        <div
          onDrop={handleImageDrop}
          onDragOver={handleDragOver}
          className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
            id="listing-image"
          />
          <label htmlFor="listing-image" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-24 max-w-full object-contain rounded" />
            ) : (
              <>
                <span className="text-sm text-zinc-500 mb-1">Drop image here or click to browse</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="cursor-pointer rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isEditing ? "Save Changes" : "Add Listing"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
