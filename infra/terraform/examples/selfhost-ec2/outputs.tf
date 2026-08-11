output "public_ip" {
  value = module.zed_selfhost.public_ip
}

output "dashboard_url" {
  value = module.zed_selfhost.dashboard_url
}

output "api_url" {
  value = module.zed_selfhost.api_url
}

output "ssm_connect_command" {
  value = module.zed_selfhost.ssm_connect_command
}

output "post_apply_next_steps" {
  value = module.zed_selfhost.post_apply_next_steps
}
