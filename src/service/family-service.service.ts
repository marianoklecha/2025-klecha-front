import { API_CONFIG, buildApiUrl, getAuthenticatedFetchOptions } from '../../config/api';

import type {
  FamilyMemberCreateRequest,
  FamilyMemberResponse,
  ApiErrorResponse
} from '../models/FamilyMember';

export class FamilyMemberService {
  static async createFamilyMember(
    data: FamilyMemberCreateRequest, 
    accessToken: string
  ): Promise<FamilyMemberResponse> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.CREATE_FAMILY_MEMBER);
    
    try {
      const fetchOptions = {
        ...getAuthenticatedFetchOptions(accessToken),
        method: 'POST',
        body: JSON.stringify(data),
      };
      
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        
        throw new Error(
          errorData?.message || 
          errorData?.error ||
          `Failed to create family member! Status: ${response.status}`
        );
      }

      const result: FamilyMemberResponse = await response.json();
      
      return result;
    } catch (error) {
      throw error;
    }
  }
  
  static async getMyFamily(
    accessToken: string
  ): Promise<FamilyMemberResponse[]> {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.GET_MY_FAMILY);
    try {
      const response = await  fetch(url, {
        ...getAuthenticatedFetchOptions(accessToken),
        method: 'GET',
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json().catch(() => ({}));
        console.error('[FamilyService] getMyFamily - Error:', errorData);
        throw new Error(
          errorData?.message || 
          errorData?.error ||
          `Failed to fetch my family! Status: ${response.status}`
        );
      }
      const result: FamilyMemberResponse[] = await response.json();
      return result;
    } catch (error) {
        console.error('[FamilyService] getMyFamily - Exception:', error);
      throw error;
    }
  }
}