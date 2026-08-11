terraform {
  backend "s3" {
    bucket         = "zed-terraform-state-us-east-2-935064898258"
    key            = "prod-us-east-2-shadow/ecs-api.tfstate"
    region         = "us-east-2"
    dynamodb_table = "zed-terraform-locks-us-east-2"
    encrypt        = true
  }
}
