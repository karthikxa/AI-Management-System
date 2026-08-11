variable "aws_region" {
  description = "AWS region for the prod resources (colocated with the Supabase DB)."
  type        = string
  default     = "eu-west-2"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for zed.com. Supply via TF_VAR_cloudflare_zone_id."
  type        = string
  # The zed.com zone id. Not a secret — it is already exposed as the
  # CLOUDFLARE_ZONE_ID repo variable and appears in every Cloudflare API URL.
  # It defaults here because an empty value resolves zone_id to null on every
  # cloudflare_record, and zone_id forces replacement: a plan run without the
  # gitignored tfvars proposed destroying and recreating live production DNS.
  default = "af378d3df4e4dd5052a1fcbf263b685d"
}

variable "extra_api_hostnames" {
  description = <<-EOT
    Additional public API hostnames to expose the ALB under (proxied CNAMEs),
    also added as ACM SANs so Cloudflare Full-strict works. Use to serve the new
    stack under an unlocked name (e.g. ["api-prod.zed.com"]) while the
    canonical api.zed.com record stays tunnel-locked on the old box.
  EOT
  type        = list(string)
  # This is a live SAN on the certificate currently serving api.zed.com, so
  # it belongs in version control rather than only in a gitignored tfvars. With
  # the old default of [], any plan run without that local file — CI, or a
  # second machine — proposed REPLACING the production certificate, because
  # subject_alternative_names forces replacement.
  default = ["api-ecs-fargate.zed.com"]
}

variable "manage_dns" {
  description = <<-EOT
    Whether terraform creates the public api.zed.com CNAME. Keep false during
    bring-up so the live record (pointing at the old prod box) is untouched —
    the stack builds + validates first. The cutover repoints api.zed.com at
    this ALB out-of-band (reversible). ACM validation records are always created.
  EOT
  type        = bool
  default     = false
}

variable "api_domain" {
  description = <<-EOT
    Public FQDN for the prod API. Defaults to the final api.zed.com, but the
    stack is first brought up under new-api.zed.com (set api_domain =
    "new-api.zed.com" in tfvars) so it runs in parallel with the live
    production API without touching api.zed.com. At go-live, change this back
    to "api.zed.com" and re-apply — the ALB/ECS/cert all just re-point, no
    rebuild. The Cloudflare record name + ACM SAN derive from this.
  EOT
  type        = string
  default     = "api.zed.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare scoped API token (= CLOUDFLARE_API_TOKEN secret). Supply via TF_VAR_cloudflare_api_token."
  type        = string
  default     = ""
  sensitive   = true
}

variable "cloudflare_email" {
  description = "Cloudflare account email (for global-API-key auth, when no scoped token is used)."
  type        = string
  default     = ""
}

variable "cloudflare_api_key" {
  description = "Cloudflare global API key (alternative to a scoped token). Supply via TF_VAR_cloudflare_api_key."
  type        = string
  default     = ""
  sensitive   = true
}

variable "api_image" {
  description = "Container image for the API (pin to a release tag/sha in prod)."
  type        = string
  default     = "ghcr.io/zed-ai/zed-api:latest"
}

variable "container_port" {
  description = "Port the API container listens on."
  type        = number
  default     = 8000
}

variable "api_environment" {
  description = "Non-secret env vars for the API container."
  type        = map(string)
  default     = {}
}

variable "api_secrets" {
  description = "Secret env vars: name -> Secrets Manager/SSM ARN."
  type        = map(string)
  default     = {}
}

variable "gateway_image" {
  description = "Container image for the gateway (LLM proxy). CI rolls new revisions; Terraform seeds the initial task-def."
  type        = string
  default     = "zed/zed-gateway:latest"
}

variable "gateway_environment" {
  description = "Non-secret env vars for the gateway container (besides PORT and ZED_API_URL, set by the module/env)."
  type        = map(string)
  default     = {}
}

variable "gateway_domain" {
  description = "FQDN for the gateway ECS origin (the Worker's ecs-fargate backend). Gets its own ACM cert. gateway.zed.com itself stays the Worker's hostname."
  type        = string
  default     = "gateway-ecs-fargate.zed.com"
}
