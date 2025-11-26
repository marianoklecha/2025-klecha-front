export enum BadgeType {

  EXCEPTIONAL_COMMUNICATOR = 'EXCEPTIONAL_COMMUNICATOR',
  EMPATHETIC_DOCTOR = 'EMPATHETIC_DOCTOR',
  PUNCTUALITY_PROFESSIONAL = 'PUNCTUALITY_PROFESSIONAL',
  SUSTAINED_EXCELLENCE = 'SUSTAINED_EXCELLENCE',

  COMPLETE_DOCUMENTER = 'COMPLETE_DOCUMENTER',
  DETAILED_HISTORIAN = 'DETAILED_HISTORIAN',

  AGILE_RESPONDER = 'AGILE_RESPONDER',
  RELATIONSHIP_BUILDER = 'RELATIONSHIP_BUILDER',

  CONSISTENT_PROFESSIONAL = 'CONSISTENT_PROFESSIONAL',
  ALWAYS_AVAILABLE = 'ALWAYS_AVAILABLE',
  TOP_SPECIALIST = 'TOP_SPECIALIST',
  MEDICAL_LEGEND = 'MEDICAL_LEGEND',
}

export enum PatientBadgeType {
  MEDIBOOK_WELCOME = 'MEDIBOOK_WELCOME',
  COMMITTED_PATIENT = 'COMMITTED_PATIENT',
  CONTINUOUS_FOLLOWUP = 'CONTINUOUS_FOLLOWUP',
  CONSTANT_PATIENT = 'CONSTANT_PATIENT',
  EXEMPLARY_PUNCTUALITY = 'EXEMPLARY_PUNCTUALITY',
  SMART_PLANNER = 'SMART_PLANNER',
  EXCELLENT_COLLABORATOR = 'EXCELLENT_COLLABORATOR',
  ALWAYS_PREPARED = 'ALWAYS_PREPARED',
  RESPONSIBLE_EVALUATOR = 'RESPONSIBLE_EVALUATOR',
  EXCELLENCE_MODEL = 'EXCELLENCE_MODEL',
}

export enum BadgeCategory {
  QUALITY_OF_CARE = 'QUALITY_OF_CARE',
  PROFESSIONALISM = 'PROFESSIONALISM',
  CONSISTENCY = 'CONSISTENCY',
}

export enum PatientBadgeCategory {
  WELCOME = 'WELCOME',
  PREVENTIVE_CARE = 'PREVENTIVE_CARE',
  ACTIVE_COMMITMENT = 'ACTIVE_COMMITMENT',
  CLINICAL_EXCELLENCE = 'CLINICAL_EXCELLENCE',
}

export enum BadgeRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface Badge {
  id: string;
  doctorId: string;
  badgeType: BadgeType;
  earnedAt: string;
  isActive: boolean;
  lastEvaluatedAt: string;
}

export interface BadgeProgress {
  badgeType: string;
  badgeName: string;
  category: string;
  rarity: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  earned: boolean;
  earnedAt?: string;
  isActive?: boolean;
  lastEvaluatedAt?: string;
  progressPercentage: number;
  statusMessage: string;
}

export interface BadgeMetadata {
  type: string;
  category: string;
  rarity: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
}

export interface DoctorBadgesResponse {
  doctorId: string;
  doctorName: string;
  totalActiveBadges: number;
  qualityOfCareBadges: BadgeDTO[];
  professionalismBadges: BadgeDTO[];
  consistencyBadges: BadgeDTO[];
}

export interface BadgeDTO {
  badgeType: BadgeType;
  category: string;
  isActive: boolean;
  earnedAt: string;
  lastEvaluatedAt: string;
}

export type BadgeProgressResponse = BadgeProgress[];

export interface PatientBadge {
  id: string;
  patientId: string;
  badgeType: PatientBadgeType;
  earnedAt: string;
  isActive: boolean;
  lastEvaluatedAt: string;
}

export interface PatientBadgeProgress {
  badgeType: string;
  badgeName: string;
  category: string;
  rarity: string;
  description: string;
  icon: string;
  color: string;
  criteria: string;
  earned: boolean;
  progressPercentage: number;
  statusMessage: string;
}

export interface PatientBadgesResponse {
  patientId: string;
  patientName: string;
  totalActiveBadges: number;
  welcomeBadges: PatientBadgeDTO[];
  preventiveCareBadges: PatientBadgeDTO[];
  activeCommitmentBadges: PatientBadgeDTO[];
  clinicalExcellenceBadges: PatientBadgeDTO[];
}

export interface PatientBadgeDTO {
  badgeType: PatientBadgeType;
  category: string;
  isActive: boolean;
  earnedAt: string;
  lastEvaluatedAt: string;
}

export type PatientBadgeProgressResponse = PatientBadgeProgress[];

// Helper functions that work with data from backend
export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    'COMMON': '#78909C',
    'RARE': '#2196F3',
    'EPIC': '#9C27B0',
    'LEGENDARY': '#FFD700',
  };
  return colors[rarity] || '#78909C';
};

export const getCategoryDisplayName = (category: string): string => {
  const names: Record<string, string> = {
    'QUALITY_OF_CARE': 'Calidad de Atención',
    'PROFESSIONALISM': 'Profesionalismo',
    'CONSISTENCY': 'Consistencia',
    'WELCOME': 'Bienvenida',
    'PREVENTIVE_CARE': 'Cuidado Preventivo',
    'ACTIVE_COMMITMENT': 'Compromiso Activo',
    'CLINICAL_EXCELLENCE': 'Excelencia Clínica',
  };
  return names[category] || category;
};

export const getRarityDisplayName = (rarity: string): string => {
  const names: Record<string, string> = {
    'COMMON': 'Básico',
    'RARE': 'Intermedio',
    'EPIC': 'Avanzado',
    'LEGENDARY': 'Elite',
  };
  return names[rarity] || rarity;
};

export const sortBadgesByRarity = <T extends { rarity: string }>(badges: T[]): T[] => {
  const rarityOrder: Record<string, number> = {
    'COMMON': 1,
    'RARE': 2,
    'EPIC': 3,
    'LEGENDARY': 4,
  };

  return badges.sort((a, b) => {
    const orderA = rarityOrder[a.rarity] || 0;
    const orderB = rarityOrder[b.rarity] || 0;
    return orderA - orderB;
  });
};
