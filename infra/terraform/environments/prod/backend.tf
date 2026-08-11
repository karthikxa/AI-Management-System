terraform {
  backend "s3" {
    bucket         = "zed-terraform-state"
    key            = "prod/ecs-api.tfstate"
    region         = "us-west-2"
    dynamodb_table = "zed-terraform-locks"
    encrypt        = true
  }
}
