"use client";

import { useEffect, useState } from "react";
import { Plus, DoorOpen, BedDouble, Users } from "lucide-react";
import Button from "@/components/ui/button";
import Card, { CardContent } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Modal from "@/components/ui/modal";
import RoomForm from "@/components/rooms/room-form";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  baseRent: number;
  beds: {
    id: string;
    bedNumber: string;
    status: string;
    tenant: { id: string; name: string } | null;
  }[];
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms");
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  }

  const totalBeds = rooms.reduce((sum, room) => sum + room.beds.length, 0);
  const occupiedBeds = rooms.reduce(
    (sum, room) => sum + room.beds.filter((bed) => bed.status === "OCCUPIED").length,
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms & Beds</h1>
          <p className="text-gray-500">Manage your PG rooms and bed allocation</p>
        </div>
        <Button onClick={() => { setSelectedRoom(null); setShowModal(true); }}>
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <DoorOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Rooms</p>
              <p className="text-2xl font-bold text-gray-900">{rooms.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <BedDouble className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Beds</p>
              <p className="text-2xl font-bold text-gray-900">{totalBeds}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupancy</p>
              <p className="text-2xl font-bold text-gray-900">
                {occupiedBeds}/{totalBeds}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const occupiedCount = room.beds.filter((b) => b.status === "OCCUPIED").length;
          const isFullyOccupied = occupiedCount === room.beds.length;

          return (
            <Card
              key={room.id}
              className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                isFullyOccupied && "border-green-200"
              )}
              onClick={() => { setSelectedRoom(room); setShowModal(true); }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Room {room.roomNumber}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Floor {room.floor} • {room.roomType}
                    </p>
                  </div>
                  <Badge variant={isFullyOccupied ? "success" : "default"}>
                    {isFullyOccupied ? "Full" : "Available"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600">Beds:</span>
                  <div className="flex gap-1">
                    {room.beds.map((bed) => (
                      <div
                        key={bed.id}
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
                          bed.status === "OCCUPIED"
                            ? "bg-indigo-100 text-indigo-700"
                            : bed.status === "MAINTENANCE"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                        )}
                        title={bed.tenant?.name || bed.bedNumber}
                      >
                        {bed.bedNumber}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    ₹{Number(room.baseRent).toLocaleString()}/month
                  </span>
                  <span className="text-gray-500">
                    {occupiedCount}/{room.beds.length} occupied
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setSelectedRoom(null); }}
        title={selectedRoom ? "Edit Room" : "Add Room"}
        size="lg"
      >
        <RoomForm
          room={selectedRoom || undefined}
          onSuccess={() => {
            setShowModal(false);
            setSelectedRoom(null);
            fetchRooms();
          }}
        />
      </Modal>
    </div>
  );
}
