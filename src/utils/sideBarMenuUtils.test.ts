import { describe, it, expect, vi } from 'vitest'
import {
  getDoctorMenuItems,
  getPatientMenuItems,
  getAdminMenuItems,
  getMenuItems,
  getUserDisplayName,
  iconMap
} from './sideBarMenuUtils'

// Mock MUI icons
vi.mock('@mui/icons-material', () => ({
  Dashboard: vi.fn(),
  People: vi.fn(),
  CalendarToday: vi.fn(),
  Schedule: vi.fn(),
  Notifications: vi.fn(),
  Person: vi.fn(),
  ExitToApp: vi.fn(),
  BarChart: vi.fn(),
  EditCalendar: vi.fn(),
  MarkEmailUnread: vi.fn(),
  CalendarMonth: vi.fn(),
  EmojiEvents: vi.fn(),
  WorkspacePremium: vi.fn(),
  Group: vi.fn()
}))

describe('sideBarMenuUtils', () => {
  const mockHandleLogout = vi.fn()

  describe('iconMap', () => {
    it('should contain all required icon mappings', () => {
      expect(iconMap.Dashboard).toBeDefined()
      expect(iconMap.People).toBeDefined()
      expect(iconMap.CalendarMonth).toBeDefined()
      expect(iconMap.Schedule).toBeDefined()
      expect(iconMap.Notifications).toBeDefined()
      expect(iconMap.Person).toBeDefined()
      expect(iconMap.ExitToApp).toBeDefined()
      expect(iconMap.BarChart).toBeDefined()
      expect(iconMap.WorkspacePremium).toBeDefined()
    })
  })

  describe('getDoctorMenuItems', () => {
    it('should return correct menu items for doctor', () => {
      const menuItems = getDoctorMenuItems(mockHandleLogout)

      expect(menuItems).toHaveLength(9)
      expect(menuItems[0]).toEqual({
        id: 'dashboard',
        title: 'Inicio',
        iconComponent: expect.any(Function),
        path: '/'
      })
      expect(menuItems[1]).toEqual({
        id: 'patients',
        title: 'Pacientes',
        iconComponent: expect.any(Function),
        path: '/doctor/view-patients'
      })
      expect(menuItems[2]).toEqual({
        id: 'turns',
        title: 'Mis Turnos',
        iconComponent: expect.any(Function),
        path: '/doctor/view-turns'
      })
      expect(menuItems[3]).toEqual({
        id: 'availability',
        title: 'Disponibilidad',
        iconComponent: expect.any(Function),
        path: '/doctor/enable-hours'
      })
      expect(menuItems[4]).toEqual({
        id: 'requests',
        title: 'Solicitudes',
        iconComponent: expect.any(Function),
        path: '/doctor/turns-modifications'
      })
      expect(menuItems[5]).toEqual({
        id: 'metrics',
        title: 'Métricas',
        iconComponent: expect.any(Function),
        path: '/doctor/metrics'
      })
      expect(menuItems[6]).toEqual({
        id: 'badges',
        title: 'Logros',
        iconComponent: expect.any(Function),
        path: '/doctor/badges'
      })
      expect(menuItems[7]).toEqual({
        id: 'profile',
        title: 'Mi Perfil',
        iconComponent: expect.any(Function),
        path: '/profile'
      })
      expect(menuItems[8]).toEqual({
        id: 'logout',
        title: 'Cerrar Sesión',
        iconComponent: expect.any(Function),
        path: '',
        action: mockHandleLogout
      })
    })

    it('should include logout action in the last menu item', () => {
      const menuItems = getDoctorMenuItems(mockHandleLogout)
      const logoutItem = menuItems[menuItems.length - 1]

      expect(logoutItem.action).toBe(mockHandleLogout)
      expect(logoutItem.id).toBe('logout')
    })
  })

  describe('getPatientMenuItems', () => {
    it('should return correct menu items for patient', () => {
      const menuItems = getPatientMenuItems(mockHandleLogout)

      expect(menuItems).toHaveLength(7)
      expect(menuItems[0]).toEqual({
        id: 'dashboard',
        title: 'Inicio',
        iconComponent: expect.any(Function),
        path: '/'
      })
      expect(menuItems[3]).toEqual({
        id: 'reservation',
        title: 'Nuevo Turno',
        iconComponent: expect.any(Function),
        path: '/patient/reservation-turns'
      })
      expect(menuItems[2]).toEqual({
        id: 'turns',
        title: 'Mis Turnos',
        iconComponent: expect.any(Function),
        path: '/patient/view-turns'
      })
      expect(menuItems[5]).toEqual({
        id: 'badges',
        title: 'Logros',
        iconComponent: expect.any(Function),
        path: '/patient/badges'
      })
      expect(menuItems[1]).toEqual({
        id: 'profile',
        title: 'Mi Perfil',
        iconComponent: expect.any(Function),
        path: '/profile'
      })
      expect(menuItems[6]).toEqual({
        id: 'logout',
        title: 'Cerrar Sesión',
        iconComponent: expect.any(Function),
        path: '',
        action: mockHandleLogout
      })
    })

    it('should include logout action in the last menu item', () => {
      const menuItems = getPatientMenuItems(mockHandleLogout)
      const logoutItem = menuItems[menuItems.length - 1]

      expect(logoutItem.action).toBe(mockHandleLogout)
      expect(logoutItem.id).toBe('logout')
    })
  })

  describe('getAdminMenuItems', () => {
    it('should return correct menu items for admin', () => {
      const menuItems = getAdminMenuItems(mockHandleLogout)

      expect(menuItems).toHaveLength(6)
      expect(menuItems[0]).toEqual({
        id: 'dashboard',
        title: 'Inicio',
        iconComponent: expect.any(Function),
        path: '/'
      })
      expect(menuItems[1]).toEqual({
        id: 'pending',
        title: 'Solicitudes Pendientes',
        iconComponent: expect.any(Function),
        path: '/admin/pending'
      })
      expect(menuItems[2]).toEqual({
        id: 'patients',
        title: 'Pacientes',
        iconComponent: expect.any(Function),
        path: '/admin/patients'
      })
      expect(menuItems[3]).toEqual({
        id: 'doctors',
        title: 'Doctores',
        iconComponent: expect.any(Function),
        path: '/admin/doctors'
      })
      expect(menuItems[4]).toEqual({
        id: 'profile',
        title: 'Mi Perfil',
        iconComponent: expect.any(Function),
        path: '/profile'
      })
      expect(menuItems[5]).toEqual({
        id: 'logout',
        title: 'Cerrar Sesión',
        iconComponent: expect.any(Function),
        path: '',
        action: mockHandleLogout
      })
    })

    it('should include logout action in the last menu item', () => {
      const menuItems = getAdminMenuItems(mockHandleLogout)
      const logoutItem = menuItems[menuItems.length - 1]

      expect(logoutItem.action).toBe(mockHandleLogout)
      expect(logoutItem.id).toBe('logout')
    })
  })

  describe('getMenuItems', () => {
    it('should return doctor menu items for DOCTOR role', () => {
      const result = getMenuItems('DOCTOR', mockHandleLogout)
      const doctorMenu = getDoctorMenuItems(mockHandleLogout)

      expect(result).toEqual(doctorMenu)
      expect(result).toHaveLength(9)
    })

    it('should return patient menu items for PATIENT role', () => {
      const result = getMenuItems('PATIENT', mockHandleLogout)
      const patientMenu = getPatientMenuItems(mockHandleLogout)

      expect(result).toEqual(patientMenu) 
      expect(result).toHaveLength(7)
    })

    it('should return admin menu items for ADMIN role', () => {
      const result = getMenuItems('ADMIN', mockHandleLogout)
      const adminMenu = getAdminMenuItems(mockHandleLogout)

      expect(result).toEqual(adminMenu)
      expect(result).toHaveLength(6)
    })

    it('should return doctor menu items by default for unknown role', () => {
      const result = getMenuItems('UNKNOWN' as any, mockHandleLogout)
      const doctorMenu = getDoctorMenuItems(mockHandleLogout)

      expect(result).toEqual(doctorMenu)
    })
  })

  describe('getUserDisplayName', () => {
    it('should format doctor name with "Dr." prefix', () => {
      const user = { name: 'John Doe', role: 'DOCTOR' }
      const result = getUserDisplayName(user)

      expect(result).toBe('Dr. John Doe')
    })

    it('should format admin name with "Admin" prefix', () => {
      const user = { name: 'Jane Smith', role: 'ADMIN' }
      const result = getUserDisplayName(user)

      expect(result).toBe('Admin Jane Smith')
    })

    it('should return patient name without prefix', () => {
      const user = { name: 'Bob Johnson', role: 'PATIENT' }
      const result = getUserDisplayName(user)

      expect(result).toBe('Bob Johnson')
    })

    it('should return name without prefix for unknown role', () => {
      const user = { name: 'Alice Brown', role: 'UNKNOWN' }
      const result = getUserDisplayName(user)

      expect(result).toBe('Alice Brown')
    })

    it('should handle empty name', () => {
      const user = { name: '', role: 'DOCTOR' }
      const result = getUserDisplayName(user)

      expect(result).toBe('Dr. ')
    })

    it('should handle undefined role', () => {
      const user = { name: 'Test User', role: undefined }
      const result = getUserDisplayName(user)

      expect(result).toBe('Test User')
    })
  })
})