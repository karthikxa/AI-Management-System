# Example root module: a single self-hosted Zed VPS on EC2.
#
# This is a THIN convenience wrapper — it provisions the box once via
# modules/selfhost-ec2, which runs the exact same `zed self-host init` /
# `start` any self-host user runs by hand. It is NOT a parallel deployment
# system: after `terraform apply` finishes, the in-compose auto-updater keeps
# the app current, not Terraform.
#
#   cd infra/terraform/examples/selfhost-ec2
#   terraform init
#   terraform apply -var domain=zed.example.com
#
# Secrets (sandbox provider key, managed git, SMTP, ...) are NOT Terraform
# inputs — see the post_apply_next_steps output after apply.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "zed_selfhost" {
  source = "../../modules/selfhost-ec2"

  domain  = var.domain
  zone_id = var.route53_zone_id

  # Everything below is optional — shown at its default for discoverability.
  instance_type          = "t3.xlarge"
  data_volume_size_gb    = 100
  backup_interval_hours  = 24
  backup_retention_count = 7
  zed_channel         = "stable"
  auto_update            = "on"

  tags = {
    Project     = "zed-selfhost"
    Environment = "example"
  }
}
