CREATE TABLE IF NOT EXISTS github_repository_pipeline_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repository_id UUID NOT NULL REFERENCES github_repositories(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    successful_runs_count INT NOT NULL DEFAULT 0,
    failed_runs_count INT NOT NULL DEFAULT 0,
    average_merge_to_pipeline_hours NUMERIC(10, 1),
    median_merge_to_pipeline_hours NUMERIC(10, 1),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE (github_repository_id, metric_date)
);

CREATE INDEX IF NOT EXISTS github_repository_pipeline_daily_metrics_repository_id_idx
    ON github_repository_pipeline_daily_metrics (github_repository_id);

CREATE INDEX IF NOT EXISTS github_repository_pipeline_daily_metrics_metric_date_idx
    ON github_repository_pipeline_daily_metrics (metric_date);
