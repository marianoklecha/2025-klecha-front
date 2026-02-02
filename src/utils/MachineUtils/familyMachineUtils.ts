import { FamilyMachineContext } from "#/machines/familyMachine"
import { FamilyMemberCreateRequest, FamilyMemberResponse } from "#/models/FamilyMember";
import { FamilyMemberService } from "#/service/family-service.service";


export interface CreateFamilyMemberParams {
    accessToken: string,
    userId: string,
    formValues: FamilyMachineContext['formValues'];
}

export const createFamilyMember = async ({
    accessToken,
    userId,
    formValues
}: CreateFamilyMemberParams): Promise<FamilyMemberResponse> => {
    const createData: FamilyMemberCreateRequest = {
        holderId: userId,
        name: formValues.name,
        surname: formValues.surname,
        birthdate: formValues.birthdate,
        gender: formValues.gender,
        dni: formValues.dni,
        relationship: formValues.relationship
    };

    return await FamilyMemberService.createFamilyMember(createData, accessToken);
}