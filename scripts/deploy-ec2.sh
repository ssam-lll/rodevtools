#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REGISTRY="357633902747.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPO="${ECR_REGISTRY}/rodevtools-backend"
IMAGE_TAG="${1:-latest}"

systemctl is-active --quiet docker || (dnf install -y docker && systemctl enable --now docker)

if ! swapon --show | grep -q '/swapfile'; then
  dd if=/dev/zero of=/swapfile bs=1M count=1024
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile swap swap defaults 0 0' >> /etc/fstab

fetch_ssm() {
  aws ssm get-parameter \
    --region "$AWS_REGION" \
    --name "/rodevtools/prod/$1" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text
}

ENV_FILE="$(mktemp /tmp/rodevtools-env.XXXXXX)"
chmod 600 "$ENV_FILE"
trap 'rm -f "$ENV_FILE"' EXIT

cat > "$ENV_FILE" <<EOF
SPRING_PROFILES_ACTIVE=prod
SUPABASE_DB_URL=$(fetch_ssm SUPABASE_DB_URL)
SUPABASE_DB_USERNAME=$(fetch_ssm SUPABASE_DB_USERNAME)
SUPABASE_DB_PASSWORD=$(fetch_ssm SUPABASE_DB_PASSWORD)
JWT_SECRET=$(fetch_ssm JWT_SECRET)
APP_API_KEY=$(fetch_ssm APP_API_KEY)
SPRING_MVC_CORS_ALLOWED_ORIGINS=$(fetch_ssm SPRING_MVC_CORS_ALLOWED_ORIGINS 2>/dev/null || echo 'http://localhost:*,http://127.0.0.1:*,http://[::1]:*')
EOF

aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker pull "${ECR_REPO}:${IMAGE_TAG}"

docker rm -f rodevtools-backend 2>/dev/null || true

docker run -d \
  --name rodevtools-backend \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file "$ENV_FILE" \
  "${ECR_REPO}:${IMAGE_TAG}"

rm -f "$ENV_FILE"

for _ in $(seq 1 24); do
  if curl -fsS http://localhost:8080/actuator/health 2>/dev/null | grep -q '"UP"'; then
    docker image prune -f
    exit 0
  fi
  sleep 5
done

docker logs rodevtools-backend --tail 50
exit 1
