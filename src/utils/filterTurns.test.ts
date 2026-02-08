import { describe, it, expect, vi } from 'vitest'
import { filterTurns, turnsOfTheMonth, upComingTurns, allPastTurnsThisMonth } from './filterTurns'

// Mock dayjs
vi.mock('./dayjs.config', () => {
  const mockDayjs = vi.fn()

  // Default current time: 2024-01-15 10:00 (middle of January 2024)
  let currentTime = '2024-01-15 10:00'

  const createMockInstance = (date?: any) => ({
    isBefore: vi.fn((other) => {
      if (!date) return false
      return new Date(date) < new Date(other || currentTime)
    }),
    isAfter: vi.fn((other) => {
      if (!date) return false
      return new Date(date) > new Date(other || currentTime)
    }),
    valueOf: vi.fn(() => date ? new Date(date).getTime() : new Date(currentTime).getTime()),
    month: vi.fn(() => date ? new Date(date).getMonth() : new Date(currentTime).getMonth()),
    year: vi.fn(() => date ? new Date(date).getFullYear() : new Date(currentTime).getFullYear()),
    date: vi.fn(() => date ? new Date(date).getDate() : new Date(currentTime).getDate()),
    tz: vi.fn().mockImplementation(function(this: any) {
      // Return the same instance to allow method chaining
      return this
    })
  })

  mockDayjs.mockImplementation((date?: any) => {
    return createMockInstance(date)
  })

  // Allow setting current time for tests
  ;(mockDayjs as any).__setCurrentTime = (time: string) => {
    currentTime = time
  }

  return { default: mockDayjs, __esModule: true }
})

describe('filterTurns', () => {
  const mockTurns = [
    {
      id: 1,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-16 10:00', // future
      patientName: 'John Doe'
    },
    {
      id: 2,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-14 10:00', // past
      patientName: 'Jane Smith'
    },
    {
      id: 3,
      status: 'CANCELED',
      scheduledAt: '2024-01-17 10:00', // future
      patientName: 'Bob Johnson'
    },
    {
      id: 4,
      status: 'COMPLETED',
      scheduledAt: '2024-01-15 09:00', // past
      patientName: 'Alice Brown'
    },
    {
      id: 5,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-18 10:00', // future
      patientName: 'Charlie Wilson'
    }
  ]

  it('should return all turns when no status filter is provided', () => {
    const result = filterTurns(mockTurns, null, null)
    expect(result).toHaveLength(5)
    expect(result.map((t: any) => t.id)).toEqual([1, 5, 2, 3, 4]) // sorted by priority and date ascending
  })

  it('should filter turns by status when statusFilter is provided', () => {
    const result = filterTurns(mockTurns, 'SCHEDULED', null)
    expect(result).toHaveLength(3)
    expect(result.every((turn: any) => turn.status === 'SCHEDULED')).toBe(true)
    expect(result.map((t: any) => t.id)).toEqual([1, 5, 2]) // future first ascending, then past ascending
  })

  it('should filter turns by CANCELED status', () => {
    const result = filterTurns(mockTurns, 'CANCELED', null)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(3)
  })

  it('should filter turns by COMPLETED status', () => {
    const result = filterTurns(mockTurns, 'COMPLETED', null)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(4)
  })

  it('should return empty array when no turns match the status filter', () => {
    const result = filterTurns(mockTurns, 'NONEXISTENT', null)
    expect(result).toEqual([])
  })

  it('should sort turns by status priority and scheduled date', () => {
    const result = filterTurns(mockTurns, null, null)

    // Expected order by priority:
    // 1. SCHEDULED (future) - id 1, then id 5 (ascending date order)
    // 2. SCHEDULED (past) - id 2
    // 3. CANCELED - id 3
    // 4. COMPLETED - id 4
    expect(result.map((t: any) => t.id)).toEqual([1, 5, 2, 3, 4])
  })

  it('should handle empty turns array', () => {
    const result = filterTurns([], null, null)
    expect(result).toEqual([])
  })

  it('should handle empty turns array with status filter', () => {
    const result = filterTurns([], 'SCHEDULED', null)
    expect(result).toEqual([])
  })

  it('should sort SCHEDULED turns with future dates first, then past dates', () => {
    const scheduledTurns = mockTurns.filter(t => t.status === 'SCHEDULED')
    const result = filterTurns(scheduledTurns, null, null)

    expect(result.map((t: any) => t.id)).toEqual([1, 5, 2]) // future dates first ascending (1, 5), then past (2)
  })

  it('should sort turns by scheduled date ascending within same status priority', () => {
    const futureScheduledTurns = [
      {
        id: 1,
        status: 'SCHEDULED',
        scheduledAt: '2024-01-16 10:00',
        patientName: 'Turn 1'
      },
      {
        id: 2,
        status: 'SCHEDULED',
        scheduledAt: '2024-01-18 10:00', // newer
        patientName: 'Turn 2'
      },
      {
        id: 3,
        status: 'SCHEDULED',
        scheduledAt: '2024-01-17 10:00', // in between
        patientName: 'Turn 3'
      }
    ]

    const result = filterTurns(futureScheduledTurns, null, null)
    expect(result.map((t: any) => t.id)).toEqual([1, 3, 2]) // sorted by date asc: 16, 17, 18
  })

  it('should handle turns with same scheduled date and status', () => {
    const sameDateTurns = [
      {
        id: 1,
        status: 'SCHEDULED',
        scheduledAt: '2024-01-16 10:00',
        patientName: 'Turn 1'
      },
      {
        id: 2,
        status: 'SCHEDULED',
        scheduledAt: '2024-01-16 10:00', // same date
        patientName: 'Turn 2'
      }
    ]

    const result = filterTurns(sameDateTurns, null, null)
    // When dates are equal, the sort is stable, so original order should be preserved
    expect(result).toHaveLength(2)
    expect(result.every((t: any) => t.status === 'SCHEDULED')).toBe(true)
  })
})

describe('turnsOfTheMonth', () => {
  const mockTurns = [
    {
      id: 1,
      status: 'COMPLETED',
      scheduledAt: '2024-01-10 10:00', // Past in January
      patientName: 'John Doe'
    },
    {
      id: 2,
      status: 'CANCELED',
      scheduledAt: '2024-01-12 10:00', // Past in January
      patientName: 'Jane Smith'
    },
    {
      id: 3,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-16 10:00', // Future in January
      patientName: 'Bob Johnson'
    },
    {
      id: 4,
      status: 'COMPLETED',
      scheduledAt: '2024-02-10 10:00', // Different month
      patientName: 'Alice Brown'
    }
  ]

  it('should count completed turns from current month that are past the current day', () => {
    const result = turnsOfTheMonth(mockTurns)
    expect(result).toBe(1) // Only turn id 1: COMPLETED, January, past current day (15)
  })

  it('should not count canceled turns', () => {
    const result = turnsOfTheMonth(mockTurns)
    expect(result).toBe(1) // Turn id 2 is CANCELED, so not counted
  })

  it('should not count turns from future days in current month', () => {
    const result = turnsOfTheMonth(mockTurns)
    expect(result).toBe(1) // Turn id 3 is SCHEDULED and future, so not counted
  })

  it('should not count turns from different months', () => {
    const result = turnsOfTheMonth(mockTurns)
    expect(result).toBe(1) // Turn id 4 is February, so not counted
  })

  it('should return 0 for empty turns array', () => {
    const result = turnsOfTheMonth([])
    expect(result).toBe(0)
  })

  it('should handle turns with different statuses correctly', () => {
    const mixedTurns = [
      { id: 1, status: 'COMPLETED', scheduledAt: '2024-01-10 10:00' },
      { id: 2, status: 'SCHEDULED', scheduledAt: '2024-01-10 10:00' },
      { id: 3, status: 'CANCELED', scheduledAt: '2024-01-10 10:00' },
      { id: 4, status: 'COMPLETED', scheduledAt: '2024-01-20 10:00' } // Future day
    ]

    const result = turnsOfTheMonth(mixedTurns)
    expect(result).toBe(2) // id 1 (COMPLETED) and id 2 (SCHEDULED): both past, current month, not CANCELED
  })
})

describe('upComingTurns', () => {
  const mockTurns = [
    {
      id: 1,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-16 10:00', // Future
      patientName: 'John Doe'
    },
    {
      id: 2,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-14 10:00', // Past
      patientName: 'Jane Smith'
    },
    {
      id: 3,
      status: 'COMPLETED',
      scheduledAt: '2024-01-16 10:00', // Future but completed
      patientName: 'Bob Johnson'
    },
    {
      id: 4,
      status: 'CANCELED',
      scheduledAt: '2024-01-16 10:00', // Future but canceled
      patientName: 'Alice Brown'
    }
  ]

  it('should count scheduled turns that are in the future', () => {
    const result = upComingTurns(mockTurns)
    expect(result).toBe(1) // Only turn id 1: SCHEDULED and future
  })

  it('should not count past scheduled turns', () => {
    const result = upComingTurns(mockTurns)
    expect(result).toBe(1) // Turn id 2 is past, so not counted
  })

  it('should not count completed turns even if future', () => {
    const result = upComingTurns(mockTurns)
    expect(result).toBe(1) // Turn id 3 is completed, so not counted
  })

  it('should not count canceled turns even if future', () => {
    const result = upComingTurns(mockTurns)
    expect(result).toBe(1) // Turn id 4 is canceled, so not counted
  })

  it('should return 0 for empty turns array', () => {
    const result = upComingTurns([])
    expect(result).toBe(0)
  })

  it('should handle multiple upcoming turns', () => {
    const upcomingTurns = [
      { id: 1, status: 'SCHEDULED', scheduledAt: '2024-01-16 10:00' },
      { id: 2, status: 'SCHEDULED', scheduledAt: '2024-01-17 10:00' },
      { id: 3, status: 'SCHEDULED', scheduledAt: '2024-01-18 10:00' }
    ]

    const result = upComingTurns(upcomingTurns)
    expect(result).toBe(3)
  })
})

describe('allPastTurnsThisMonth', () => {
  const mockTurns = [
    {
      id: 1,
      status: 'COMPLETED',
      scheduledAt: '2024-01-10 10:00', // Past in January
      patientName: 'John Doe'
    },
    {
      id: 2,
      status: 'CANCELED',
      scheduledAt: '2024-01-12 10:00', // Past in January
      patientName: 'Jane Smith'
    },
    {
      id: 3,
      status: 'SCHEDULED',
      scheduledAt: '2024-01-16 10:00', // Future in January
      patientName: 'Bob Johnson'
    },
    {
      id: 4,
      status: 'COMPLETED',
      scheduledAt: '2024-02-10 10:00', // Different month
      patientName: 'Alice Brown'
    },
    {
      id: 5,
      status: 'COMPLETED',
      scheduledAt: '2024-01-20 10:00', // Future day in January
      patientName: 'Charlie Wilson'
    }
  ]

  it('should count all non-canceled turns from current month that are past the current day', () => {
    const result = allPastTurnsThisMonth(mockTurns)
    expect(result).toBe(1) // Only turn id 1: COMPLETED, January, past current day (15)
  })

  it('should not count canceled turns', () => {
    const result = allPastTurnsThisMonth(mockTurns)
    expect(result).toBe(1) // Turn id 2 is CANCELED, so not counted
  })

  it('should not count turns from future days in current month', () => {
    const result = allPastTurnsThisMonth(mockTurns)
    expect(result).toBe(1) // Turns id 3 and 5 are future, so not counted
  })

  it('should not count turns from different months', () => {
    const result = allPastTurnsThisMonth(mockTurns)
    expect(result).toBe(1) // Turn id 4 is February, so not counted
  })

  it('should return 0 for empty turns array', () => {
    const result = allPastTurnsThisMonth([])
    expect(result).toBe(0)
  })

  it('should count multiple past turns in current month', () => {
    const pastTurns = [
      { id: 1, status: 'COMPLETED', scheduledAt: '2024-01-10 10:00' },
      { id: 2, status: 'COMPLETED', scheduledAt: '2024-01-12 10:00' },
      { id: 3, status: 'SCHEDULED', scheduledAt: '2024-01-10 10:00' } // SCHEDULED counts as non-canceled
    ]

    const result = allPastTurnsThisMonth(pastTurns)
    expect(result).toBe(3) // All three are past and non-canceled
  })
})