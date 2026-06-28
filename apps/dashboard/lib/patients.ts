import {
  type ConditionLabel,
  type Detection,
  type LibResult,
  type PatientDetail,
  type PatientListParams,
  type PatientListResult,
  type PatientListStatusFilter,
  type PatientSort,
  type PatientStatus,
  type PatientSummary,
  type SortOrder,
  type UrgencyLevel,
} from "@/types/patient";

const conditionValues = [
  "acne",
  "eczema",
  "keratosisPilaris",
  "psoriasis",
  "warts",
  "benign",
  "malignant",
] satisfies ConditionLabel[];

const urgencyPriority: Record<UrgencyLevel, number> = {
  emergent: 0,
  urgent: 1,
  routine: 2,
};

const placeholderPatients: PatientDetail[] = [
  {
    id: "patient-001",
    name: "Maya Chen",
    phoneNumber: "(415) 555-0194",
    reasonForVisit: "Spot or mole I am concerned about",
    additionalNotes: "New spot noticed last month. Patient reports it has changed in size.",
    status: "open",
    urgencyLevel: "emergent",
    detections: [{ label: "malignant", confidence: 0.78 }],
    summary: "AI flag: lesion image is prioritized for dermatologist review.",
    imageStoragePath: "placeholder/maya-chen.webp",
    createdAt: "2026-06-28T16:45:00.000Z",
    archivedAt: null,
    queuePosition: 1,
    notes: [
      {
        id: "note-001",
        author: "Clinic intake",
        body: "Patient is waiting in room 2.",
        createdAt: "2026-06-28T16:48:00.000Z",
      },
    ],
  },
  {
    id: "patient-002",
    name: "Rafael Ortiz",
    phoneNumber: "(415) 555-0148",
    reasonForVisit: "Psoriasis",
    additionalNotes: "Flare-up on forearm. Patient says symptoms worsened this week.",
    status: "open",
    urgencyLevel: "urgent",
    detections: [{ label: "psoriasis", confidence: 0.91 }],
    summary: "AI flag: inflammatory presentation prioritized for active review.",
    imageStoragePath: "placeholder/rafael-ortiz.webp",
    createdAt: "2026-06-28T16:31:00.000Z",
    archivedAt: null,
    queuePosition: 2,
    notes: [],
  },
  {
    id: "patient-003",
    name: "Nina Patel",
    phoneNumber: "(415) 555-0177",
    reasonForVisit: "Eczema",
    additionalNotes: "Recurring irritation around wrist. Patient asks about next steps.",
    status: "open",
    urgencyLevel: "urgent",
    detections: [{ label: "eczema", confidence: 0.87 }],
    summary: "AI flag: visible irritation summarized for dermatologist review.",
    imageStoragePath: "placeholder/nina-patel.webp",
    createdAt: "2026-06-28T16:12:00.000Z",
    archivedAt: null,
    queuePosition: 3,
    notes: [],
  },
  {
    id: "patient-004",
    name: "Sam Taylor",
    phoneNumber: "(415) 555-0105",
    reasonForVisit: "Acne",
    additionalNotes: null,
    status: "archived",
    urgencyLevel: "routine",
    detections: [{ label: "acne", confidence: 0.83 }],
    summary: "AI flag: routine review summary generated from the image classifier.",
    imageStoragePath: "placeholder/sam-taylor.webp",
    createdAt: "2026-06-28T15:50:00.000Z",
    archivedAt: "2026-06-28T16:25:00.000Z",
    queuePosition: null,
    notes: [
      {
        id: "note-002",
        author: "Dr. Lee",
        body: "Reviewed and closed for the demo queue.",
        createdAt: "2026-06-28T16:24:00.000Z",
      },
    ],
  },
];

function isConditionLabel(value: string): value is ConditionLabel {
  return conditionValues.includes(value as ConditionLabel);
}

function isStatusFilter(value: string | undefined): value is PatientListStatusFilter {
  return value === "open" || value === "archived" || value === "all";
}

function isSort(value: string | undefined): value is PatientSort {
  return value === "recent" || value === "urgency";
}

function isOrder(value: string | undefined): value is SortOrder {
  return value === "asc" || value === "desc";
}

function getSearchValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function encodeCursor(nextIndex: number): string {
  return Buffer.from(JSON.stringify({ nextIndex }), "utf8").toString("base64url");
}

function decodeCursor(cursor: string | null): LibResult<number> {
  if (!cursor) {
    return { data: 0, error: null };
  }

  try {
    const decoded = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      nextIndex?: unknown;
    };

    if (typeof decoded.nextIndex !== "number" || decoded.nextIndex < 0) {
      return { data: null, error: "invalid query parameter" };
    }

    return { data: decoded.nextIndex, error: null };
  } catch {
    return { data: null, error: "invalid query parameter" };
  }
}

function toSummary(patient: PatientDetail): PatientSummary {
  return {
    id: patient.id,
    name: patient.name,
    phoneNumber: patient.phoneNumber,
    reasonForVisit: patient.reasonForVisit,
    status: patient.status,
    urgencyLevel: patient.urgencyLevel,
    detections: patient.detections,
    summary: patient.summary,
    imageStoragePath: patient.imageStoragePath,
    createdAt: patient.createdAt,
    archivedAt: patient.archivedAt,
  };
}

function matchesCondition(patientDetections: Detection[], selectedConditions: ConditionLabel[]) {
  if (selectedConditions.length === 0) {
    return true;
  }

  return patientDetections.some((detection) => selectedConditions.includes(detection.label));
}

function comparePatients(sort: PatientSort, order: SortOrder) {
  return (a: PatientDetail, b: PatientDetail) => {
    if (sort === "urgency") {
      const urgencyDelta = urgencyPriority[a.urgencyLevel] - urgencyPriority[b.urgencyLevel];
      const createdAtDelta = Date.parse(b.createdAt) - Date.parse(a.createdAt);
      const delta = urgencyDelta || createdAtDelta || a.id.localeCompare(b.id);
      return order === "desc" ? delta : -delta;
    }

    const recentDelta = Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id);
    return order === "desc" ? recentDelta : -recentDelta;
  };
}

export function parsePatientListParams(
  searchParams: Record<string, string | string[] | undefined>,
): LibResult<PatientListParams> {
  const statusValue = getSearchValue(searchParams.status);
  const sortValue = getSearchValue(searchParams.sort);
  const orderValue = getSearchValue(searchParams.order);
  const limitValue = getSearchValue(searchParams.limit);
  const cursor = getSearchValue(searchParams.cursor) ?? null;
  const conditionValue = getSearchValue(searchParams.condition);

  if (statusValue && !isStatusFilter(statusValue)) {
    return { data: null, error: "invalid query parameter" };
  }

  if (sortValue && !isSort(sortValue)) {
    return { data: null, error: "invalid query parameter" };
  }

  if (orderValue && !isOrder(orderValue)) {
    return { data: null, error: "invalid query parameter" };
  }

  const parsedLimit = limitValue ? Number.parseInt(limitValue, 10) : 20;

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
    return { data: null, error: "invalid query parameter" };
  }

  const conditions = conditionValue
    ? conditionValue
        .split(",")
        .map((condition) => condition.trim())
        .filter(Boolean)
    : [];

  if (!conditions.every(isConditionLabel)) {
    return { data: null, error: "invalid query parameter" };
  }

  const status: PatientListStatusFilter =
    statusValue && isStatusFilter(statusValue) ? statusValue : "open";
  const sort: PatientSort = sortValue && isSort(sortValue) ? sortValue : "recent";
  const order: SortOrder = orderValue && isOrder(orderValue) ? orderValue : "desc";

  return {
    data: {
      status,
      condition: conditions,
      sort,
      order,
      cursor,
      limit: parsedLimit,
    },
    error: null,
  };
}

export async function listPatients(params: PatientListParams): Promise<LibResult<PatientListResult>> {
  const cursorResult = decodeCursor(params.cursor);

  if (cursorResult.error || cursorResult.data === null) {
    return { data: null, error: cursorResult.error ?? "invalid query parameter" };
  }

  const filtered = placeholderPatients
    .filter((patient) => params.status === "all" || patient.status === params.status)
    .filter((patient) => matchesCondition(patient.detections, params.condition))
    .sort(comparePatients(params.sort, params.order));

  const start = cursorResult.data;
  const page = filtered.slice(start, start + params.limit);
  const nextIndex = start + page.length;

  return {
    data: {
      patients: page.map(toSummary),
      nextCursor: nextIndex < filtered.length ? encodeCursor(nextIndex) : null,
      params,
    },
    error: null,
  };
}

export async function getPatientDetail(patientId: string): Promise<LibResult<PatientDetail>> {
  const patient = placeholderPatients.find((candidate) => candidate.id === patientId);

  if (!patient) {
    return { data: null, error: "not found" };
  }

  return { data: patient, error: null };
}

export async function patientExists(patientId: string): Promise<boolean> {
  return placeholderPatients.some((patient) => patient.id === patientId);
}

export function getOpenQueueCount(): number {
  return placeholderPatients.filter((patient) => patient.status === "open").length;
}

export function getArchivedCount(): number {
  return placeholderPatients.filter((patient) => patient.status === "archived").length;
}

export function getMostUrgentLevel(): UrgencyLevel {
  const openPatients = placeholderPatients.filter((patient) => patient.status === "open");

  if (openPatients.some((patient) => patient.urgencyLevel === "emergent")) {
    return "emergent";
  }

  if (openPatients.some((patient) => patient.urgencyLevel === "urgent")) {
    return "urgent";
  }

  return "routine";
}
