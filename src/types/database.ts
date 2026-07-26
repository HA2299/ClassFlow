export type UserRole =
  | "teacher"
  | "student"
  | "parent"
  | "institution_admin"
  | "system_admin";

export type StudentStatus = "active" | "at_risk" | "inactive";
export type AssignmentDifficulty = "easy" | "medium" | "hard";
export type AssignmentType = "homework" | "quiz" | "project" | "exam";
export type SubmissionStatus = "submitted" | "graded" | "late";
export type RiskFlagType =
  | "low_grades"
  | "missing_submissions"
  | "no_activity"
  | "other";
export type RiskSeverity = "low" | "medium" | "high";
export type InsightType =
  | "class_summary"
  | "student_analysis"
  | "recommendation"
  | "risk";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          institution_id: string;
          role: UserRole;
          full_name: string;
          email: string;
          linked_student_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          institution_id: string;
          role?: UserRole;
          full_name: string;
          email: string;
          linked_student_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          institution_id?: string;
          role?: UserRole;
          full_name?: string;
          email?: string;
          linked_student_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_linked_student_id_fkey";
            columns: ["linked_student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          id: string;
          institution_id: string;
          name: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          name: string;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          institution_id?: string;
          name?: string;
          teacher_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          id: string;
          class_id: string;
          institution_id: string;
          name: string;
          email: string | null;
          status: StudentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          institution_id: string;
          name: string;
          email?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          institution_id?: string;
          name?: string;
          email?: string | null;
          status?: StudentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          institution_id: string;
          name: string;
          description: string | null;
          due_date: string;
          difficulty: AssignmentDifficulty;
          type: AssignmentType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          institution_id: string;
          name: string;
          description?: string | null;
          due_date: string;
          difficulty?: AssignmentDifficulty;
          type?: AssignmentType;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          institution_id?: string;
          name?: string;
          description?: string | null;
          due_date?: string;
          difficulty?: AssignmentDifficulty;
          type?: AssignmentType;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          institution_id: string;
          answer: string;
          submitted_at: string | null;
          status: SubmissionStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          institution_id: string;
          answer?: string;
          submitted_at?: string | null;
          status?: SubmissionStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          institution_id?: string;
          answer?: string;
          submitted_at?: string | null;
          status?: SubmissionStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          submission_id: string;
          student_id: string;
          assignment_id: string;
          institution_id: string;
          score: number;
          max_score: number;
          feedback: string | null;
          graded_at: string;
          graded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          student_id: string;
          assignment_id: string;
          institution_id: string;
          score: number;
          max_score?: number;
          feedback?: string | null;
          graded_at?: string;
          graded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          student_id?: string;
          assignment_id?: string;
          institution_id?: string;
          score?: number;
          max_score?: number;
          feedback?: string | null;
          graded_at?: string;
          graded_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      risk_flags: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          institution_id: string;
          flag_type: RiskFlagType;
          severity: RiskSeverity;
          description: string | null;
          flagged_at: string;
          resolved: boolean;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id: string;
          institution_id: string;
          flag_type: RiskFlagType;
          severity?: RiskSeverity;
          description?: string | null;
          flagged_at?: string;
          resolved?: boolean;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string;
          institution_id?: string;
          flag_type?: RiskFlagType;
          severity?: RiskSeverity;
          description?: string | null;
          flagged_at?: string;
          resolved?: boolean;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          institution_id: string;
          class_id: string | null;
          student_id: string | null;
          title: string;
          summary: string;
          insight_type: InsightType;
          created_at: string;
        };
        Insert: {
          id?: string;
          institution_id: string;
          class_id?: string | null;
          student_id?: string | null;
          title: string;
          summary: string;
          insight_type: InsightType;
          created_at?: string;
        };
        Update: {
          id?: string;
          institution_id?: string;
          class_id?: string | null;
          student_id?: string | null;
          title?: string;
          summary?: string;
          insight_type?: InsightType;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_institution_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      user_role: UserRole;
      student_status: StudentStatus;
      assignment_difficulty: AssignmentDifficulty;
      assignment_type: AssignmentType;
      submission_status: SubmissionStatus;
      risk_flag_type: RiskFlagType;
      risk_severity: RiskSeverity;
      insight_type: InsightType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  linked_student_id?: string | null;
};
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type Institution = Database["public"]["Tables"]["institutions"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Assignment = Database["public"]["Tables"]["assignments"]["Row"];
export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
export type Grade = Database["public"]["Tables"]["grades"]["Row"];
export type RiskFlag = Database["public"]["Tables"]["risk_flags"]["Row"];
export type AIInsight = Database["public"]["Tables"]["ai_insights"]["Row"];
