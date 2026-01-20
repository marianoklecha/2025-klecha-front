import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';

// Mock dependencies BEFORE importing the machine
vi.mock('#/core/Orchestrator', () => ({
  orchestrator: {
    send: vi.fn(),
    sendToMachine: vi.fn(),
    registerMachine: vi.fn(),
  }
}));

vi.mock('../utils/MachineUtils/profileMachineUtils', () => ({
  loadProfile: vi.fn(),
  updateProfile: vi.fn(),
  deactivateAccount: vi.fn(),
}));

import { profileMachine, ProfileMachineDefaultContext } from './profileMachine';
import { orchestrator } from '#/core/Orchestrator';
import { loadProfile, updateProfile, deactivateAccount } from '../utils/MachineUtils/profileMachineUtils';
import type { ProfileResponse } from '../models/Auth';

describe('profileMachine', () => {
  let actor: any;
  let mockOrchestrator: any;
  let mockProfileUtils: any;

  const mockProfile: ProfileResponse = {
    id: 'user-123',
    name: 'John',
    surname: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dni: '12345678',
    gender: 'M',
    birthdate: '1990-01-01',
    role: 'PATIENT',
    status: 'ACTIVE',
    specialty: null,
    medicalLicense: null,
    slotDurationMin: null,
  };

  beforeEach(() => {
    // Get mocked modules
    mockOrchestrator = vi.mocked(orchestrator);
    mockProfileUtils = vi.mocked({ loadProfile, updateProfile, deactivateAccount });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (actor) {
      actor.stop();
    }
  });

  describe('Initial State', () => {
    it('should start in idle state with default context', () => {
      actor = createActor(profileMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context).toEqual(ProfileMachineDefaultContext);
    });

    it('should set auth credentials via SET_AUTH event', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({
        type: 'SET_AUTH',
        accessToken: 'token-123',
        userId: 'user-123',
      });

      expect(actor.getSnapshot().context.accessToken).toBe('token-123');
      expect(actor.getSnapshot().context.userId).toBe('user-123');
    });
  });

  describe('SET_AUTH Event', () => {
    it('should set accessToken and userId in context', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({
        type: 'SET_AUTH',
        accessToken: 'new-token',
        userId: 'new-user-id',
      });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.accessToken).toBe('new-token');
      expect(snapshot.context.userId).toBe('new-user-id');
    });
  });

  describe('LOGOUT Event', () => {
    it('should reset context to default values', () => {
      actor = createActor(profileMachine, {
        input: {
          ...ProfileMachineDefaultContext,
          accessToken: 'token-123',
          userId: 'user-123',
          profile: mockProfile,
        }
      });
      actor.start();

      actor.send({ type: 'LOGOUT' });

      expect(actor.getSnapshot().context).toEqual(ProfileMachineDefaultContext);
    });
  });

  describe('UPDATE_FORM Event', () => {
    it('should update a single form field', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({
        type: 'UPDATE_FORM',
        key: 'name',
        value: 'Jane',
      });

      expect(actor.getSnapshot().context.formValues.name).toBe('Jane');
    });

    it('should update multiple form fields independently', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'UPDATE_FORM', key: 'name', value: 'Jane' });
      actor.send({ type: 'UPDATE_FORM', key: 'email', value: 'jane@example.com' });
      actor.send({ type: 'UPDATE_FORM', key: 'phone', value: '9876543210' });

      const formValues = actor.getSnapshot().context.formValues;
      expect(formValues.name).toBe('Jane');
      expect(formValues.email).toBe('jane@example.com');
      expect(formValues.phone).toBe('9876543210');
    });

    it('should handle doctor-specific fields', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'UPDATE_FORM', key: 'specialty', value: 'Cardiology' });
      actor.send({ type: 'UPDATE_FORM', key: 'medicalLicense', value: 'ML-12345' });
      actor.send({ type: 'UPDATE_FORM', key: 'slotDurationMin', value: 30 });

      const formValues = actor.getSnapshot().context.formValues;
      expect(formValues.specialty).toBe('Cardiology');
      expect(formValues.medicalLicense).toBe('ML-12345');
      expect(formValues.slotDurationMin).toBe(30);
    });
  });

  describe('CANCEL_PROFILE_EDIT Event', () => {
    it('should restore form field from profile data', async () => {
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);
      
      actor = createActor(profileMachine);
      actor.start();
      
      // Load profile first
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });
      
      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.profile).toEqual(mockProfile);
      });
      
      // Then modify and cancel
      actor.send({ type: 'UPDATE_FORM', key: 'name', value: 'Modified Name' });
      actor.send({ type: 'CANCEL_PROFILE_EDIT', key: 'name' });

      expect(actor.getSnapshot().context.formValues.name).toBe(mockProfile.name);
    });

    it('should handle missing profile data gracefully', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'CANCEL_PROFILE_EDIT', key: 'name' });

      // Should not crash, context remains unchanged
      expect(actor.getSnapshot().context.profile).toBeNull();
    });
  });

  describe('CLEAR_ERROR Event', () => {
    it('should clear error from context', async () => {
      mockProfileUtils.loadProfile.mockRejectedValue(new Error('Test error'));
      
      actor = createActor(profileMachine);
      actor.start();
      
      // Generate an error first
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });
      
      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.error).not.toBeNull();
      });

      actor.send({ type: 'CLEAR_ERROR' });

      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });

  describe('LOAD_PROFILE / SAVE_PROFILE Events', () => {
    it('should not transition if accessToken or userId is missing', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'LOAD_PROFILE' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to savingProfile when credentials are present', async () => {
      mockProfileUtils.loadProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('savingProfile');
      });
    });

    it('should load profile successfully and populate formValues', async () => {
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'SAVE_PROFILE' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.profile).toEqual(mockProfile);
        expect(snapshot.context.formValues.name).toBe(mockProfile.name);
        expect(snapshot.context.formValues.email).toBe(mockProfile.email);
        expect(snapshot.context.loading).toBe(false);
      });
    });

    it('should handle profile loading error', async () => {
      const errorMessage = 'Failed to load profile';
      mockProfileUtils.loadProfile.mockRejectedValue(new Error(errorMessage));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.error).toBe(errorMessage);
        expect(snapshot.context.loading).toBe(false);
      });
    });

    it('should set loading to true during profile fetch', async () => {
      mockProfileUtils.loadProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('savingProfile');
      });

      expect(actor.getSnapshot().context.loading).toBe(true);
    });
  });

  describe('UPDATE_PROFILE Event', () => {
    it('should not transition if accessToken or userId is missing', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'UPDATE_PROFILE' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to updatingProfile when credentials are present', async () => {
      mockProfileUtils.updateProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'UPDATE_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('updatingProfile');
      });
    });

    it('should update profile successfully and show success snackbar', async () => {
      const updatedProfile = { ...mockProfile, name: 'Jane' };
      mockProfileUtils.updateProfile.mockResolvedValue(updatedProfile);

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'UPDATE_FORM', key: 'name', value: 'Jane' });
      actor.send({ type: 'UPDATE_PROFILE' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.profile).toEqual(updatedProfile);
        expect(snapshot.context.updatingProfile).toBe(false);
      });

      expect(mockOrchestrator.sendToMachine).toHaveBeenCalledWith('ui', {
        type: 'OPEN_SNACKBAR',
        message: 'Perfil actualizado exitosamente',
        severity: 'success'
      });
    });

    it('should handle profile update error and show error snackbar', async () => {
      const errorMessage = 'Failed to update profile';
      mockProfileUtils.updateProfile.mockRejectedValue(new Error(errorMessage));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'UPDATE_PROFILE' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.error).toBe(errorMessage);
        expect(snapshot.context.updatingProfile).toBe(false);
      });

      expect(mockOrchestrator.sendToMachine).toHaveBeenCalledWith('ui', {
        type: 'OPEN_SNACKBAR',
        message: errorMessage,
        severity: 'error'
      });
    });

    it('should set updatingProfile flag during update', async () => {
      mockProfileUtils.updateProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'UPDATE_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('updatingProfile');
      });

      expect(actor.getSnapshot().context.updatingProfile).toBe(true);
    });
  });

  describe('DEACTIVATE_ACCOUNT Event', () => {
    it('should not transition if accessToken is missing', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'DEACTIVATE_ACCOUNT' });

      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition to deactivatingAccount when accessToken is present', async () => {
      mockProfileUtils.deactivateAccount.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'DEACTIVATE_ACCOUNT' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('deactivatingAccount');
      });
    });

    it('should deactivate account successfully and trigger logout', async () => {
      mockProfileUtils.deactivateAccount.mockResolvedValue(undefined);
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      // Load profile to set it in context
      actor.send({ type: 'LOAD_PROFILE' });
      
      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.profile).toEqual(mockProfile);
      });
      
      actor.send({ type: 'DEACTIVATE_ACCOUNT' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context).toEqual(ProfileMachineDefaultContext);
      });

      expect(mockOrchestrator.send).toHaveBeenCalledWith({ type: 'LOGOUT' });
      expect(mockOrchestrator.sendToMachine).toHaveBeenCalledWith('ui', {
        type: 'OPEN_SNACKBAR',
        message: 'Cuenta desactivada exitosamente',
        severity: 'success'
      });
    });

    it('should handle account deactivation error and show error snackbar', async () => {
      const errorMessage = 'Failed to deactivate account';
      mockProfileUtils.deactivateAccount.mockRejectedValue(new Error(errorMessage));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'DEACTIVATE_ACCOUNT' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.error).toBe(errorMessage);
        expect(snapshot.context.loading).toBe(false);
      });

      expect(mockOrchestrator.sendToMachine).toHaveBeenCalledWith('ui', {
        type: 'OPEN_SNACKBAR',
        message: errorMessage,
        severity: 'error'
      });
    });

    it('should set loading flag during deactivation', async () => {
      mockProfileUtils.deactivateAccount.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(undefined), 100)));

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'DEACTIVATE_ACCOUNT' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('deactivatingAccount');
      });

      expect(actor.getSnapshot().context.loading).toBe(true);
    });
  });

  describe('INIT_PROFILE_PAGE Event (Global)', () => {
    it('should trigger LOAD_PROFILE when credentials are available', async () => {
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'INIT_PROFILE_PAGE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.profile).toEqual(mockProfile);
      });
    });

    it('should not trigger LOAD_PROFILE when credentials are missing', () => {
      actor = createActor(profileMachine);
      actor.start();

      actor.send({ type: 'INIT_PROFILE_PAGE' });

      expect(actor.getSnapshot().context.profile).toBeNull();
    });
  });

  describe('Context Persistence', () => {
    it('should preserve profile data after form updates', async () => {
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);
      
      actor = createActor(profileMachine);
      actor.start();
      
      // Load profile first
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });
      
      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.profile).toEqual(mockProfile);
      });
      
      actor.send({ type: 'UPDATE_FORM', key: 'name', value: 'Modified Name' });

      expect(actor.getSnapshot().context.profile).toEqual(mockProfile);
      expect(actor.getSnapshot().context.formValues.name).toBe('Modified Name');
    });

    it('should maintain accessToken through state transitions', async () => {
      mockProfileUtils.loadProfile.mockResolvedValue(mockProfile);

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'persistent-token', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.accessToken).toBe('persistent-token');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error objects in profile loading', async () => {
      mockProfileUtils.loadProfile.mockRejectedValue('String error');

      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.value).toBe('idle');
        expect(snapshot.context.error).toBe('Error al cargar el perfil');
      });
    });

    it('should clear previous errors when starting new operation', async () => {
      // First, create an error
      mockProfileUtils.loadProfile.mockRejectedValueOnce(new Error('Previous error'));
      
      actor = createActor(profileMachine);
      actor.start();
      
      actor.send({ type: 'SET_AUTH', accessToken: 'token-123', userId: 'user-123' });
      actor.send({ type: 'LOAD_PROFILE' });
      
      await vi.waitFor(() => {
        expect(actor.getSnapshot().context.error).toBe('Previous error');
      });
      
      // Now retry with a delayed success
      mockProfileUtils.loadProfile.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(mockProfile), 100)));
      actor.send({ type: 'LOAD_PROFILE' });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('savingProfile');
      });

      expect(actor.getSnapshot().context.error).toBeNull();
    });
  });
});
