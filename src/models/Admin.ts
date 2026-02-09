export interface PendingDoctor {
  id: string;
  name: string;
  surname: string;
  email: string;
  dni: string;
  gender: string;
  birthdate: string;
  phone: string;
  specialty: string;
  medicalLicense: string;
  role: "DOCTOR";
  status: "PENDING";
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorApprovalResponse {
  message: string;
  doctorId: string;
  newStatus: "ACTIVE" | "REJECTED";
}

export interface AdminStats {
  patients: number;
  doctors: number;
  pending: number;
  familyMembers: number;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}