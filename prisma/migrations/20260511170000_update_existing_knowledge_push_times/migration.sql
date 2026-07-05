UPDATE "KnowledgeSubscription"
SET "pushTimes" = ARRAY['09:30', '14:00', '17:00']::TEXT[]
WHERE "pushTimes" = ARRAY['09:00']::TEXT[];
