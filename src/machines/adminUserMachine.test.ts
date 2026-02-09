import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';

// Mock dependencies BEFORE importing the machine
vi.mock('#/core/Orchestrator', () => ({
  orchestrator: {
    getSnapshot: vi.fn(),
    sendToMachine: vi.fn(),
  }
}));

vi.mock('../utils/MachineUtils/adminUserMachineUtils', () => ({
  approveDoctor: vi.fn(),
  rejectDoctor: vi.fn()
}));

vi.mock('./dataMachine', () => ({
  DATA_MACHINE_ID: 'dataMachine'
}));

vi.mock('./uiMachine', () => ({
  UI_MACHINE_ID: 'uiMachine'
}));

import { adminUserMachine } from './adminUserMachine';
import { orchestrator } from '#/core/Orchestrator';

describe('adminUserMachine', () => {
  let actor: any;
  let mockOrchestrator: any;

  beforeEach(() => {
    vi.useFakeTimers(); // Enable fake timers for all tests
    // Get mocked modules
    mockOrchestrator = vi.mocked(orchestrator);

    // Reset mocks
    vi.clearAllMocks();

    // Setup default mocks
    mockOrchestrator.getSnapshot.mockReturnValue({
      context: {
        pendingDoctors: [],
        adminStats: { patients: 0, doctors: 0, pending: 0, familyMembers: 0, specialties: [] }
      }
    });
  });

  afterEach(() => {
    if (actor) {
      actor.stop();
    }
  });

  describe('initial state', () => {
    it('should start in idle state', () => {
      actor = createActor(adminUserMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should initialize with default context', () => {
      actor = createActor(adminUserMachine);
      actor.start();

      const context = actor.getSnapshot().context;
      expect(context.loading).toBe(true);
      expect(context.error).toBe(null);
      expect(context.pendingDoctors).toEqual([]);
      expect(context.adminStats).toEqual({ patients: 0, doctors: 0, pending: 0, familyMembers: 0, specialties: [] });
      expect(context.lastOperation).toBe(null);
      expect(context.selectedDoctor).toBe(null);
    });
  });

  describe('idle state', () => {
    beforeEach(() => {
      actor = createActor(adminUserMachine);
      actor.start();
    });

    it('should handle DATA_LOADED event', () => {
      const mockData = {
        pendingDoctors: [
          { id: '1', name: 'Dr. Smith', email: 'smith@test.com' }
        ],
        adminStats: { patients: 10, doctors: 5, pending: 1, familyMembers: 0, specialties: [] }
      };

      mockOrchestrator.getSnapshot.mockReturnValue({
        context: mockData
      });

      actor.send({ type: 'DATA_LOADED' });

      expect(actor.getSnapshot().context.pendingDoctors).toEqual(mockData.pendingDoctors);
      expect(actor.getSnapshot().context.adminStats).toEqual(mockData.adminStats);
    });

    it('should handle APPROVE_DOCTOR event', () => {
      actor.send({ type: 'APPROVE_DOCTOR', doctorId: '123', accessToken: 'token' });

      expect(actor.getSnapshot().value).toBe('approvingDoctor');
      expect(actor.getSnapshot().context.loading).toBe(true);
      expect(actor.getSnapshot().context.error).toBe(null);
    });

    it('should handle REJECT_DOCTOR event', () => {
      actor.send({ type: 'REJECT_DOCTOR', doctorId: '123', accessToken: 'token' });

      expect(actor.getSnapshot().value).toBe('rejectingDoctor');
      expect(actor.getSnapshot().context.loading).toBe(true);
      expect(actor.getSnapshot().context.error).toBe(null);
    });

    it('should handle SELECT_DOCTOR event', () => {
      const doctor = { id: '1', name: 'Dr. Smith', email: 'smith@test.com' };

      actor.send({ type: 'SELECT_DOCTOR', doctor });

      expect(actor.getSnapshot().context.selectedDoctor).toEqual(doctor);
    });

    it('should handle CLEAR_SELECTION event', () => {
      // First select a doctor
      const doctor = { id: '1', name: 'Dr. Smith', email: 'smith@test.com' };
      actor.send({ type: 'SELECT_DOCTOR', doctor });
      expect(actor.getSnapshot().context.selectedDoctor).toEqual(doctor);

      // Then clear selection
      actor.send({ type: 'CLEAR_SELECTION' });

      expect(actor.getSnapshot().context.selectedDoctor).toBe(null);
    });

    it('should handle CLEAR_ERROR event', () => {
      // Set up some error state
      actor = createActor(adminUserMachine, {
        input: {
          loading: false,
          error: 'Some error occurred',
          pendingDoctors: [],
          adminStats: { patients: 0, doctors: 0, pending: 0, familyMembers: 0, specialties: [] },
          lastOperation: {
            type: 'approve',
            doctorId: '123',
            success: false,
            message: 'Failed to approve'
          },
          selectedDoctor: null
        }
      });
      actor.start();

      // Clear error
      actor.send({ type: 'CLEAR_ERROR' });

      expect(actor.getSnapshot().context.error).toBe(null);
      expect(actor.getSnapshot().context.lastOperation).toBe(null);
    });

    it('should handle DATA_LOADED with error in orchestrator', () => {
      mockOrchestrator.getSnapshot.mockImplementation(() => {
        throw new Error('Could not get snapshot');
      });

      actor.send({ type: 'DATA_LOADED' });

      // Should not crash and maintain existing state
      expect(actor.getSnapshot().value).toBe('idle');
    });
  });

  describe('approvingDoctor state', () => {
    beforeEach(() => {
      actor = createActor(adminUserMachine);
      actor.start();
      actor.send({ type: 'APPROVE_DOCTOR', doctorId: '123', accessToken: 'token' });
    });

    it('should set loading to true on entry', () => {
      expect(actor.getSnapshot().context.loading).toBe(true);
      expect(actor.getSnapshot().context.error).toBe(null);
    });
  });

  describe('rejectingDoctor state', () => {
    beforeEach(() => {
      actor = createActor(adminUserMachine);
      actor.start();
      actor.send({ type: 'REJECT_DOCTOR', doctorId: '456', accessToken: 'token' });
    });

    it('should set loading to true on entry', () => {
      expect(actor.getSnapshot().context.loading).toBe(true);
      expect(actor.getSnapshot().context.error).toBe(null);
    });
  });

  describe('context management', () => {
    it('should maintain context across state transitions', () => {
      actor = createActor(adminUserMachine);
      actor.start();

      // Select a doctor
      const doctor = { id: '1', name: 'Dr. Smith', email: 'smith@test.com' };
      actor.send({ type: 'SELECT_DOCTOR', doctor });

      expect(actor.getSnapshot().context.selectedDoctor).toEqual(doctor);

      // Load data
      const mockData = {
        pendingDoctors: [{ id: '1', name: 'Dr. Smith', email: 'smith@test.com' }],
        adminStats: { patients: 10, doctors: 5, pending: 1, familyMembers: 0, specialties: [] }
      };
      mockOrchestrator.getSnapshot.mockReturnValue({
        context: mockData
      });
      actor.send({ type: 'DATA_LOADED' });

      expect(actor.getSnapshot().context.pendingDoctors).toEqual(mockData.pendingDoctors);
      expect(actor.getSnapshot().context.adminStats).toEqual(mockData.adminStats);
      // selectedDoctor should still be there
      expect(actor.getSnapshot().context.selectedDoctor).toEqual(doctor);
    });
  });
});