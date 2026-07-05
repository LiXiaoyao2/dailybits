ALTER TABLE "KnowledgeSubscription"
ALTER COLUMN "pushTimes" SET DEFAULT ARRAY['09:30', '14:00', '17:00']::TEXT[];
