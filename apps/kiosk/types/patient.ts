export const reasonForVisitOptions = [
  { value: "acne", label: "Acne or breakouts" },
  { value: "eczema", label: "Dry, itchy, or irritated skin" },
  { value: "keratosisPilaris", label: "Rough bumps on skin" },
  { value: "psoriasis", label: "Scaly or inflamed patches" },
  { value: "warts", label: "Warts or raised growths" },
  { value: "benign", label: "A spot I was told is benign" },
  { value: "malignant", label: "A spot or mole I am concerned about" },
  { value: "other", label: "Something else" }
] as const;

export type ReasonForVisit = (typeof reasonForVisitOptions)[number]["value"];

export type PatientDraft = {
  name: string;
  phoneNumber: string;
  reasonForVisit: ReasonForVisit;
  additionalNotes: string | null;
};

export type PatientSession = {
  patientId: string;
  ownerId: string;
};

export type AsyncResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type ImageProcessingResult = {
  detections?: Array<{ label: string; confidence: number }>;
  urgencyLevel?: "routine" | "urgent" | "emergent";
  summary?: string;
};
