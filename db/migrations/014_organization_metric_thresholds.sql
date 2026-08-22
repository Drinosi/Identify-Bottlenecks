CREATE TABLE IF NOT EXISTS organization_metric_thresholds (
    organization_id UUID PRIMARY KEY
        REFERENCES organizations(id) ON DELETE CASCADE,

    first_review_warning_hours INTEGER NOT NULL,
    first_review_critical_hours INTEGER NOT NULL,

    merge_time_warning_hours INTEGER NOT NULL,
    merge_time_critical_hours INTEGER NOT NULL,

    open_without_review_warning_hours INTEGER NOT NULL,
    open_without_review_critical_hours INTEGER NOT NULL,

    reviewed_but_unmerged_warning_hours INTEGER NOT NULL,
    reviewed_but_unmerged_critical_hours INTEGER NOT NULL,

    default_branch_activity_warning_hours INTEGER NOT NULL,
    default_branch_activity_critical_hours INTEGER NOT NULL,

    change_lead_time_warning_hours INTEGER NOT NULL,
    change_lead_time_critical_hours INTEGER NOT NULL,

    merge_to_pipeline_increase_warning_percent INTEGER NOT NULL,
    merge_to_pipeline_increase_critical_percent INTEGER NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT first_review_thresholds_valid CHECK (
        first_review_warning_hours > 0
        AND first_review_warning_hours < first_review_critical_hours
    ),

    CONSTRAINT merge_time_thresholds_valid CHECK (
        merge_time_warning_hours > 0
        AND merge_time_warning_hours < merge_time_critical_hours
    ),

    CONSTRAINT open_without_review_thresholds_valid CHECK (
        open_without_review_warning_hours > 0
        AND open_without_review_warning_hours
            < open_without_review_critical_hours
    ),

    CONSTRAINT reviewed_but_unmerged_thresholds_valid CHECK (
        reviewed_but_unmerged_warning_hours > 0
        AND reviewed_but_unmerged_warning_hours
            < reviewed_but_unmerged_critical_hours
    ),

    CONSTRAINT default_branch_activity_thresholds_valid CHECK (
        default_branch_activity_warning_hours > 0
        AND default_branch_activity_warning_hours
            < default_branch_activity_critical_hours
    ),

    CONSTRAINT change_lead_time_thresholds_valid CHECK (
        change_lead_time_warning_hours > 0
        AND change_lead_time_warning_hours
            < change_lead_time_critical_hours
    ),

    CONSTRAINT merge_to_pipeline_increase_thresholds_valid CHECK (
        merge_to_pipeline_increase_warning_percent >= 0
        AND merge_to_pipeline_increase_warning_percent
            < merge_to_pipeline_increase_critical_percent
    )
);