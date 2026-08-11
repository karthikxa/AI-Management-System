# Moved

Terraform for the `ec2-vps-demo.zed.cloud` demo box now lives in its own
repo, [zed-ai/zed-vps-demo-infra](https://github.com/zed-ai/zed-vps-demo-infra),
on the standard `zed-terraform-state` S3 backend (key
`vps-demo/terraform.tfstate`) instead of this directory's old unlocked local
state. Nothing here is authoritative anymore — go there for plan/apply,
the data-volume safety rule, alarm response, and the restore runbook.
