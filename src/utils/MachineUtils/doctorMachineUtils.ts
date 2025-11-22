import { DoctorService, type DoctorAvailabilityRequest, type DoctorMetrics } from "../../service/doctor-service.service";
import { MedicalHistoryService } from "../../service/medical-history-service.service";
import type { Patient } from "../../models/Doctor";
import type { MedicalHistory, CreateMedicalHistoryRequest } from "../../models/MedicalHistory";
import { dayjsArgentina } from '#/utils/dateTimeUtils';

export interface UpdateMedicalHistoryParams {
  accessToken: string;
  doctorId: string;
  patientId: string;
  medicalHistory: string;
  turnId?: string; // Optional turn ID for turn-based medical history
}

export interface AddMedicalHistoryParams {
  accessToken: string;
  doctorId: string;
  turnId: string;
  content: string;
}

export interface UpdateMedicalHistoryEntryParams {
  accessToken: string;
  doctorId: string;
  historyId: string;
  content: string;
}

export interface DeleteMedicalHistoryParams {
  accessToken: string;
  doctorId: string;
  historyId: string;
}

export interface LoadPatientMedicalHistoryParams {
  accessToken: string;
  patientId: string;
}

export interface LoadTurnMedicalHistoryParams {
  accessToken: string;
  turnId: string;
  patientId: string;
}

export interface LoadPatientsParams {
  accessToken: string;
  doctorId: string;
}

export interface LoadAvailabilityParams {
  accessToken: string;
  doctorId: string;
}

export interface SaveAvailabilityParams {
  accessToken: string;
  doctorId: string;
  availability: DayAvailability[];
}

export interface LoadDoctorMetricsParams {
  accessToken: string;
  doctorId: string;
}

interface Range {
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  ranges: Range[];
}


export const loadDoctorPatients = async ({ accessToken, doctorId }: LoadPatientsParams): Promise<Patient[]> => {
  return await DoctorService.getDoctorPatients(accessToken, doctorId);
};


export const loadDoctorAvailability = async ({ accessToken, doctorId }: LoadAvailabilityParams) => {
  return await  DoctorService.getAvailability(accessToken, doctorId);
};












export const addMedicalHistory = async ({accessToken, doctorId, turnId, content}: AddMedicalHistoryParams): Promise<MedicalHistory> => {
  try {
    const request: CreateMedicalHistoryRequest = {
      turnId,
      content
    };

    const result = await MedicalHistoryService.addMedicalHistory(accessToken, doctorId, request);
    return result;
  } catch (error) {
    throw error;
  }
}

export const updateMedicalHistory = async ({accessToken, doctorId, patientId, medicalHistory, turnId}: UpdateMedicalHistoryParams & {turnId?: string}): Promise<MedicalHistory> => {
  try {
    // When called from a doctor context, use the doctor-scoped endpoint so the backend authorizes correctly
    const historyEntries = doctorId
      ? await MedicalHistoryService.getPatientMedicalHistoryByDoctor(accessToken, doctorId, patientId)
      : await MedicalHistoryService.getPatientMedicalHistory(accessToken, patientId);
    
    if (turnId) {
      const turnEntry = historyEntries.find(entry => entry.turnId === turnId);
      
      if (turnEntry) {
        return await MedicalHistoryService.updateMedicalHistory(
          accessToken, 
          doctorId, 
          turnEntry.id, 
          { content: medicalHistory }
        );
      } else {
        return await addMedicalHistory({
          accessToken,
          doctorId,
          turnId,
          content: medicalHistory
        });
      }
    } else {
      if (historyEntries.length > 0) {
        const mostRecentEntry = historyEntries.sort((a, b) => 
          dayjsArgentina(b.updatedAt).valueOf() - dayjsArgentina(a.updatedAt).valueOf()
        )[0];
        
        return await MedicalHistoryService.updateMedicalHistory(
          accessToken, 
          doctorId, 
          mostRecentEntry.id, 
          { content: medicalHistory }
        );
      } else {
        if (turnId) {
          return await addMedicalHistory({
            accessToken,
            doctorId,
            turnId,
            content: medicalHistory
          });
        } else {
          throw new Error("No medical history entries found for this patient and no turn ID provided");
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

export const updateMedicalHistoryEntry = async ({accessToken, doctorId, historyId, content}: UpdateMedicalHistoryEntryParams): Promise<MedicalHistory> => {
  return await MedicalHistoryService.updateMedicalHistory(accessToken, doctorId, historyId, { content });
}

export const deleteMedicalHistory = async ({accessToken, doctorId, historyId}: DeleteMedicalHistoryParams): Promise<void> => {
  return await MedicalHistoryService.deleteMedicalHistory(accessToken, doctorId, historyId);
}

export const loadPatientMedicalHistory = async ({accessToken, patientId}: LoadPatientMedicalHistoryParams): Promise<MedicalHistory[]> => {
  // Default to general patient endpoint; callers in doctor flows should pass through doctor-specific helpers where possible
  return await MedicalHistoryService.getPatientMedicalHistory(accessToken, patientId);
}

export const loadTurnMedicalHistory = async ({accessToken, turnId, patientId}: LoadTurnMedicalHistoryParams): Promise<MedicalHistory[]> => {
  // Load all patient medical history and filter by turnId
  // Note: This approach works since medical history is now associated with specific turns
  // If this function is invoked from a doctor flow, consider replacing this call with the doctor-specific endpoint
  const allHistory = await MedicalHistoryService.getPatientMedicalHistory(accessToken, patientId);
  return allHistory.filter((history) => history.turnId === turnId);
}

export const saveDoctorAvailability = async ({ accessToken, doctorId, availability }: SaveAvailabilityParams): Promise<string> => {
  const dayMapping: { [key: string]: string } = {
    "LUNES": "MONDAY",
    "MARTES": "TUESDAY", 
    "MIÉRCOLES": "WEDNESDAY",
    "MIERCOLES": "WEDNESDAY",
    "JUEVES": "THURSDAY",
    "VIERNES": "FRIDAY",
    "SÁBADO": "SATURDAY",
    "SABADO": "SATURDAY",
    "DOMINGO": "SUNDAY"
  };

  const availabilityRequest: DoctorAvailabilityRequest = {
    weeklyAvailability: availability.map((day: DayAvailability) => {
      const spanishDay = day.day.toUpperCase();
      const englishDay = dayMapping[spanishDay] || spanishDay;

      return {
        day: englishDay,
        enabled: day.enabled,
        ranges: (day.ranges || []).filter(range => {
          if (!range.start || !range.end) return false;

          const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
          const isValidStart = timeRegex.test(range.start);
          const isValidEnd = timeRegex.test(range.end);

          if (!isValidStart || !isValidEnd) {
            return false;
          }

          return true;
        })
      };
    })
  };

  await  DoctorService.saveAvailability(accessToken, doctorId, availabilityRequest);

  return "Availability saved successfully";
}

export const loadDoctorMetrics = async ({ accessToken, doctorId }: LoadDoctorMetricsParams): Promise<DoctorMetrics> => {
  return await DoctorService.getDoctorMetrics(accessToken, doctorId);
}