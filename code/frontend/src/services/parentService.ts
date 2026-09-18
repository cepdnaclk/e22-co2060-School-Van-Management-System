import axios from "axios";
import { API_BASE_URL as API_ROOT_URL } from "../config/api";

const API_BASE_URL = `${API_ROOT_URL}/parent`;

const getAuthHeader = () => {
    const sessionStr = window.localStorage.getItem("school-van-auth-session");
    if (sessionStr) {
        try {
            const session = JSON.parse(sessionStr);
            return { Authorization: `Bearer ${session.token}` };
        } catch (e) {
            return {};
        }
    }
    return {};
};

export interface Stop {
    id: number;
    name: string;
    order: number;
    latitude: number;
    longitude: number;
}

export interface Route {
    id: number;
    name: string;
    driver_name: string;
    driver_phone: string;
    stops: Stop[];
}

export interface Child {
    id: number;
    name: string;
    school: string;
    pickup_stop_id: number;
    dropoff_stop_id: number;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    status: string;
    current_status?: string;
    driver_id?: number;
    pickup_stop_name?: string;
    dropoff_stop_name?: string;
    route_name?: string;
}

export interface JourneyHistoryItem {
    event_id: number;
    type: "boarding" | "dropoff";
    event_time: string;
    student_name: string;
    journey_id: number;
    route_name: string;
}

export interface EmergencyContact {
    driver_name: string;
    driver_phone: string;
    route_name: string;
    student_name: string;
}

export const getChildren = async (): Promise<Child[]> => {
    const response = await axios.get(`${API_BASE_URL}/children`, { headers: getAuthHeader() });
    return response.data;
};

export const registerChild = async (childData: Partial<Child>): Promise<Child> => {
    const response = await axios.post(`${API_BASE_URL}/children`, childData, { headers: getAuthHeader() });
    return response.data;
};

export const updateChild = async (id: number, childData: Partial<Child>): Promise<Child> => {
    const response = await axios.put(`${API_BASE_URL}/children/${id}`, childData, { headers: getAuthHeader() });
    return response.data;
};

export const markAbsent = async (id: number, date: string, sessionType: string, reason?: string) => {
    const response = await axios.post(`${API_BASE_URL}/children/${id}/absent`, { date, session_type: sessionType, reason }, { headers: getAuthHeader() });
    return response.data;
};

export const getAbsences = async (studentId: number): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/children/${studentId}/absences`, { headers: getAuthHeader() });
    return response.data;
};

export const cancelAbsence = async (studentId: number, date: string): Promise<any> => {
    const response = await axios.delete(`${API_BASE_URL}/children/${studentId}/absences/${date}`, { headers: getAuthHeader() });
    return response.data;
};

export const getJourneyHistory = async (): Promise<JourneyHistoryItem[]> => {
    const response = await axios.get(`${API_BASE_URL}/journey-history`, { headers: getAuthHeader() });
    return response.data;
};

export const getEmergencyContacts = async (): Promise<EmergencyContact[]> => {
    const response = await axios.get(`${API_BASE_URL}/emergency-contacts`, { headers: getAuthHeader() });
    return response.data;
};

export const getChildStatus = async (studentId: number) => {
    const response = await axios.get(`${API_BASE_URL}/children/${studentId}/status`, { headers: getAuthHeader() });
    return response.data;
};

export const markNotificationAsRead = async (notificationId: number) => {
    const response = await axios.patch(`${API_ROOT_URL}/notifications/${notificationId}/read`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const getAvailableRoutes = async (): Promise<Route[]> => {
    const response = await axios.get(`${API_BASE_URL}/available-routes`, { headers: getAuthHeader() });
    return response.data;
};

export const getRouteByDriverId = async (driverId: number): Promise<Route> => {
    const response = await axios.get(`${API_BASE_URL}/route-by-driver/${driverId}`, { headers: getAuthHeader() });
    return response.data;
};

export const startMockJourney = async (studentId: number) => {
    const response = await axios.post(`${API_BASE_URL}/children/${studentId}/mock-journey`, {}, { headers: getAuthHeader() });
    return response.data;
};

export const boardStudent = async (journeyId: number, studentId: number) => {
    const response = await axios.post(`${API_ROOT_URL}/boarding`, { journeyId, studentId }, { headers: getAuthHeader() });
    return response.data;
};

export const dropoffStudent = async (journeyId: number, studentId: number) => {
    const response = await axios.post(`${API_ROOT_URL}/dropoff`, { journeyId, studentId }, { headers: getAuthHeader() });
    return response.data;
};

export const getParentNotifications = async (): Promise<any[]> => {
    const response = await axios.get(`${API_BASE_URL}/notifications`, { headers: getAuthHeader() });
    return response.data;
};
