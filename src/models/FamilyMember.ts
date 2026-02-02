export interface FamilyMemberCreateRequest {
  holderId: string;
  name: string;
  surname: string;
  birthdate: string;
  gender: string;
  dni: string;
  relationship: string;
}

export interface FamilyMemberResponse {
  id: string;
  holderId: string;
  name: string;
  surname: string;
  birthdate: string;
  gender: string;
  dni: string;
  relationship: string;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
}