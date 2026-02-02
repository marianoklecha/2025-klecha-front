import { createMachine, assign, fromPromise } from "xstate";
import { orchestrator } from "#/core/Orchestrator";
import { FamilyMemberResponse } from "#/models/FamilyMember";
import { validateField } from "#/utils/MachineUtils/familyFormValidation";
import { createFamilyMember } from "#/utils/MachineUtils/familyMachineUtils";


export const FAMILY_MACHINE_ID = "family";
export const FAMILY_MACHINE_EVENT_TYPES = [
  "SET_AUTH",
  "LOGOUT",
  "LOAD_FAMILY_MEMBER",
  "SAVE_FAMILY_MEMBER",
  "UPDATE_FAMILY_MEMBER", 
  "CANCEL_FAMILY_MEMBER_EDIT",
  "UPDATE_FORM",
  "CLEAR_ERROR"
];

export interface FamilyMachineContext {
  familyMember: FamilyMemberResponse | null;
  updatingFamilyMember: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  userId: string | null;
  formValues: {
    name: string;
    surname: string;
    dni: string;
    gender: string;
    birthdate: string;
    relationship: string;
  };
  formErrors: Record<string, string>;
}

export const FamilyMachineDefaultContext: FamilyMachineContext = {
  familyMember: null,
  updatingFamilyMember: false,
  loading: false,
  error: null,
  accessToken: null,
  userId: null,
  formValues: {
    name: "",
    surname: "",
    dni: "",
    gender: "",
    birthdate: "",
    relationship: ""
  },
  formErrors: {},
};

export type FamilyMachineEvent =
  | { type: "SET_AUTH"; accessToken: string; userId: string; userRole?: string }
  | { type: "LOGOUT" }
  | { type: "LOAD_FAMILY_MEMBER" }
  | { type: "SAVE_FAMILY_MEMBER" }
  | { type: "UPDATE_FAMILY_MEMBER" }
  | { type: "CANCEL_FAMILY_MEMBER_EDIT"; key: string }
  | { type: "UPDATE_FORM"; key: string; value: any }
  | { type: "INIT_FAMILY_MEMBER_PAGE" }
  | { type: "CLEAR_ERROR" };

export const familyMachine = createMachine({
  id: "family",
  initial: "idle",
  context: FamilyMachineDefaultContext,
  types: {
    context: {} as FamilyMachineContext,
    events: {} as FamilyMachineEvent,
  },
  states: {
    idle: {
      on: {
        SET_AUTH: {
          actions: assign({
            accessToken: ({ event }) => event.accessToken,
            userId: ({ event }) => event.userId,
          }),
        },
        LOGOUT: {
          actions: assign(() => ({
            ...FamilyMachineDefaultContext,
          })),
        },
        LOAD_FAMILY_MEMBER: {
          target: "savingFamilyMember",
          guard: ({ context }) => !!context.accessToken && !!context.userId,
        },
        SAVE_FAMILY_MEMBER: {
          target: "savingFamilyMember", 
          guard: ({ context }) => {
            if(!context.accessToken || !context.userId) return false;
            
            const hasErrors = Object.values(context.formErrors).some(
                error => error && error.length > 0
            );

            const { name, surname, dni, gender, birthdate, relationship } = context.formValues;
            const allFieldsFilled = name != "" && surname != "" && dni != "" && gender != "" && birthdate != "" && relationship != "";
    
            return !hasErrors && allFieldsFilled;
            },
        },       
        UPDATE_FORM: {
          actions: assign(({ context, event }) => {

            const updatedFormValues = {
              ...context.formValues,
              [event.key]: event.value,
            };

            const updatedFormErrors = {...context.formErrors};
            updatedFormErrors[event.key] = validateField(event.key, event.value);

            return {
              formValues: updatedFormValues,
              formErrors: updatedFormErrors
            };
          }),
        },

        CANCEL_FAMILY_MEMBER_EDIT: {
          actions: assign(({ context, event }) => {
            if (!context.familyMember) return {};
            const originalValue = (context.familyMember as unknown as Record<string, unknown>)[event.key];
            const valueToRestore = originalValue === undefined ? "" : originalValue;
            return {
              formValues: {
                ...context.formValues,
                [event.key]: valueToRestore,
              },
              formErrors: {
                ...context.formErrors,
                [event.key]: "",
              },
            };
          }),
        },
        CLEAR_ERROR: {
          actions: assign({
            error: null,
          }),
        },
      },
    },

    savingFamilyMember: {
      entry: assign({
        loading: true,
        error: null,
      }),
      invoke: {
        src: fromPromise(async ({ input }: { 
            input: { 
                accessToken: string;
                userId: string;
                formValues: FamilyMachineContext['formValues']
            } }) => {
          return await createFamilyMember({
            accessToken: input.accessToken,
            userId: input.userId,
            formValues: input.formValues
          });
        }),
        input: ({ context }) => ({
          accessToken: context.accessToken!,
          userId: context.userId!,
          formValues: context.formValues
        }),
        onDone: {
          target: "idle",

          actions: [ 
            
            assign({
                loading: false,
                formValues: () => ({
                    name: "",
                    surname: "",
                    dni: "",
                    gender: "",
                    birthdate: "",
                    relationship: ""             
                }),
                formErrors: () => ({})
            }),

            () => {
                orchestrator.send('LOAD_MY_FAMILY');
            }
        ],
        },
        onError: {
          target: "idle",
          actions: assign({
            loading: false,
            error: ({ event }) =>
              event.error instanceof Error
                ? event.error.message
                : "Error al crear el familiar",
          }),
        },
      },
    },
  },
});