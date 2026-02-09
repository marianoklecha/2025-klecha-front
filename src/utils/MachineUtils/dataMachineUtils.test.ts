import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import {
  loadDoctors,
  loadPendingDoctors,
  loadAdminStats,
  loadAvailableTurns,
  loadMyTurns,
  loadDoctorModifyRequests,
  loadSpecialties,
  loadMyModifyRequests,
  loadRatingSubcategories,
  loadAdminRatings,
  loadRatedSubcategoryCounts
} from './dataMachineUtils'
import { AdminService } from '../../service/admin-service.service'
import { TurnService } from '../../service/turn-service.service'

// Mock the services
vi.mock('../../service/admin-service.service', () => ({
  AdminService: {
    getPendingDoctors: vi.fn(),
    getAdminStats: vi.fn(),
    getSpecialties: vi.fn(),
    getAdminRatings: vi.fn()
  }
}))

vi.mock('../../service/turn-service.service', () => ({
  TurnService: {
    getDoctors: vi.fn(),
    getAvailableTurns: vi.fn(),
    getMyTurns: vi.fn(),
    getDoctorModifyRequests: vi.fn(),
    getSpecialties: vi.fn(),
    getMyModifyRequests: vi.fn(),
    getRatingSubcategories: vi.fn(),
    getRatedSubcategoryCounts: vi.fn()
  }
}))

describe('dataMachineUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadDoctors', () => {
    it('should call TurnService.getDoctors with correct parameters', async () => {
      const params = { accessToken: 'token123' }
      const mockDoctors = [
        { id: 'doc1', name: 'Dr. Smith' },
        { id: 'doc2', name: 'Dr. Johnson' }
      ]
      ;(TurnService.getDoctors as Mock).mockResolvedValue(mockDoctors)

      const result = await loadDoctors(params)

      expect(TurnService.getDoctors).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockDoctors)
    })
  })

  describe('loadPendingDoctors', () => {
    it('should return pending doctors when user is admin', async () => {
      const params = { accessToken: 'token123', isAdmin: true }
      const mockPendingDoctors = [
        { id: 'doc1', name: 'Dr. Smith', status: 'PENDING' }
      ]
      ;(AdminService.getPendingDoctors as Mock).mockResolvedValue(mockPendingDoctors)

      const result = await loadPendingDoctors(params)

      expect(AdminService.getPendingDoctors).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockPendingDoctors)
    })

    it('should return empty array when user is not admin', async () => {
      const params = { accessToken: 'token123', isAdmin: false }

      const result = await loadPendingDoctors(params)

      expect(AdminService.getPendingDoctors).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('loadAdminStats', () => {
    it('should return admin stats when user is admin', async () => {
      const params = { accessToken: 'token123', isAdmin: true }
      const mockStats = { patients: 100, doctors: 20, pending: 5, familyMembers: 0}
      ;(AdminService.getAdminStats as Mock).mockResolvedValue(mockStats)

      const result = await loadAdminStats(params)

      expect(AdminService.getAdminStats).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockStats)
    })

    it('should return default stats when user is not admin', async () => {
      const params = { accessToken: 'token123', isAdmin: false }

      const result = await loadAdminStats(params)

      expect(AdminService.getAdminStats).not.toHaveBeenCalled()
      expect(result).toEqual({ patients: 0, doctors: 0, pending: 0, familyMembers: 0 })
    })
  })

  describe('loadAvailableTurns', () => {
    it('should call TurnService.getAvailableTurns with correct parameters', async () => {
      const params = {
        accessToken: 'token123',
        doctorId: 'doctor456',
        date: '2024-01-01'
      }
      const mockSlots = ['10:00', '11:00', '14:00']
      ;(TurnService.getAvailableTurns as Mock).mockResolvedValue(mockSlots)

      const result = await loadAvailableTurns(params)

      expect(TurnService.getAvailableTurns).toHaveBeenCalledWith('doctor456', '2024-01-01', 'token123')
      expect(result).toEqual(['10:00', '11:00', '14:00'])
    })
  })

  describe('loadMyTurns', () => {
    it('should call TurnService.getMyTurns with status', async () => {
      const params = { accessToken: 'token123', status: 'CONFIRMED' }
      const mockTurns = [
        { id: 'turn1', status: 'CONFIRMED' },
        { id: 'turn2', status: 'CONFIRMED' }
      ]
      ;(TurnService.getMyTurns as Mock).mockResolvedValue(mockTurns)

      const result = await loadMyTurns(params)

      expect(TurnService.getMyTurns).toHaveBeenCalledWith('token123', 'CONFIRMED')
      expect(result).toEqual(mockTurns)
    })

    it('should call TurnService.getMyTurns without status', async () => {
      const params = { accessToken: 'token123' }
      const mockTurns = [
        { id: 'turn1', status: 'CONFIRMED' },
        { id: 'turn2', status: 'PENDING' }
      ]
      ;(TurnService.getMyTurns as Mock).mockResolvedValue(mockTurns)

      const result = await loadMyTurns(params)

      expect(TurnService.getMyTurns).toHaveBeenCalledWith('token123', undefined)
      expect(result).toEqual(mockTurns)
    })
  })

  describe('loadDoctorModifyRequests', () => {
    it('should return modify requests when doctorId is provided', async () => {
      const params = { accessToken: 'token123', doctorId: 'doctor456' }
      const mockRequests = [
        { id: 'req1', status: 'PENDING' },
        { id: 'req2', status: 'APPROVED' }
      ]
      ;(TurnService.getDoctorModifyRequests as Mock).mockResolvedValue(mockRequests)

      const result = await loadDoctorModifyRequests(params)

      expect(TurnService.getDoctorModifyRequests).toHaveBeenCalledWith('doctor456', 'token123')
      expect(result).toEqual(mockRequests)
    })

    it('should return empty array when doctorId is not provided', async () => {
      const params = { accessToken: 'token123', doctorId: '' }

      const result = await loadDoctorModifyRequests(params)

      expect(TurnService.getDoctorModifyRequests).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should return empty array when doctorId is undefined', async () => {
      const params = { accessToken: 'token123', doctorId: undefined as any }

      const result = await loadDoctorModifyRequests(params)

      expect(TurnService.getDoctorModifyRequests).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })
  })

  describe('loadSpecialties', () => {
    it('should call AdminService.getSpecialties with correct parameters', async () => {
      const params = { accessToken: 'token123' }
      const mockSpecialties = ['Cardiology', 'Dermatology', 'Neurology']
      ;(AdminService.getSpecialties as Mock).mockResolvedValue(mockSpecialties)

      const result = await loadSpecialties(params)

      expect(AdminService.getSpecialties).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockSpecialties)
    })
  })

  describe('loadMyModifyRequests', () => {
    it('should call TurnService.getMyModifyRequests with correct parameters', async () => {
      const params = { accessToken: 'token123' }
      const mockRequests = [
        { id: 'req1', status: 'PENDING' },
        { id: 'req2', status: 'APPROVED' }
      ]
      ;(TurnService.getMyModifyRequests as Mock).mockResolvedValue(mockRequests)

      const result = await loadMyModifyRequests(params)

      expect(TurnService.getMyModifyRequests).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockRequests)
    })
  })

  describe('loadRatingSubcategories', () => {
    it('should call TurnService.getRatingSubcategories with role and accessToken', async () => {
      const params = { role: 'DOCTOR', accessToken: 'token123' }
      const mockSubcategories = ['Punctuality', 'Communication', 'Professionalism']
      ;(TurnService.getRatingSubcategories as Mock).mockResolvedValue(mockSubcategories)

      const result = await loadRatingSubcategories(params)

      expect(TurnService.getRatingSubcategories).toHaveBeenCalledWith('DOCTOR', 'token123')
      expect(result).toEqual(mockSubcategories)
    })

    it('should call TurnService.getRatingSubcategories with undefined role', async () => {
      const params = { accessToken: 'token123' }
      const mockSubcategories = ['Cleanliness', 'Waiting Time']
      ;(TurnService.getRatingSubcategories as Mock).mockResolvedValue(mockSubcategories)

      const result = await loadRatingSubcategories(params)

      expect(TurnService.getRatingSubcategories).toHaveBeenCalledWith(undefined, 'token123')
      expect(result).toEqual(mockSubcategories)
    })

    it('should call TurnService.getRatingSubcategories without accessToken', async () => {
      const params = { role: 'PATIENT' }
      const mockSubcategories = ['Staff Courtesy', 'Facility']
      ;(TurnService.getRatingSubcategories as Mock).mockResolvedValue(mockSubcategories)

      const result = await loadRatingSubcategories(params)

      expect(TurnService.getRatingSubcategories).toHaveBeenCalledWith('PATIENT', undefined)
      expect(result).toEqual(mockSubcategories)
    })
  })

  describe('loadAdminRatings', () => {
    it('should return admin ratings when user is admin', async () => {
      const params = { accessToken: 'token123', isAdmin: true }
      const mockRatings = {
        allRatings: [{ id: 1, rating: 5 }],
        patientRatings: [{ id: 2, rating: 4 }],
        doctorRatings: [{ id: 3, rating: 3 }],
        stats: { average: 4.2, total: 10 }
      }
      ;(AdminService.getAdminRatings as Mock).mockResolvedValue(mockRatings)

      const result = await loadAdminRatings(params)

      expect(AdminService.getAdminRatings).toHaveBeenCalledWith('token123')
      expect(result).toEqual(mockRatings)
    })

    it('should return default ratings when user is not admin', async () => {
      const params = { accessToken: 'token123', isAdmin: false }

      const result = await loadAdminRatings(params)

      expect(AdminService.getAdminRatings).not.toHaveBeenCalled()
      expect(result).toEqual({
        allRatings: [],
        patientRatings: [],
        doctorRatings: [],
        stats: null
      })
    })
  })

  describe('loadRatedSubcategoryCounts', () => {
    it('should aggregate and sort subcategory counts correctly', async () => {
      const params = { doctorIds: ['doc1', 'doc2'], accessToken: 'token123' }
      const mockCounts1 = [
        { subcategory: 'Punctuality', count: 5 },
        { subcategory: 'Communication', count: 3 },
        { subcategory: 'Punctuality - Timeliness', count: 2 }
      ]
      const mockCounts2 = [
        { subcategory: null, count: 1 },
        { subcategory: 'Professionalism', count: 4 }
      ]

      ;(TurnService.getRatedSubcategoryCounts as Mock)
        .mockResolvedValueOnce(mockCounts1)
        .mockResolvedValueOnce(mockCounts2)

      const result = await loadRatedSubcategoryCounts(params)

      expect(TurnService.getRatedSubcategoryCounts).toHaveBeenCalledWith('doc1', 'token123')
      expect(TurnService.getRatedSubcategoryCounts).toHaveBeenCalledWith('doc2', 'token123')

      expect(result).toEqual({
        doc1: [
          { subcategory: 'Punctuality', count: 7 }, // 5 + 2 aggregated
          { subcategory: 'Communication', count: 3 },
          { subcategory: 'Timeliness', count: 2 }
        ],
        doc2: [
          { subcategory: 'Professionalism', count: 4 },
          { subcategory: null, count: 1 }
        ]
      })
    })

    it('should handle empty doctorIds array', async () => {
      const params = { doctorIds: [], accessToken: 'token123' }

      const result = await loadRatedSubcategoryCounts(params)

      expect(TurnService.getRatedSubcategoryCounts).not.toHaveBeenCalled()
      expect(result).toEqual({})
    })

    it('should handle service errors gracefully', async () => {
      const params = { doctorIds: ['doc1'], accessToken: 'token123' }

      ;(TurnService.getRatedSubcategoryCounts as Mock).mockRejectedValue(new Error('Service error'))

      const result = await loadRatedSubcategoryCounts(params)

      expect(result).toEqual({
        doc1: []
      })
    })

    it('should sort subcategories by count descending', async () => {
      const params = { doctorIds: ['doc1'], accessToken: 'token123' }
      const mockCounts = [
        { subcategory: 'Low Count', count: 1 },
        { subcategory: 'High Count', count: 10 },
        { subcategory: 'Medium Count', count: 5 }
      ]

      ;(TurnService.getRatedSubcategoryCounts as Mock).mockResolvedValue(mockCounts)

      const result = await loadRatedSubcategoryCounts(params)

      expect(result.doc1).toEqual([
        { subcategory: 'High Count', count: 10 },
        { subcategory: 'Medium Count', count: 5 },
        { subcategory: 'Low Count', count: 1 }
      ])
    })

    it('should limit results to top 3 subcategories per doctor', async () => {
      const params = { doctorIds: ['doc1'], accessToken: 'token123' }
      const mockCounts = [
        { subcategory: 'Cat1', count: 10 },
        { subcategory: 'Cat2', count: 9 },
        { subcategory: 'Cat3', count: 8 },
        { subcategory: 'Cat4', count: 7 },
        { subcategory: 'Cat5', count: 6 }
      ]

      ;(TurnService.getRatedSubcategoryCounts as Mock).mockResolvedValue(mockCounts)

      const result = await loadRatedSubcategoryCounts(params)

      expect(result.doc1).toHaveLength(3)
      expect(result.doc1.map(item => item.subcategory)).toEqual(['Cat1', 'Cat2', 'Cat3'])
    })
  })
})