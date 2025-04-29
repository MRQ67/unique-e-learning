-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exam_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "requiresProctoring" BOOLEAN NOT NULL DEFAULT true,
    "proctoringActive" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "answers" JSONB,
    "score" REAL,
    CONSTRAINT "exam_sessions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "exam_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_exam_sessions" ("endedAt", "examId", "id", "proctoringActive", "requiresProctoring", "startedAt", "userId") SELECT "endedAt", "examId", "id", "proctoringActive", "requiresProctoring", "startedAt", "userId" FROM "exam_sessions";
DROP TABLE "exam_sessions";
ALTER TABLE "new_exam_sessions" RENAME TO "exam_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
