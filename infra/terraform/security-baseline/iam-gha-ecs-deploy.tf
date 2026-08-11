# ════════════════════════════════════════════════════════════════════════════
# zed-gha-ecs-deploy — the GitHub Actions OIDC role every CI ECS roll assumes
# (infra/scripts/ecs-deploy.sh via deploy-dev.yml / deploy-gateway-dev.yml /
# deploy-staging.yml / deploy-prod.yml).
#
# HISTORY / WHY THIS LIVES HERE: the role was created out-of-band and then
# hand-patched whenever it fell behind — most recently on the night of
# v0.10.0/v0.10.1 (2026-07-14/15), when the prod deploy-ecs job failed twice on
# IAM while the release announced anyway: the policy was missing the eu-west-2
# (prod) resources, the staging PassRole pair, and the GATEWAY task/exec roles
# (the prod gateway task-def that night had to be registered manually by a
# human). This file is the system-of-record for the CORRECTED policy:
#   - ECS resources region-wildcarded (dev/staging = us-west-2, prod = eu-west-2)
#   - PassRole for the task+exec roles of all production release services:
#     zed-{dev,staging,prod} (api) and zed-{dev,staging,prod}-gateway
#     plus the pre-cutover US East 2 API and gateway shadow services
#     (the ecs-api TF module names roles "<service>-exec"/"<service>-task")
#   - Secrets Manager read of every zed-<env>-env blob (the task-def renderer
#     wires each blob key as a container secret)
# Reconciled with the live role on 2026-07-16 (the missing gateway PassRole
# ARNs were added live the same day). Adopt with the import blocks below —
# `terraform plan` must show an empty diff; if it doesn't, live drifted again
# and THIS file wins.
# ════════════════════════════════════════════════════════════════════════════

data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_role" "gha_ecs_deploy" {
  name = "zed-gha-ecs-deploy"
  # Any ref of the canonical repo may assume the role: dev deploys run from
  # `main` and `gateway`, staging from `staging`, prod from `prod`.
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = data.aws_iam_openid_connect_provider.github_actions.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:zed-ai/suna:*"
        }
      }
    }]
  })
  tags = {
    ManagedBy  = "terraform"
    Name       = "zed-gha-ecs-deploy"
    Stack      = "security-baseline"
    Compliance = "soc2"
  }
}

resource "aws_iam_role_policy" "gha_ecs_deploy" {
  # checkov:skip=CKV_AWS_355: TaskDefinitionLifecycle and
  # DescribeLoadBalancers require "*" because these APIs do not support
  # resource-level permissions; every other statement is ARN-scoped.
  name = "ecs-deploy"
  role = aws_iam_role.gha_ecs_deploy.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "UpdateZedServices"
        Effect = "Allow"
        Action = ["ecs:UpdateService"]
        # Region-wildcarded: dev/staging ECS run in us-west-2, prod in eu-west-2.
        # cluster name == service name for every zed ECS service.
        Resource = ["arn:aws:ecs:*:${local.account_id}:service/zed-*/zed-*"]
      },
      {
        Sid      = "DescribeZedServices"
        Effect   = "Allow"
        Action   = ["ecs:DescribeServices"]
        Resource = ["arn:aws:ecs:*:${local.account_id}:service/zed-*/zed-*"]
      },
      {
        Sid    = "DescribeZedTasks"
        Effect = "Allow"
        Action = ["ecs:DescribeTasks", "ecs:ListTasks"]
        # Tasks/list are scoped by cluster through the task/container-instance
        # ARN path; zed clusters all match zed-*.
        Resource = [
          "arn:aws:ecs:*:${local.account_id}:task/zed-*/*",
          "arn:aws:ecs:*:${local.account_id}:container-instance/zed-*/*",
        ]
        Condition = {
          ArnLike = {
            "ecs:cluster" = "arn:aws:ecs:*:${local.account_id}:cluster/zed-*"
          }
        }
      },
      {
        # RegisterTaskDefinition/DescribeTaskDefinition do not support
        # resource-level permissions (AWS SAR table) — "*" is the only valid
        # resource for them; see the checkov skip on this resource.
        Sid    = "TaskDefinitionLifecycle"
        Effect = "Allow"
        Action = [
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
        ]
        Resource = "*"
      },
      {
        # The US shadow workflow resolves each ALB DNS name before updating its
        # Cloudflare CNAME. DescribeLoadBalancers supports no resource ARN.
        Sid      = "DescribeLoadBalancers"
        Effect   = "Allow"
        Action   = ["elasticloadbalancing:DescribeLoadBalancers"]
        Resource = "*"
      },
      {
        Sid    = "PassTaskRoles"
        Effect = "Allow"
        Action = ["iam:PassRole"]
        # register-task-definition passes each service's exec+task role. BOTH
        # service kinds per env: the api services (zed-<env>) AND the gateway
        # services (zed-<env>-gateway) — omitting the gateway pair is exactly
        # what broke the v0.10.x prod gateway roll.
        Resource = [
          "arn:aws:iam::${local.account_id}:role/zed-dev-task",
          "arn:aws:iam::${local.account_id}:role/zed-dev-exec",
          "arn:aws:iam::${local.account_id}:role/zed-dev-gateway-task",
          "arn:aws:iam::${local.account_id}:role/zed-dev-gateway-exec",
          "arn:aws:iam::${local.account_id}:role/zed-staging-task",
          "arn:aws:iam::${local.account_id}:role/zed-staging-exec",
          "arn:aws:iam::${local.account_id}:role/zed-staging-gateway-task",
          "arn:aws:iam::${local.account_id}:role/zed-staging-gateway-exec",
          "arn:aws:iam::${local.account_id}:role/zed-prod-task",
          "arn:aws:iam::${local.account_id}:role/zed-prod-exec",
          "arn:aws:iam::${local.account_id}:role/zed-prod-gateway-task",
          "arn:aws:iam::${local.account_id}:role/zed-prod-gateway-exec",
          "arn:aws:iam::${local.account_id}:role/zed-prod-use2-task",
          "arn:aws:iam::${local.account_id}:role/zed-prod-use2-exec",
          "arn:aws:iam::${local.account_id}:role/zed-prod-use2-gateway-task",
          "arn:aws:iam::${local.account_id}:role/zed-prod-use2-gateway-exec",
        ]
      },
    ]
  })
}

resource "aws_iam_role_policy" "gha_ecs_deploy_secrets" {
  name = "ecs-deploy-secrets-read"
  role = aws_iam_role.gha_ecs_deploy.id
  # ecs-deploy.sh reads the per-env blob to render every key into the task-def
  # as a container secret. Region-wildcarded like the ECS statements; the `-*`
  # tail matches Secrets Manager's random ARN suffix. The staging deployment
  # also refreshes zed-staging-env from GitHub's staging-only data-plane
  # secrets. Keep that write grant limited to the staging blob.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ReadZedEnvironmentSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = "arn:aws:secretsmanager:*:${local.account_id}:secret:zed-*-env-*"
      },
      {
        Sid    = "WriteStagingSecret"
        Effect = "Allow"
        Action = [
          "secretsmanager:CreateSecret",
          "secretsmanager:PutSecretValue",
        ]
        Resource = "arn:aws:secretsmanager:us-west-2:${local.account_id}:secret:zed-staging-env-*"
      },
    ]
  })
}

# ── One-shot adoption of the live role (created out-of-band) ──────────────────
# Delete these blocks after the first clean `terraform plan`.
import {
  to = aws_iam_role.gha_ecs_deploy
  id = "zed-gha-ecs-deploy"
}
import {
  to = aws_iam_role_policy.gha_ecs_deploy
  id = "zed-gha-ecs-deploy:ecs-deploy"
}
import {
  to = aws_iam_role_policy.gha_ecs_deploy_secrets
  id = "zed-gha-ecs-deploy:ecs-deploy-secrets-read"
}
