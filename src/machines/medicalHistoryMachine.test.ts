import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import type { MedicalHistory } from '../models/MedicalHistory';

// Mock dependencies BEFORE importing the machine
vi.mock('#/core/Orchestrator', () => ({
  orchestrator: {
    send: vi.fn(),
    sendToMachine: vi.fn(),
    registerMachine: vi.fn(),
  }
}));

vi.mock('../service/medical-history-service.service', () => ({
  MedicalHistoryService: {
    getPatientMedicalHistory: vi.fn(),
    getPatientMedicalHistoryByDoctor: vi.fn(),
    addMedicalHistory: vi.fn(),
    updateMedicalHistory: vi.fn(),
    deleteMedicalHistory: vi.fn()
  }
}));

import { medicalHistoryMachine } from './medicalHistoryMachine';
import { MedicalHistoryService } from '../service/medical-history-service.service';

describe('medicalHistoryMachine', () => {
  let actor: any;
  
  const mockMedicalHistory: MedicalHistory = {
    id: 'history-1',
    content: 'Patient has allergies to penicillin',
    patientId: 'patient-1',
    patientName: 'John',
    patientSurname: 'Doe',
    doctorId: 'doctor-1',
    doctorName: 'Dr. Jane',
    doctorSurname: 'Smith',
    turnId: 'turn-1',
    createdAt: '2023-10-08T10:00:00Z',
    updatedAt: '2023-10-08T10:00:00Z'
  };

  const mockHistories: MedicalHistory[] = [
    mockMedicalHistory,
    {
      id: 'history-2',
      content: 'Patient underwent surgery',
      patientId: 'patient-1',
      patientName: 'John',
      patientSurname: 'Doe',
      doctorId: 'doctor-1',
      doctorName: 'Dr. Jane',
      doctorSurname: 'Smith',
      turnId: 'turn-2',
      createdAt: '2023-10-07T09:00:00Z',
      updatedAt: '2023-10-07T09:00:00Z'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    actor = createActor(medicalHistoryMachine);
    actor.start();
  });

  afterEach(() => {
    actor?.stop();
    vi.resetAllMocks();
  });

  describe('Initial State', () => {
    it('should start in idle state with correct initial context', () => {
      expect(actor.getSnapshot().value).toBe('idle');
      expect(actor.getSnapshot().context).toEqual({
        medicalHistories: [],
        currentPatientId: null,
        currentTurnId: null,
        currentTurnInfo: null,
        patientTurns: [],
        error: null,
        isLoading: false,
        selectedHistory: null,
        newHistoryContent: '',
        editingContent: '',
        accessToken: null,
        doctorId: null
      });
    });
  });

  describe('LOAD_PATIENT_MEDICAL_HISTORY', () => {
    it('should transition to loading state and load medical histories successfully', async () => {
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce(mockHistories);

      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      // Should immediately transition to loading
      expect(actor.getSnapshot().value).toBe('loadingMedicalHistory');
      expect(actor.getSnapshot().context.isLoading).toBe(true);
      expect(actor.getSnapshot().context.currentPatientId).toBe('patient-1');

      // Wait for async operation to complete
      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.medicalHistories).toEqual(mockHistories);
      expect(actor.getSnapshot().context.isLoading).toBe(false);
      expect(actor.getSnapshot().context.error).toBe(null);
      expect(MedicalHistoryService.getPatientMedicalHistory).toHaveBeenCalledWith('token-123', 'patient-1');
    });

    it('should handle loading medical histories failure', async () => {
      const errorMessage = 'Failed to load medical histories';
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockRejectedValueOnce(new Error(errorMessage));

      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.error).toBe(null);
      expect(actor.getSnapshot().context.isLoading).toBe(false);
      expect(actor.getSnapshot().context.medicalHistories).toEqual([]);
    });
  });

  describe('ADD_HISTORY_ENTRY_FOR_TURN', () => {
    it('should add new medical history entry successfully', async () => {
      vi.mocked(MedicalHistoryService.addMedicalHistory).mockResolvedValueOnce(mockMedicalHistory);

      // First set up context
      actor.send({ type: 'SET_NEW_CONTENT', content: 'New medical history' });

      actor.send({
        type: 'ADD_HISTORY_ENTRY_FOR_TURN',
        turnId: 'turn-1',
        content: 'New medical history',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      expect(actor.getSnapshot().value).toBe('addingMedicalHistoryForTurn');
      expect(actor.getSnapshot().context.isLoading).toBe(true);

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.medicalHistories).toContain(mockMedicalHistory);
      expect(actor.getSnapshot().context.isLoading).toBe(false);
      expect(actor.getSnapshot().context.error).toBe(null);
      expect(actor.getSnapshot().context.newHistoryContent).toBe('');
    });

    it('should handle adding medical history failure', async () => {
      const errorMessage = 'Failed to add medical history';
      vi.mocked(MedicalHistoryService.addMedicalHistory).mockRejectedValueOnce(new Error(errorMessage));

      actor.send({
        type: 'ADD_HISTORY_ENTRY_FOR_TURN',
        turnId: 'turn-1',
        content: 'New medical history',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.error).toBe('Error al agregar historia médica al turno: Error: Failed to add medical history');
      expect(actor.getSnapshot().context.isLoading).toBe(false);
    });
  });

  describe('UPDATE_HISTORY_ENTRY', () => {
    it('should update medical history entry successfully', async () => {
      const updatedHistory = { ...mockMedicalHistory, content: 'Updated content' };
      vi.mocked(MedicalHistoryService.updateMedicalHistory).mockResolvedValueOnce(updatedHistory);

      // First load histories properly using the machine
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce([mockMedicalHistory]);
      
      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      // Now update the history
      actor.send({
        type: 'UPDATE_HISTORY_ENTRY',
        historyId: 'history-1',
        content: 'Updated content',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      expect(actor.getSnapshot().value).toBe('updatingMedicalHistory');
      expect(actor.getSnapshot().context.isLoading).toBe(true);

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.isLoading).toBe(false);
      expect(actor.getSnapshot().context.error).toBe(null);
      expect(MedicalHistoryService.updateMedicalHistory).toHaveBeenCalledWith(
        'token-123',
        'doctor-1',
        'history-1',
        { content: 'Updated content' }
      );
    });

    it('should handle updating medical history failure', async () => {
      const errorMessage = 'Failed to update medical history';
      vi.mocked(MedicalHistoryService.updateMedicalHistory).mockRejectedValueOnce(new Error(errorMessage));

      // First load histories properly using the machine
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce([mockMedicalHistory]);
      
      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      // Now try to update the history
      actor.send({
        type: 'UPDATE_HISTORY_ENTRY',
        historyId: 'history-1',
        content: 'Updated content',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.error).toBe('Error actualizando la historia médica: Error: Failed to update medical history');
      expect(actor.getSnapshot().context.isLoading).toBe(false);
    });
  });

  describe('DELETE_HISTORY_ENTRY', () => {
    it('should delete medical history entry successfully', async () => {
      vi.mocked(MedicalHistoryService.deleteMedicalHistory).mockResolvedValueOnce(undefined);

      // First load histories properly using the machine
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce(mockHistories);
      
      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      // Now delete the history
      actor.send({
        type: 'DELETE_HISTORY_ENTRY',
        historyId: 'history-1',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      expect(actor.getSnapshot().value).toBe('deletingMedicalHistory');
      expect(actor.getSnapshot().context.isLoading).toBe(true);

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.isLoading).toBe(false);
      expect(actor.getSnapshot().context.error).toBe(null);
      expect(MedicalHistoryService.deleteMedicalHistory).toHaveBeenCalledWith(
        'token-123',
        'doctor-1',
        'history-1'
      );
    });

    it('should handle deleting medical history failure', async () => {
      const errorMessage = 'Failed to delete medical history';
      vi.mocked(MedicalHistoryService.deleteMedicalHistory).mockRejectedValueOnce(new Error(errorMessage));

      // First load histories properly using the machine
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce([mockMedicalHistory]);
      
      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      // Now try to delete the history
      actor.send({
        type: 'DELETE_HISTORY_ENTRY',
        historyId: 'history-1',
        accessToken: 'token-123',
        doctorId: 'doctor-1'
      });

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });

      expect(actor.getSnapshot().context.error).toBe('Error al eliminar historia médica: Error: Failed to delete medical history');
      expect(actor.getSnapshot().context.isLoading).toBe(false);
    });
  });

  describe('Content Management', () => {
    it('should handle SET_NEW_CONTENT event', () => {
      const newContent = 'This is new medical history content';
      actor.send({ type: 'SET_NEW_CONTENT', content: newContent });

      expect(actor.getSnapshot().context.newHistoryContent).toBe(newContent);
    });

    it('should handle SET_EDIT_CONTENT event', () => {
      const editContent = 'This is edited medical history content';
      actor.send({ type: 'SET_EDIT_CONTENT', content: editContent });

      expect(actor.getSnapshot().context.editingContent).toBe(editContent);
    });

    it('should handle SELECT_HISTORY event', () => {
      actor.send({ type: 'SELECT_HISTORY', history: mockMedicalHistory });

      expect(actor.getSnapshot().context.selectedHistory).toEqual(mockMedicalHistory);
    });

    it('should handle CLEAR_SELECTION event', () => {
      // First select a history
      actor.send({ type: 'SELECT_HISTORY', history: mockMedicalHistory });
      expect(actor.getSnapshot().context.selectedHistory).toEqual(mockMedicalHistory);

      // Then clear the selection
      actor.send({ type: 'CLEAR_SELECTION' });
      expect(actor.getSnapshot().context.selectedHistory).toBe(null);
    });

    it('should handle CLEAR_ERROR event', () => {
      // First set an error (simulate by manually setting context)
      actor.getSnapshot().context.error = 'Some error message';

      actor.send({ type: 'CLEAR_ERROR' });
      expect(actor.getSnapshot().context.error).toBe(null);
    });
  });

  describe('State Transitions', () => {
    it('should maintain idle state when no async operations are running', () => {
      expect(actor.getSnapshot().value).toBe('idle');

      actor.send({ type: 'SET_NEW_CONTENT', content: 'test' });
      expect(actor.getSnapshot().value).toBe('idle');

      actor.send({ type: 'OPEN_ADD_DIALOG' });
      expect(actor.getSnapshot().value).toBe('idle');

      actor.send({ type: 'CLEAR_ERROR' });
      expect(actor.getSnapshot().value).toBe('idle');
    });

    it('should transition through correct states during operations', async () => {
      vi.mocked(MedicalHistoryService.getPatientMedicalHistory).mockResolvedValueOnce(mockHistories);

      expect(actor.getSnapshot().value).toBe('idle');

      actor.send({
        type: 'LOAD_PATIENT_MEDICAL_HISTORY',
        patientId: 'patient-1',
        accessToken: 'token-123'
      });

      expect(actor.getSnapshot().value).toBe('loadingMedicalHistory');

      await vi.waitFor(() => {
        expect(actor.getSnapshot().value).toBe('idle');
      });
    });
  });
});