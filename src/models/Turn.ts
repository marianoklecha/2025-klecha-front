export interface Doctor {
  id: string;
  name: string;
  surname: string;
  email: string;
  medicalLicense: string;
  specialty: string;
  slotDurationMin: number;
  score: number;
}

export interface TurnAvailable {
  id: string;
  doctorId: string;
  scheduledAt: string; 
}

export interface TurnAssigned {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientId: string;
  patientName: string;
  scheduledAt: string; 
  status: 'AVAILABLE' | 'RESERVED' | 'COMPLETED' | 'CANCELLED';
}

export interface TurnCreateRequest {
  doctorId: string;
  patientId: string;
  scheduledAt: string; 
  familyMemberId: string;
  motive?: string;
}

export interface TurnResponse {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  patientId: string;
  patientName: string;
  familyMemberId: string;
  patientScore?: number | null;
  scheduledAt: string;
  status: string;
  motive?: string | null;
  reason?: string | null;
  needsPatientRating?: boolean;
  needsDoctorRating?: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  uploadedAt?: string | null;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}