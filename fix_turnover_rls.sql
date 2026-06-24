-- ============================================================
-- KØYR DETTE I SUPABASE SQL EDITOR
-- Fiksar RLS på turnover_task_log
-- ============================================================

-- Steg 1: Slå på RLS (var av)
ALTER TABLE turnover_task_log ENABLE ROW LEVEL SECURITY;

-- Steg 2: Lag policy som let brukaren gjere ALT med sine eigne rader
CREATE POLICY "Users can manage own task logs"
ON turnover_task_log
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Steg 3: Fjern duplikat-policies på dei andre tabellane (rydding)
DROP POLICY IF EXISTS "own_data" ON turnover_tasks;
DROP POLICY IF EXISTS "own_data" ON turnovers;

-- Steg 4: Stadfest at alt er rett
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('turnovers', 'turnover_task_log', 'turnover_tasks')
ORDER BY tablename, policyname;
