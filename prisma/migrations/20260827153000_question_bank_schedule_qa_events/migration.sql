CREATE TYPE "SubscriptionScheduleMode" AS ENUM ('CUSTOM', 'FIXED');

CREATE TYPE "SubscriptionCadence" AS ENUM ('DAILY', 'WEEKLY');

ALTER TABLE "QuestionBank"
ADD COLUMN "visibleDepartmentNames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "subscriptionScheduleMode" "SubscriptionScheduleMode" NOT NULL DEFAULT 'CUSTOM',
ADD COLUMN "subscriptionCadence" "SubscriptionCadence" NOT NULL DEFAULT 'DAILY',
ADD COLUMN "subscriptionWeekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "subscriptionPushTimes" TEXT[] NOT NULL DEFAULT ARRAY['09:30', '14:00']::TEXT[];

CREATE TABLE "QuestionAnswerEvent" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "respondentId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "bankId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL,
    "sourceSystem" TEXT NOT NULL DEFAULT 'card-service',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionAnswerEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionAnswerEvent_cardId_respondentId_key" ON "QuestionAnswerEvent"("cardId", "respondentId");
CREATE INDEX "QuestionAnswerEvent_bankId_answeredAt_idx" ON "QuestionAnswerEvent"("bankId", "answeredAt");
CREATE INDEX "QuestionAnswerEvent_questionId_answeredAt_idx" ON "QuestionAnswerEvent"("questionId", "answeredAt");
CREATE INDEX "QuestionAnswerEvent_respondentId_answeredAt_idx" ON "QuestionAnswerEvent"("respondentId", "answeredAt");

ALTER TABLE "QuestionAnswerEvent" ADD CONSTRAINT "QuestionAnswerEvent_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionAnswerEvent" ADD CONSTRAINT "QuestionAnswerEvent_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "QuestionBank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
