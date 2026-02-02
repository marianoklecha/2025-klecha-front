import { AdminService } from "../../service/admin-service.service";
import { TurnService } from "../../service/turn-service.service";
import type { PendingDoctor, AdminStats } from "../../models/Admin";
import type { Doctor } from "../../models/Turn";
import { FamilyMemberService } from "#/service/family-service.service";

export interface LoadDoctorsParams {
  accessToken: string;
}

export interface LoadPendingDoctorsParams {
  accessToken: string;
  isAdmin: boolean;
}

export interface LoadAdminStatsParams {
  accessToken: string;
  isAdmin: boolean;
}

export interface LoadAvailableTurnsParams {
  accessToken: string;
  doctorId: string;
  date: string;
}

export interface LoadMyTurnsParams {
  accessToken: string;
  status?: string;
}

export interface LoadMyFamilyParams {
  accessToken: string;
}

export interface LoadDoctorModifiyRequestsParams {
  accessToken: string;
  doctorId: string;
}

export interface LoadMyModifyRequestsParams {
  accessToken: string;
}

export interface LoadSpecialtiesParams {
  accessToken: string;
}





export interface LoadRatingSubcategoriesParams {
  role?: string;
  accessToken?: string;
}

export interface LoadAdminRatingsParams {
  accessToken: string;
  isAdmin: boolean;
}

export const loadDoctors = async ({ accessToken }: LoadDoctorsParams): Promise<Doctor[]> => {
  return await TurnService.getDoctors(accessToken);
};

/**
 * Load all specialties
 */
export const loadSpecialties = async ({ accessToken }: LoadSpecialtiesParams): Promise<string[]> => {
  return await AdminService.getSpecialties(accessToken);
};

export const loadPendingDoctors = async ({ accessToken, isAdmin }: LoadPendingDoctorsParams): Promise<PendingDoctor[]> => {
  if (!isAdmin) return [];
  return await  AdminService.getPendingDoctors(accessToken);
};

export const loadAdminStats = async ({ accessToken, isAdmin }: LoadAdminStatsParams): Promise<AdminStats> => {
  if (!isAdmin) return { patients: 0, doctors: 0, pending: 0 };
  return await  AdminService.getAdminStats(accessToken)
};

export const loadAvailableTurns = async ({ accessToken, doctorId, date }: LoadAvailableTurnsParams): Promise<string[]> => {
  const result = await TurnService.getAvailableTurns(doctorId, date, accessToken);
  return result;
};

export const loadMyTurns = async ({ accessToken, status }: LoadMyTurnsParams): Promise<any[]> => {
  return await TurnService.getMyTurns(accessToken, status);
};

export const loadMyFamily = async ({ accessToken }: LoadMyFamilyParams): Promise<any[]> => {
  return await FamilyMemberService.getMyFamily(accessToken);
};

export const loadDoctorModifyRequests = async ({ accessToken, doctorId }: LoadDoctorModifiyRequestsParams): Promise<any[]> => {
  if (!doctorId) return [];
  return await TurnService.getDoctorModifyRequests(doctorId, accessToken);
};

export const loadMyModifyRequests = async ({ accessToken }: LoadMyModifyRequestsParams): Promise<any[]> => {
  return await TurnService.getMyModifyRequests(accessToken);
};




export const loadRatingSubcategories = async ({ role, accessToken }: LoadRatingSubcategoriesParams): Promise<string[]> => {
  return await TurnService.getRatingSubcategories(role, accessToken);
};

export const loadAdminRatings = async ({ accessToken, isAdmin }: LoadAdminRatingsParams): Promise<any> => {
  if (!isAdmin) return { allRatings: [], patientRatings: [], doctorRatings: [], stats: null };
  return await AdminService.getAdminRatings(accessToken);
};

export interface LoadRatedSubcategoryCountsParams {
  doctorIds: string[];
  accessToken?: string;
}

export const loadRatedSubcategoryCounts = async ({ doctorIds, accessToken }: LoadRatedSubcategoryCountsParams): Promise<Record<string, { subcategory: string | null; count: number }[]>> => {
  const map: Record<string, { subcategory: string | null; count: number }[]> = {};
  const promises = doctorIds.map(async (id) => {
    try {
      const counts = await TurnService.getRatedSubcategoryCounts(id, accessToken);
      const SEP_RE = /(?:\s*[-–—]\s*|[,;|\/\\])/;
      const agg: Record<string, number> = {};
      counts.forEach((it: any) => {
        const raw = it.subcategory;
        if (!raw) {
          const key = '__none__';
          agg[key] = (agg[key] || 0) + (it.count || 0);
          return;
        }
        const parts = String(raw).split(SEP_RE).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        if (parts.length) {
          parts.forEach(p => {
            const key = p;
            agg[key] = (agg[key] || 0) + (it.count || 0);
          });
        } else {
          const key = String(raw).trim();
          agg[key] = (agg[key] || 0) + (it.count || 0);
        }
      });

      
      const arr = Object.entries(agg).map(([k, v]) => ({ subcategory: k === '__none__' ? null : k, count: v }));
      arr.sort((a, b) => b.count - a.count);

      
      map[id] = arr.slice(0, 3);
    } catch (e) {
      map[id] = [];
    }
  });
  await Promise.all(promises);
  return map;
};