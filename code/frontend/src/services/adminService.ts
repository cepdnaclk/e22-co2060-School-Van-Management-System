import { API_BASE_URL } from "../config/api";
import { readStoredSession } from "../features/auth/storage";

const getAuthHeaders = () => {
  const session = readStoredSession();
  return {
    "Content-Type": "application/json",
    Authorization: session?.token ? `Bearer ${session.token}` : "",
  };
};

export const getUsers = async (role?: string) => {
  const query = role ? `?role=${role}` : "";
  const response = await fetch(`${API_BASE_URL}/admin/users${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

export const updateUserStatus = async (userId: number, isApproved: boolean) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ is_approved: isApproved }),
  });
  if (!response.ok) throw new Error("Failed to update user status");
  return response.json();
};

export const getStudents = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/students`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch students");
  return response.json();
};

export const createVehicle = async (vehicleData: any) => {
  const response = await fetch(`${API_BASE_URL}/vehicles`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(vehicleData),
  });
  if (!response.ok) throw new Error("Failed to create vehicle");
  return response.json();
};

export const updateVehicle = async (id: number, vehicleData: any) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(vehicleData),
  });
  if (!response.ok) throw new Error("Failed to update vehicle");
  return response.json();
};

export const deleteVehicle = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to delete vehicle");
  return response.json();
};
