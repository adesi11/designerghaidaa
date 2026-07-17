CREATE TABLE IF NOT EXISTS brief_drafts (
 id TEXT PRIMARY KEY NOT NULL, answers TEXT NOT NULL DEFAULT '{}', status TEXT NOT NULL DEFAULT 'incomplete',
 current_step INTEGER NOT NULL DEFAULT 0, started_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, submitted_at INTEGER
);
CREATE INDEX IF NOT EXISTS brief_drafts_status_updated_idx ON brief_drafts(status, updated_at DESC);
