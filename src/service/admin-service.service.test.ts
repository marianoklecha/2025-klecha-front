import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdminService } from './admin-service.service'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock API config
vi.mock('../../../config/api', () => ({
  API_CONFIG: {
    ENDPOINTS: {
      GET_PENDING_DOCTORS: '/api/admin/pending-doctors',
      APPROVE_DOCTOR: '/api/admin/approve-doctor',
      REJECT_DOCTOR: '/api/admin/reject-doctor',
      GET_ADMIN_STATS: '/api/admin/stats',
      GET_ADMIN_RATINGS: '/api/admin/ratings',
      GET_SPECIALTIES: '/api/admin/specialties'
    }
  },
  buildApiUrl: vi.fn((endpoint: string) => `http://localhost:8080${endpoint}`),
  getAuthenticatedFetchOptions: vi.fn((accessToken: string) => ({
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    signal: AbortSignal.timeout(10000)
  }))
}))

describe('AdminService', () => {
  const mockAccessToken = 'mock-access-token'
  const mockDoctorId = 'doctor-123'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getPendingDoctors', () => {
    it('should successfully fetch pending doctors', async () => {
      const mockPendingDoctors = [
        { id: '1', name: 'Dr. Smith', email: 'smith@example.com' },
        { id: '2', name: 'Dr. Johnson', email: 'johnson@example.com' }
      ]

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockPendingDoctors)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.getPendingDoctors(mockAccessToken)

      expect(result).toEqual(mockPendingDoctors)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/admin/pending-doctors',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should throw error when response is not ok', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Internal server error' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.getPendingDoctors(mockAccessToken))
        .rejects
        .toThrow('Internal server error')
    })

    it('should throw error with default message when response has no error details', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({})
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.getPendingDoctors(mockAccessToken))
        .rejects
        .toThrow('Failed to fetch pending doctors! Status: 404')
    })

    it('should throw error when fetch fails', async () => {
      const networkError = new Error('Network error')
      mockFetch.mockRejectedValue(networkError)

      await expect(AdminService.getPendingDoctors(mockAccessToken))
        .rejects
        .toThrow('Network error')
    })

    it('should throw error when response.json() fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('JSON parse error'))
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.getPendingDoctors(mockAccessToken))
        .rejects
        .toThrow('Failed to fetch pending doctors! Status: 400')
    })
  })

  describe('approveDoctor', () => {
    it('should successfully approve doctor', async () => {
      const mockApprovalResponse = {
        success: true,
        message: 'Doctor approved successfully'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApprovalResponse)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.approveDoctor(mockDoctorId, mockAccessToken)

      expect(result).toEqual(mockApprovalResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8080/api/admin/approve-doctor/${mockDoctorId}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should throw error when approval fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ error: 'Unauthorized' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.approveDoctor(mockDoctorId, mockAccessToken))
        .rejects
        .toThrow('Unauthorized')
    })

    it('should throw error when fetch fails during approval', async () => {
      mockFetch.mockRejectedValue(new Error('Connection failed'))

      await expect(AdminService.approveDoctor(mockDoctorId, mockAccessToken))
        .rejects
        .toThrow('Connection failed')
    })
  })

  describe('rejectDoctor', () => {
    it('should successfully reject doctor', async () => {
      const mockRejectionResponse = {
        success: true,
        message: 'Doctor rejected successfully'
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockRejectionResponse)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.rejectDoctor(mockDoctorId, mockAccessToken)

      expect(result).toEqual(mockRejectionResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:8080/api/admin/reject-doctor/${mockDoctorId}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should throw error when rejection fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({ message: 'Doctor not found' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.rejectDoctor(mockDoctorId, mockAccessToken))
        .rejects
        .toThrow('Doctor not found')
    })
  })

  describe('getAdminStats', () => {
    it('should successfully fetch admin stats', async () => {
      const mockStats = {
        patients: 150,
        doctors: 25,
        pending: 5,
        familyMembers: 0
      }

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockStats)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.getAdminStats(mockAccessToken)

      expect(result).toEqual(mockStats)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/admin/stats',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should return default stats when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await AdminService.getAdminStats(mockAccessToken)

      expect(result).toEqual({
        patients: 0,
        doctors: 0,
        pending: 0,
        familyMembers: 0
      })
    })

    it('should return default stats when response is not ok', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ message: 'Server error' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      const result = await AdminService.getAdminStats(mockAccessToken)

      expect(result).toEqual({
        patients: 0,
        doctors: 0,
        pending: 0,
        familyMembers: 0
      })
    })

    it('should return default stats when response.json() fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockRejectedValue(new Error('Parse error'))
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      const result = await AdminService.getAdminStats(mockAccessToken)

      expect(result).toEqual({
        patients: 0,
        doctors: 0,
        pending: 0,
        familyMembers: 0
      })
    })
  })

  describe('getAdminRatings', () => {
    it('should successfully fetch admin ratings', async () => {
      const mockRatings = [
        { doctorId: '1', rating: 4.5, comments: 'Good doctor' },
        { doctorId: '2', rating: 3.8, comments: 'Decent service' }
      ]

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockRatings)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.getAdminRatings(mockAccessToken)

      expect(result).toEqual(mockRatings)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/admin/ratings',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should throw error when ratings fetch fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 403,
        json: vi.fn().mockResolvedValue({ message: 'Access denied' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.getAdminRatings(mockAccessToken))
        .rejects
        .toThrow('Access denied')
    })

    it('should throw error when network fails during ratings fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'))

      await expect(AdminService.getAdminRatings(mockAccessToken))
        .rejects
        .toThrow('Network timeout')
    })
  })

  describe('getSpecialties', () => {
    it('should successfully fetch specialties', async () => {
      const mockSpecialties = ['Cardiology', 'Dermatology', 'Pediatrics']

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockSpecialties)
      }

      mockFetch.mockResolvedValue(mockResponse)

      const result = await AdminService.getSpecialties(mockAccessToken)

      expect(result).toEqual(mockSpecialties)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/doctors/specialties',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockAccessToken}`
          })
        })
      )
    })

    it('should throw error when specialties fetch fails', async () => {
      const mockErrorResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue({ error: 'Database error' })
      }

      mockFetch.mockResolvedValue(mockErrorResponse)

      await expect(AdminService.getSpecialties(mockAccessToken))
        .rejects
        .toThrow('Database error')
    })

    it('should throw error when network fails during specialties fetch', async () => {
      mockFetch.mockRejectedValue(new Error('Connection lost'))

      await expect(AdminService.getSpecialties(mockAccessToken))
        .rejects
        .toThrow('Connection lost')
    })
  })
})