export type ConditionLabel =
  | "acne"
  | "eczema"
  | "keratosisPilaris"
  | "psoriasis"
  | "warts"
  | "benign"
  | "malignant";

export type UrgencyLevel = "routine" | "urgent" | "emergent";

export type PatientStatus = "open" | "archived";

export type Detection = {
  label: ConditionLabel;
  confidence: number;
};

export type PatientListStatusFilter = PatientStatus | "all";

export type PatientSort = "recent" | "urgency";

export type SortOrder = "asc" | "desc";

export type PatientListParams = {
  status: PatientListStatusFilter;
  condition: ConditionLabel[];
  sort: PatientSort;
  order: SortOrder;
  cursor: string | null;
  limit: number;
};

export type PatientSummary = {
  id: string;
  name: string;
  phoneNumber: string;
  reasonForVisit: string;
  status: PatientStatus;
  urgencyLevel: UrgencyLevel;
  detections: Detection[];
  summary: string;
  imageStoragePath: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type PatientDetail = PatientSummary & {
  additionalNotes: string | null;
  queuePosition: number | null;
  notes: PatientNote[];
};

export type PatientNote = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type PatientListResult = {
  patients: PatientSummary[];
  nextCursor: string | null;
  params: PatientListParams;
};

export type LibResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: string;
    };

export const conditionLabels: Record<ConditionLabel, string> = {
  acne: "Acne",
  eczema: "Eczema",
  keratosisPilaris: "Keratosis pilaris",
  psoriasis: "Psoriasis",
  warts: "Warts",
  benign: "Spot or mole",
  malignant: "Flagged lesion",
};

export const urgencyLabels: Record<UrgencyLevel, string> = {
  routine: "Routine",
  urgent: "Urgent",
  emergent: "Emergent",
};
