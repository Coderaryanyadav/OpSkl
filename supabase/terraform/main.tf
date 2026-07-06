# Production Infrastructure as Code (IaC) - Vendor-Agnostic Blueprint
# Target: AWS Multi-Region Deployment for Postgres & Kubernetes Clusters

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = "ap-south-1" # Mumbai (Primary Hub)
}

provider "aws" {
  alias  = "replica"
  region = "ap-southeast-1" # Singapore (Disaster Recovery / Low Latency Replica)
}

# 1. DATABASE CONNECTION POOLING & POSTGRES RDS SETUPS
resource "aws_db_instance" "postgres_primary" {
  provider             = aws.primary
  identifier           = "opskl-db-primary"
  engine               = "postgres"
  engine_version       = "15.7"
  instance_class       = "db.r7g.2xlarge" # 8 vCPU, 64GB RAM (Enterprise Ready)
  allocated_storage    = 500
  max_allocated_storage = 2000
  storage_type         = "gp3"
  db_name              = "opskl"
  username             = "opskl_admin"
  password             = var.db_password
  multi_az             = true # Multi-AZ deployment for failover
  publicly_accessible  = false
  skip_final_snapshot  = false
  backup_retention_period = 30
}

# Read Replica Setup for Search & Read-Heavy Operations
resource "aws_db_instance" "postgres_replica" {
  provider            = aws.replica
  identifier          = "opskl-db-replica"
  replicate_source_db = aws_db_instance.postgres_primary.arn
  instance_class      = "db.r7g.2xlarge"
  storage_type        = "gp3"
  publicly_accessible = false
  skip_final_snapshot = true
}

# 2. ELASTICACHE REDIS FOR SESSION & QUERY CACHING
resource "aws_elasticache_replication_group" "redis_cache" {
  provider                    = aws.primary
  replication_group_id        = "opskl-redis-group"
  description                 = "Opskl Redis cache cluster"
  node_type                   = "cache.t4g.medium"
  num_cache_clusters          = 2
  parameter_group_name        = "default.redis7"
  port                        = 6379
  automatic_failover_enabled  = true
  multi_az_enabled            = true
}

# 3. AWS S3 PRIVATE BUCKETS WITH ACCESS POLICIES
resource "aws_s3_bucket" "proof_of_work" {
  provider = aws.primary
  bucket   = "opskl-proofs-production"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "proof_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.proof_of_work.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. CLOUDFRONT CDN DISTRIBUTION
resource "aws_cloudfront_distribution" "cdn" {
  provider = aws.primary
  origin {
    domain_name = aws_s3_bucket.proof_of_work.bucket_regional_domain_name
    origin_id   = "S3-proofs"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-proofs"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "whitelist"
      locations        = ["IN", "SG"] # Primarily target India and Singapore hubs
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

variable "db_password" {
  type      = string
  sensitive = true
}
