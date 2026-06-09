"use client";

import { useState } from "react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

interface RoomData {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  baseRent: number;
  beds?: { id: string; bedNumber: string }[];
}

interface RoomFormProps {
  room?: RoomData;
  onSuccess: () => void;
}

export default function RoomForm({ room, onSuccess }: RoomFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    roomNumber: room?.roomNumber || "",
    floor: room?.floor?.toString() || "0",
    roomType: room?.roomType || "SINGLE",
    baseRent: room?.baseRent?.toString() || "",
    bedsCount: room?.beds?.length?.toString() || "1",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const method = room ? "PUT" : "POST";
      const url = room ? `/api/rooms/${room.id}` : "/api/rooms";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber: formData.roomNumber,
          floor: parseInt(formData.floor),
          roomType: formData.roomType,
          baseRent: parseFloat(formData.baseRent),
          propertyId: "property-1",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save room");
      }

      const savedRoom = await res.json();

      if (!room) {
        const bedsCount = parseInt(formData.bedsCount);
        for (let i = 1; i <= bedsCount; i++) {
          await fetch("/api/beds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bedNumber: `B${i}`,
              roomId: savedRoom.id,
            }),
          });
        }
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Room Number"
          value={formData.roomNumber}
          onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
          required
        />
        <Input
          label="Floor"
          type="number"
          min="0"
          value={formData.floor}
          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Room Type"
          value={formData.roomType}
          onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
          options={[
            { value: "SINGLE", label: "Single" },
            { value: "DOUBLE", label: "Double" },
            { value: "TRIPLE", label: "Triple" },
            { value: "QUAD", label: "Quad" },
            { value: "DORMITORY", label: "Dormitory" },
          ]}
        />
        <Input
          label="Base Rent (₹)"
          type="number"
          min="0"
          step="100"
          value={formData.baseRent}
          onChange={(e) => setFormData({ ...formData, baseRent: e.target.value })}
          required
        />
      </div>

      {!room && (
        <Input
          label="Number of Beds"
          type="number"
          min="1"
          max="10"
          value={formData.bedsCount}
          onChange={(e) => setFormData({ ...formData, bedsCount: e.target.value })}
          required
        />
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {room ? "Update Room" : "Create Room"}
        </Button>
      </div>
    </form>
  );
}
