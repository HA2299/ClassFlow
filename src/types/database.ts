export type UserRole =
  | "teacher"
  | "student"
  | "parent"
  | "institution_admin"
  | "system_admin";

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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          institution_id: string;
          role?: UserRole;
          full_name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          institution_id?: string;
          role?: UserRole;
          full_name?: string;
          email?: string;
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
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type Institution = Database["public"]["Tables"]["institutions"]["Row"];

// Student types
export type Student = {
  id: string;
  class_id: string;
  institution_id: string;
  name: string;
  email?: string;
  status: "active" | "at_risk" | "inactive";
  created_at: string;
  updated_at: string;
};

// Assignment types
export type Assignment = {
  id: string;
  class_id: string;
  institution_id: string;
  name: string;
  description?: string;
  due_date: string;
  difficulty: "easy" | "medium" | "hard";
  type: "homework" | "quiz" | "project" | "exam";
  created_at: string;
  updated_at: string;
};

// Submission types
export type Submission = {
  id: string;
  assignment_id: string;
  student_id: string;
  institution_id: string;
  answer: string;
  submitted_at: string;
  status: "submitted" | "graded" | "late";
  created_at: string;
};

// Grade types
export type Grade = {
  id: string;
  submission_id: string;
  student_id: string;
  assignment_id: string;
  institution_id: string;
  score: number;
  max_score: number;
  feedback?: string;
  graded_at: string;
  graded_by: string;
  created_at: string;
};

// Risk flags
export type RiskFlag = {
  id: string;
  student_id: string;
  class_id: string;
  institution_id: string;
  flag_type: "low_grades" | "missing_submissions" | "no_activity" | "other";
  severity: "low" | "medium" | "high";
  description?: string;
  flagged_at: string;
  resolved: boolean;
};
