export type Maturity = "prototype" | "pilot" | "production";
export type Status = "pass" | "partial" | "fail" | "not_applicable";

export interface ChecklistControl {
  id: string;
  title: string;
  category:
    | "outcomes"
    | "data"
    | "evaluations"
    | "security"
    | "privacy"
    | "reliability"
    | "observability"
    | "cost"
    | "launch"
    | "incident-readiness";
  description: string;
  level: Maturity;
  required: boolean;
  guidance: string;
  evidenceExamples: string[];
}

export interface Checklist {
  schemaVersion: "1.0";
  name: string;
  version: string;
  description?: string;
  controls: ChecklistControl[];
}

export interface Evidence {
  label: string;
  uri: string;
}

export interface AssessmentResult {
  id: string;
  status: Status;
  evidence: Evidence[];
  owner: string;
  rationale: string;
  reviewDate: string;
}

export interface Assessment {
  schemaVersion: "1.0";
  checklistVersion: string;
  feature: {
    name: string;
    description: string;
    owner: string;
    maturity: Maturity;
  };
  assessedAt: string;
  controls: AssessmentResult[];
}

export interface ValidationSummary {
  applicable: number;
  passed: number;
  notApplicable: number;
  partial: number;
  failed: number;
  missing: number;
}

export interface ValidationOutcome {
  ready: boolean;
  errors: string[];
  warnings: string[];
  summary: ValidationSummary;
}
