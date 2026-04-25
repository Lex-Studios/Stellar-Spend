# ── Centralized logging infrastructure ────────────────────────────────────────
# CloudWatch log groups, metric filters, Insights saved queries,
# Kinesis Firehose → S3 archival, and S3 lifecycle retention policy.

# ── Variables ─────────────────────────────────────────────────────────────────

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "log_archive_days" {
  description = "Days before S3 log objects transition to Glacier"
  type        = number
  default     = 90
}

variable "log_expiry_days" {
  description = "Days before S3 log objects are permanently deleted"
  type        = number
  default     = 365
}

# ── CloudWatch Log Groups ─────────────────────────────────────────────────────

# Application logs (ECS task stdout — already referenced in main.tf)
# Retention is set here to override the value in main.tf for clarity.
resource "aws_cloudwatch_log_group" "app_errors" {
  name              = "/ecs/${local.name_prefix}/errors"
  retention_in_days = var.environment == "production" ? 90 : var.log_retention_days
}

resource "aws_cloudwatch_log_group" "access" {
  name              = "/ecs/${local.name_prefix}/access"
  retention_in_days = var.environment == "production" ? 90 : var.log_retention_days
}

# ── Metric Filters ────────────────────────────────────────────────────────────
# Parse structured JSON logs emitted by src/lib/logger.ts

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  name           = "${local.name_prefix}-error-count"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.level = \"error\" }"

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "StellarSpend/${var.environment}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "warn_count" {
  name           = "${local.name_prefix}-warn-count"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.level = \"warn\" }"

  metric_transformation {
    name          = "WarnCount"
    namespace     = "StellarSpend/${var.environment}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "http_5xx" {
  name           = "${local.name_prefix}-http-5xx"
  log_group_name = aws_cloudwatch_log_group.app.name
  pattern        = "{ $.event = \"http.request\" && $.status >= 500 }"

  metric_transformation {
    name          = "Http5xxCount"
    namespace     = "StellarSpend/${var.environment}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

resource "aws_cloudwatch_log_metric_filter" "slow_requests" {
  name           = "${local.name_prefix}-slow-requests"
  log_group_name = aws_cloudwatch_log_group.app.name
  # Requests taking > 2000ms
  pattern = "{ $.event = \"http.request\" && $.durationMs > 2000 }"

  metric_transformation {
    name          = "SlowRequestCount"
    namespace     = "StellarSpend/${var.environment}"
    value         = "1"
    default_value = "0"
    unit          = "Count"
  }
}

# ── Alarms on metric filters ──────────────────────────────────────────────────

resource "aws_cloudwatch_metric_alarm" "error_rate_high" {
  alarm_name          = "${local.name_prefix}-error-rate-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorCount"
  namespace           = "StellarSpend/${var.environment}"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Application error log rate > 10/min for 2 consecutive minutes"
  alarm_actions       = local.alarm_actions
  ok_actions          = local.alarm_actions
  treat_missing_data  = "notBreaching"
}

# ── CloudWatch Logs Insights saved queries ────────────────────────────────────

resource "aws_cloudwatch_query_definition" "errors_last_hour" {
  name = "${local.name_prefix}/errors-last-hour"
  log_group_names = [aws_cloudwatch_log_group.app.name]

  query_string = <<-QUERY
    fields @timestamp, level, event, requestId, error.message, @message
    | filter level = "error"
    | sort @timestamp desc
    | limit 100
  QUERY
}

resource "aws_cloudwatch_query_definition" "slow_requests" {
  name = "${local.name_prefix}/slow-requests"
  log_group_names = [aws_cloudwatch_log_group.app.name]

  query_string = <<-QUERY
    fields @timestamp, method, path, status, durationMs, requestId
    | filter event = "http.request" and durationMs > 1000
    | sort durationMs desc
    | limit 50
  QUERY
}

resource "aws_cloudwatch_query_definition" "request_trace" {
  name = "${local.name_prefix}/trace-by-request-id"
  log_group_names = [aws_cloudwatch_log_group.app.name]

  query_string = <<-QUERY
    fields @timestamp, level, event, @message
    | filter requestId = "REPLACE_WITH_REQUEST_ID"
    | sort @timestamp asc
  QUERY
}

resource "aws_cloudwatch_query_definition" "payout_failures" {
  name = "${local.name_prefix}/payout-failures"
  log_group_names = [aws_cloudwatch_log_group.app.name]

  query_string = <<-QUERY
    fields @timestamp, requestId, error.message, @message
    | filter event like "payout" and level = "error"
    | sort @timestamp desc
    | limit 50
  QUERY
}

# ── S3 bucket for log archival ────────────────────────────────────────────────

resource "aws_s3_bucket" "logs" {
  bucket        = "${local.name_prefix}-logs-${data.aws_caller_identity.current.account_id}"
  force_destroy = var.environment != "production"
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── S3 lifecycle rules (retention policy) ────────────────────────────────────

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "archive-and-expire"
    status = "Enabled"

    filter { prefix = "logs/" }

    transition {
      days          = var.log_archive_days
      storage_class = "GLACIER"
    }

    expiration {
      days = var.log_expiry_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

# ── Kinesis Firehose → S3 (log shipping) ─────────────────────────────────────

resource "aws_iam_role" "firehose" {
  name = "${local.name_prefix}-firehose"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "firehose.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "firehose_s3" {
  name = "${local.name_prefix}-firehose-s3"
  role = aws_iam_role.firehose.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject", "s3:PutObjectAcl", "s3:GetBucketLocation", "s3:ListBucket"]
      Resource = [aws_s3_bucket.logs.arn, "${aws_s3_bucket.logs.arn}/*"]
    }]
  })
}

resource "aws_kinesis_firehose_delivery_stream" "logs" {
  name        = "${local.name_prefix}-log-stream"
  destination = "extended_s3"

  extended_s3_configuration {
    role_arn           = aws_iam_role.firehose.arn
    bucket_arn         = aws_s3_bucket.logs.arn
    prefix             = "logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/"
    error_output_prefix = "errors/!{firehose:error-output-type}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/"
    buffering_size      = 5    # MiB
    buffering_interval  = 300  # seconds
    compression_format  = "GZIP"
  }
}

# ── CloudWatch Logs subscription → Firehose ───────────────────────────────────

resource "aws_iam_role" "cwl_firehose" {
  name = "${local.name_prefix}-cwl-firehose"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "logs.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "cwl_firehose" {
  name = "${local.name_prefix}-cwl-firehose"
  role = aws_iam_role.cwl_firehose.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["firehose:PutRecord", "firehose:PutRecordBatch"]
      Resource = [aws_kinesis_firehose_delivery_stream.logs.arn]
    }]
  })
}

resource "aws_cloudwatch_log_subscription_filter" "app_to_firehose" {
  name            = "${local.name_prefix}-to-firehose"
  log_group_name  = aws_cloudwatch_log_group.app.name
  filter_pattern  = "" # ship all logs
  destination_arn = aws_kinesis_firehose_delivery_stream.logs.arn
  role_arn        = aws_iam_role.cwl_firehose.arn
  distribution    = "ByLogStreamName"
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "log_bucket_name" {
  description = "S3 bucket name for archived logs"
  value       = aws_s3_bucket.logs.bucket
}

output "firehose_stream_name" {
  description = "Kinesis Firehose delivery stream name"
  value       = aws_kinesis_firehose_delivery_stream.logs.name
}
