import { createMachine, assign, fromPromise } from "xstate";
import { approveDoctor, rejectDoctor } from "../utils/MachineUtils/adminUserMachineUtils";
import { orchestrator } from "#/core/Orchestrator";
import type { PendingDoctor, DoctorApprovalResponse } from "#/models/Admin";
import { DATA_MACHINE_ID } from "./dataMachine";
import { UI_MACHINE_ID } from "./uiMachine";

export const ADMIN_USER_MACHINE_ID = "adminUser";
export const ADMIN_USER_MACHINE_EVENT_TYPES = [
  'DATA_LOADED',
  'LOADING',
  'APPROVE_DOCTOR', 
  'REJECT_DOCTOR',
  'SELECT_DOCTOR',
  'CLEAR_SELECTION',
  'CLEAR_ERROR',
  'RETRY_LAST_OPERATION',
  'SELECT_FILTER_DOCTOR',
  'SELECT_FILTER_PATIENT'
];

export interface AdminUserMachineContext {
  loading: boolean;
  error: string | null;
  pendingDoctors: PendingDoctor[];
  adminStats: {
    patients: number;
    doctors: number;
    pending: number;
    familyMembers: number;
    specialties: string[];
  };
  adminRatings: any;
  lastOperation: {
    type: 'approve' | 'reject' | null;
    doctorId?: string;
    success?: boolean;
    message?: string;
  } | null;
  selectedDoctor?: PendingDoctor | null;
  selectedFilterDoctorId: string;
  selectedFilterPatientId: string;
}

export const AdminUserMachineDefaultContext: AdminUserMachineContext = {
  loading: true,
  error: null,
  pendingDoctors: [],
  adminStats: {
    patients: 0,
    doctors: 0,
    pending: 0,
    familyMembers: 0,
    specialties:[]
  },
  adminRatings: null,
  lastOperation: null,
  selectedDoctor: null,
  selectedFilterDoctorId: 'all',
  selectedFilterPatientId: 'all',
};

export type AdminUserMachineEvent =
  | { type: "DATA_LOADED" }
  | { type: "LOADING" }
  | { type: "APPROVE_DOCTOR"; doctorId: string; accessToken: string }
  | { type: "REJECT_DOCTOR"; doctorId: string; accessToken: string }
  | { type: "SELECT_DOCTOR"; doctor: PendingDoctor }
  | { type: "CLEAR_SELECTION" }
  | { type: "CLEAR_ERROR" }
  | { type: "RETRY_LAST_OPERATION"; accessToken: string }
  | { type: "SELECT_FILTER_DOCTOR"; doctorId: string }
  | { type: "SELECT_FILTER_PATIENT"; patientId: string };

export const adminUserMachine = createMachine({
  id: "adminUser",
  initial: "idle",
  context: AdminUserMachineDefaultContext,
  types: {
    context: {} as AdminUserMachineContext,
    events: {} as AdminUserMachineEvent,
  },
  states: {
    idle: {
      on: {
        DATA_LOADED: {
          actions: assign(() => {
            try {
              const dataSnapshot = orchestrator.getSnapshot(DATA_MACHINE_ID);
              const dataContext = dataSnapshot.context;
              return {
                pendingDoctors: dataContext.pendingDoctors || [],
                adminStats: { 
                  patients: dataContext.adminStats?.patients || 0, 
                  doctors: dataContext.adminStats?.doctors || 0, 
                  pending: dataContext.adminStats?.pending || 0,
                  familyMembers: dataContext.adminStats?.familyMembers || 0,
                  specialties: dataContext.specialties || []
                },
                adminRatings: dataContext.adminRatings || null,
                loading: false
              };
            } catch (error) {
              console.warn("Could not get dataMachine snapshot:", error);
              return {};
            }
          })
        },
        LOADING: {
          actions: assign(() => ({ loading: true, error: null }))
        },
        APPROVE_DOCTOR: {
          target: "approvingDoctor"
        },
        REJECT_DOCTOR: {
          target: "rejectingDoctor"
        },
        SELECT_DOCTOR: {
          actions: assign(({ event }) => ({
            selectedDoctor: event.doctor
          }))
        },
        CLEAR_SELECTION: {
          actions: assign(() => ({
            selectedDoctor: null
          }))
        },
        CLEAR_ERROR: {
          actions: assign(() => ({
            error: null,
            lastOperation: null
          }))
        },
        RETRY_LAST_OPERATION: {
          target: "retryingOperation"
        },
        SELECT_FILTER_DOCTOR: {
          actions: assign(({ event }) => ({
            selectedFilterDoctorId: event.doctorId
          }))
        },
        SELECT_FILTER_PATIENT: {
          actions: assign(({ event }) => ({
            selectedFilterPatientId: event.patientId
          }))
        }
      }
    },

    approvingDoctor: {
      entry: assign(() => ({
        loading: true,
        error: null
      })),
      invoke: {
        src: fromPromise(async ({ input }: { input: { doctorId: string; accessToken: string } }) => {
          return await approveDoctor(input);
        }),
        input: ({ event }) => ({
          doctorId: (event as any).doctorId,
          accessToken: (event as any).accessToken
        }),
        onDone: {
          target: "idle",
          actions: [
            assign(({ event, context }) => {
              const approvalResponse = event.output as DoctorApprovalResponse;
              const updatedPendingDoctors = context.pendingDoctors.filter(
                doctor => doctor.id !== approvalResponse.doctorId
              );
              return {
                loading: false,
                pendingDoctors: updatedPendingDoctors,
                adminStats: {
                  ...context.adminStats,
                  pending: updatedPendingDoctors.length,
                  doctors: context.adminStats.doctors + 1
                },
                lastOperation: {
                  type: 'approve' as const,
                  doctorId: approvalResponse.doctorId,
                  success: true,
                  message: approvalResponse.message
                },
                selectedDoctor: null
              };
            }),
            ({ event }) => {
              const approvalResponse = event.output as DoctorApprovalResponse;
              orchestrator.sendToMachine(UI_MACHINE_ID, {
                type: "OPEN_SNACKBAR",
                message: `Doctor aprobado exitosamente: ${approvalResponse.message}`,
                severity: "success"
              });
              
      
              orchestrator.sendToMachine(DATA_MACHINE_ID, {
                type: "RELOAD_DOCTORS"
              });
              orchestrator.sendToMachine(DATA_MACHINE_ID, {
                type: "RELOAD_SPECIALTIES" 
              });
            }
          ],
        },
        onError: {
          target: "idle",
          actions: [
            assign(({ event }) => ({
              loading: false,
              error: event.error instanceof Error ? event.error.message : 'Error al aprobar doctor',
              lastOperation: {
                type: 'approve' as const,
                success: false,
                message: 'Error al aprobar doctor'
              }
            })),
            ({ event }) => {
              const errorMessage = event.error instanceof Error ? event.error.message : 'Error al aprobar doctor';
              orchestrator.sendToMachine(UI_MACHINE_ID, {
                type: "OPEN_SNACKBAR",
                message: errorMessage,
                severity: "error"
              });
            }
          ],
        }
      }
    },

    rejectingDoctor: {
      entry: assign(() => ({
        loading: true,
        error: null
      })),
      invoke: {
        src: fromPromise(async ({ input }: { input: { doctorId: string; accessToken: string } }) => {
          return await rejectDoctor(input);
        }),
        input: ({ event }) => ({
          doctorId: (event as any).doctorId,
          accessToken: (event as any).accessToken
        }),
        onDone: {
          target: "idle",
          actions: [
            assign(({ event, context }) => {
              const rejectionResponse = event.output as DoctorApprovalResponse;
              const updatedPendingDoctors = context.pendingDoctors.filter(
                doctor => doctor.id !== rejectionResponse.doctorId
              );
              return {
                loading: false,
                pendingDoctors: updatedPendingDoctors,
                adminStats: {
                  ...context.adminStats,
                  pending: updatedPendingDoctors.length
                },
                lastOperation: {
                  type: 'reject' as const,
                  doctorId: rejectionResponse.doctorId,
                  success: true,
                  message: rejectionResponse.message
                },
                selectedDoctor: null
              };
            }),
            ({ event }) => {
              const rejectionResponse = event.output as DoctorApprovalResponse;
              orchestrator.sendToMachine(UI_MACHINE_ID, {
                type: "OPEN_SNACKBAR",
                message: `Doctor rechazado exitosamente: ${rejectionResponse.message}`,
                severity: "success"
              });
              
      
              orchestrator.sendToMachine(DATA_MACHINE_ID, {
                type: "RELOAD_DOCTORS"
              });
              orchestrator.sendToMachine(DATA_MACHINE_ID, {
                type: "RELOAD_SPECIALTIES" 
              });
            }
          ],
        },
        onError: {
          target: "idle",
          actions: [
            assign(({ event }) => ({
              loading: false,
              error: event.error instanceof Error ? event.error.message : 'Error al rechazar doctor',
              lastOperation: {
                type: 'reject' as const,
                success: false,
                message: 'Error al rechazar doctor'
              }
            })),
            ({ event }) => {
              const errorMessage = event.error instanceof Error ? event.error.message : 'Error al rechazar doctor';
              orchestrator.sendToMachine(UI_MACHINE_ID, {
                type: "OPEN_SNACKBAR",
                message: errorMessage,
                severity: "error"
              });
            }
          ],
        }
      }
    },

    retryingOperation: {
      entry: assign(() => ({
        loading: true,
        error: null
      })),
      always: [
        {
          target: "approvingDoctor",
          guard: ({ context }) => context.lastOperation?.type === 'approve' && !!context.lastOperation?.doctorId
        },
        {
          target: "rejectingDoctor",
          guard: ({ context }) => context.lastOperation?.type === 'reject' && !!context.lastOperation?.doctorId
        },
        {
          target: "idle"
        }
      ]
    }
  }
});
