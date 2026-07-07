"use client";

import Link from "next/link";
import type { Assignment } from "@/types/database";

interface AssignmentsListProps {
  assignments: Assignment[];
  classId: string;
}

const difficultyColors = {
  easy: { bg: "bg-green-50", text: "text-green-700", label: "קל" },
  medium: { bg: "bg-yellow-50", text: "text-yellow-700", label: "בינוני" },
  hard: { bg: "bg-red-50", text: "text-red-700", label: "קשה" },
};

const typeIcons = {
  homework: "📝",
  quiz: "❓",
  project: "🎨",
  exam: "📋",
};

export function AssignmentsList({ assignments, classId }: AssignmentsListProps) {
  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          אין משימות בכיתה זו עדיין
        </p>
      </div>
    );
  }

  const now = new Date();
  const upcomingAssignments = assignments.filter(
    (a) => new Date(a.due_date) > now
  );
  const pastAssignments = assignments.filter((a) => new Date(a.due_date) <= now);

  return (
    <div className="space-y-6">
      {/* Upcoming */}
      {upcomingAssignments.length > 0 && (
        <div>
          <h3 className="mb-3 font-medium text-foreground">
            משימות קרובות ({upcomingAssignments.length})
          </h3>
          <div className="space-y-2">
            {upcomingAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                classId={classId}
                isUpcoming
              />
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastAssignments.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            משימות עברות ({pastAssignments.length})
          </h3>
          <div className="space-y-2">
            {pastAssignments.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                classId={classId}
                isUpcoming={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentCard({
  assignment,
  classId,
}: {
  assignment: Assignment;
  classId: string;
  isUpcoming: boolean;
}) {
  const difficulty =
    difficultyColors[assignment.difficulty as keyof typeof difficultyColors];
  const icon =
    typeIcons[assignment.type as keyof typeof typeIcons] || "📄";

  const dueDate = new Date(assignment.due_date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dueDateLabel = dueDate.toLocaleDateString("he-IL");
  if (dueDate.toDateString() === today.toDateString()) {
    dueDateLabel = "היום";
  } else if (dueDate.toDateString() === tomorrow.toDateString()) {
    dueDateLabel = "מחר";
  }

  return (
    <Link
      href={`/classes/${classId}/assignments/${assignment.id}`}
      className="group flex items-start justify-between rounded-lg border border-border/50 bg-muted/20 p-4 transition hover:border-border/80 hover:bg-muted/40"
    >
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="text-xl">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground truncate">
            {assignment.name}
          </p>
          {assignment.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {assignment.description}
            </p>
          )}
        </div>
      </div>
      <div className="ml-3 flex flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${difficulty.bg} ${difficulty.text}`}
        >
          {difficulty.label}
        </span>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {dueDateLabel}
        </span>
      </div>
    </Link>
  );
}
