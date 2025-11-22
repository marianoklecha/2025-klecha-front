import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import {
  loadDoctorPatients,
  loadDoctorAvailability,
  updateMedicalHistory,
  saveDoctorAvailability,
  updateMedicalHistoryEntry,
  deleteMedicalHistory,
  loadPatientMedicalHistory,
  loadTurnMedicalHistory,
  loadDoctorMetrics
} from './doctorMachineUtils'
import { DoctorService } from '../../service/doctor-service.service'
import { MedicalHistoryService } from '../../service/medical-history-service.service'

// Mock the DoctorService
vi.mock('../../service/doctor-service.service', () => ({
  DoctorService: {
    getDoctorPatients: vi.fn(),
    getAvailability: vi.fn(),
    saveAvailability: vi.fn(),
    getDoctorMetrics: vi.fn()
  }
}))

// Mock the MedicalHistoryService
vi.mock('../../service/medical-history-service.service', () => ({
  MedicalHistoryService: {
    addMedicalHistory: vi.fn(),
    updateMedicalHistory: vi.fn(),
    deleteMedicalHistory: vi.fn(),
    getPatientMedicalHistory: vi.fn(),
    getPatientMedicalHistoryByDoctor: vi.fn(),
  }
}))

describe('doctorMachineUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadDoctorPatients', () => {
    it('should call DoctorService.getDoctorPatients with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456'
      }
      const mockPatients = [
        { id: 'pat1', name: 'John Doe' },
        { id: 'pat2', name: 'Jane Smith' }
      ]
      ;(DoctorService.getDoctorPatients as Mock).mockResolvedValue(mockPatients)

      const result = await loadDoctorPatients(params)

      expect(DoctorService.getDoctorPatients).toHaveBeenCalledWith('token123', 'doctor456')
      expect(result).toEqual(mockPatients)
    })
  })

  describe('loadDoctorAvailability', () => {
    it('should call DoctorService.getAvailability with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456'
      }
      const mockAvailability = {
        weeklyAvailability: [
          { day: 'MONDAY', enabled: true, ranges: [{ start: '09:00', end: '17:00' }] }
        ]
      }
      ;(DoctorService.getAvailability as Mock).mockResolvedValue(mockAvailability)

      const result = await loadDoctorAvailability(params)

      expect(DoctorService.getAvailability).toHaveBeenCalledWith('token123', 'doctor456')
      expect(result).toEqual(mockAvailability)
    })
  })

  describe('updateMedicalHistory', () => {
    it('should call MedicalHistoryService.addMedicalHistory with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        patientId: 'patient789',
        medicalHistory: 'Patient has allergies to penicillin',
        turnId: 'turn-123'
      }

      const mockMedicalHistory = {
        id: 'history-1',
        content: 'Patient has allergies to penicillin',
        patientId: 'patient789',
        patientName: 'John',
        patientSurname: 'Doe',
        doctorId: 'doctor456',
        doctorName: 'Dr. Jane',
        doctorSurname: 'Smith',
        createdAt: '2023-10-08T10:00:00Z',
        updatedAt: '2023-10-08T10:00:00Z'
      };

      ;(MedicalHistoryService.getPatientMedicalHistory as Mock).mockResolvedValue([])
      ;(MedicalHistoryService.getPatientMedicalHistoryByDoctor as Mock).mockResolvedValue([])
      ;(MedicalHistoryService.addMedicalHistory as Mock).mockResolvedValue(mockMedicalHistory)

      const result = await updateMedicalHistory(params)

      expect(MedicalHistoryService.addMedicalHistory).toHaveBeenCalledWith(
        'token123',
        'doctor456',
        {
          turnId: 'turn-123',
          content: 'Patient has allergies to penicillin'
        }
      )
      expect(result).toEqual(mockMedicalHistory)
    })
  })

  describe('saveDoctorAvailability', () => {
    it('should save availability with Spanish day names converted to English', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        slotDurationMin: 30,
        availability: [
          {
            day: 'LUNES',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          },
          {
            day: 'MARTES',
            enabled: false,
            ranges: []
          }
        ]
      }

      ;(DoctorService.saveAvailability as Mock).mockResolvedValue(undefined)

      const result = await saveDoctorAvailability(params)

      expect(DoctorService.saveAvailability).toHaveBeenCalledWith('token123', 'doctor456', {
        weeklyAvailability: [
          {
            day: 'MONDAY',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          },
          {
            day: 'TUESDAY',
            enabled: false,
            ranges: []
          }
        ]
      })
      expect(result).toBe('Availability saved successfully')
    })

    it('should handle MIÉRCOLES with accent', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        slotDurationMin: 30,
        availability: [
          {
            day: 'MIÉRCOLES',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          }
        ]
      }

      ;(DoctorService.saveAvailability as Mock).mockResolvedValue(undefined)

      await saveDoctorAvailability(params)

      expect(DoctorService.saveAvailability).toHaveBeenCalledWith('token123', 'doctor456', {
        weeklyAvailability: [
          {
            day: 'WEDNESDAY',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          }
        ]
      })
    })

    it('should filter out invalid time ranges', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        slotDurationMin: 30,
        availability: [
          {
            day: 'LUNES',
            enabled: true,
            ranges: [
              { start: '09:00', end: '17:00' }, // valid
              { start: 'invalid', end: '17:00' }, // invalid start
              { start: '09:00', end: 'invalid' }, // invalid end
              { start: '', end: '17:00' }, // empty start
              { start: '09:00', end: '' } // empty end
            ]
          }
        ]
      }

      ;(DoctorService.saveAvailability as Mock).mockResolvedValue(undefined)

      await saveDoctorAvailability(params)

      expect(DoctorService.saveAvailability).toHaveBeenCalledWith('token123', 'doctor456', {
        weeklyAvailability: [
          {
            day: 'MONDAY',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          }
        ]
      })
    })

    it('should handle unknown day names', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        slotDurationMin: 30,
        availability: [
          {
            day: 'UNKNOWN_DAY',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          }
        ]
      }

      ;(DoctorService.saveAvailability as Mock).mockResolvedValue(undefined)

      await saveDoctorAvailability(params)

      expect(DoctorService.saveAvailability).toHaveBeenCalledWith('token123', 'doctor456', {
        weeklyAvailability: [
          {
            day: 'UNKNOWN_DAY',
            enabled: true,
            ranges: [{ start: '09:00', end: '17:00' }]
          }
        ]
      })
    })
  })

  describe('updateMedicalHistoryEntry', () => {
    it('should call MedicalHistoryService.updateMedicalHistory with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        historyId: 'history789',
        content: 'Updated medical history content'
      }

      const mockUpdatedHistory = {
        id: 'history789',
        content: 'Updated medical history content',
        patientId: 'patient123',
        patientName: 'John',
        patientSurname: 'Doe',
        doctorId: 'doctor456',
        doctorName: 'Dr. Jane',
        doctorSurname: 'Smith',
        createdAt: '2023-10-08T10:00:00Z',
        updatedAt: '2023-10-08T11:00:00Z'
      }

      ;(MedicalHistoryService.updateMedicalHistory as Mock).mockResolvedValue(mockUpdatedHistory)

      const result = await updateMedicalHistoryEntry(params)

      expect(MedicalHistoryService.updateMedicalHistory).toHaveBeenCalledWith(
        'token123',
        'doctor456',
        'history789',
        { content: 'Updated medical history content' }
      )
      expect(result).toEqual(mockUpdatedHistory)
    })
  })

  describe('deleteMedicalHistory', () => {
    it('should call MedicalHistoryService.deleteMedicalHistory with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        historyId: 'history789'
      }

      ;(MedicalHistoryService.deleteMedicalHistory as Mock).mockResolvedValue(undefined)

      const result = await deleteMedicalHistory(params)

      expect(MedicalHistoryService.deleteMedicalHistory).toHaveBeenCalledWith(
        'token123',
        'doctor456',
        'history789'
      )
      expect(result).toBeUndefined()
    })
  })

  describe('loadPatientMedicalHistory', () => {
    it('should call MedicalHistoryService.getPatientMedicalHistory with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        patientId: 'patient456'
      }

      const mockHistories = [
        {
          id: 'history-1',
          content: 'Patient has allergies',
          patientId: 'patient456',
          patientName: 'John',
          patientSurname: 'Doe',
          doctorId: 'doctor123',
          doctorName: 'Dr. Jane',
          doctorSurname: 'Smith',
          createdAt: '2023-10-08T10:00:00Z',
          updatedAt: '2023-10-08T10:00:00Z',
          turnId: 'turn-1'
        }
      ]

      ;(MedicalHistoryService.getPatientMedicalHistory as Mock).mockResolvedValue(mockHistories)

      const result = await loadPatientMedicalHistory(params)

      expect(MedicalHistoryService.getPatientMedicalHistory).toHaveBeenCalledWith(
        'token123',
        'patient456'
      )
      expect(result).toEqual(mockHistories)
    })
  })

  describe('loadTurnMedicalHistory', () => {
    it('should load patient medical history and filter by turnId', async () => {
      const params = {
        accessToken: 'token123',
        turnId: 'turn-456',
        patientId: 'patient789'
      }

      const mockAllHistories = [
        {
          id: 'history-1',
          content: 'History for turn 1',
          patientId: 'patient789',
          patientName: 'John',
          patientSurname: 'Doe',
          doctorId: 'doctor123',
          doctorName: 'Dr. Jane',
          doctorSurname: 'Smith',
          createdAt: '2023-10-08T10:00:00Z',
          updatedAt: '2023-10-08T10:00:00Z',
          turnId: 'turn-123'
        },
        {
          id: 'history-2',
          content: 'History for turn 456',
          patientId: 'patient789',
          patientName: 'John',
          patientSurname: 'Doe',
          doctorId: 'doctor123',
          doctorName: 'Dr. Jane',
          doctorSurname: 'Smith',
          createdAt: '2023-10-09T10:00:00Z',
          updatedAt: '2023-10-09T10:00:00Z',
          turnId: 'turn-456'
        },
        {
          id: 'history-3',
          content: 'History for turn 3',
          patientId: 'patient789',
          patientName: 'John',
          patientSurname: 'Doe',
          doctorId: 'doctor123',
          doctorName: 'Dr. Jane',
          doctorSurname: 'Smith',
          createdAt: '2023-10-10T10:00:00Z',
          updatedAt: '2023-10-10T10:00:00Z',
          turnId: 'turn-789'
        }
      ]

      ;(MedicalHistoryService.getPatientMedicalHistory as Mock).mockResolvedValue(mockAllHistories)

      const result = await loadTurnMedicalHistory(params)

      expect(MedicalHistoryService.getPatientMedicalHistory).toHaveBeenCalledWith(
        'token123',
        'patient789'
      )
      expect(result).toEqual([mockAllHistories[1]]) // Only the history with turnId 'turn-456'
    })

    it('should return empty array when no medical history matches the turnId', async () => {
      const params = {
        accessToken: 'token123',
        turnId: 'turn-nonexistent',
        patientId: 'patient789'
      }

      const mockAllHistories = [
        {
          id: 'history-1',
          content: 'History for turn 1',
          patientId: 'patient789',
          patientName: 'John',
          patientSurname: 'Doe',
          doctorId: 'doctor123',
          doctorName: 'Dr. Jane',
          doctorSurname: 'Smith',
          createdAt: '2023-10-08T10:00:00Z',
          updatedAt: '2023-10-08T10:00:00Z',
          turnId: 'turn-123'
        }
      ]

      ;(MedicalHistoryService.getPatientMedicalHistory as Mock).mockResolvedValue(mockAllHistories)

      const result = await loadTurnMedicalHistory(params)

      expect(result).toEqual([])
    })
  })

  describe('loadDoctorMetrics', () => {
    it('should call DoctorService.getDoctorMetrics with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456'
      }

      const mockMetrics = {
        totalPatients: 25,
        totalTurns: 150,
        completedTurns: 140,
        cancelledTurns: 10,
        averageRating: 4.5
      }

      ;(DoctorService.getDoctorMetrics as Mock).mockResolvedValue(mockMetrics)

      const result = await loadDoctorMetrics(params)

      expect(DoctorService.getDoctorMetrics).toHaveBeenCalledWith('token123', 'doctor456')
      expect(result).toEqual(mockMetrics)
    })
  })
})