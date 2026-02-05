#!/bin/bash
# Script to add categorization topics to DevExpGbb repos
# Topics follow the format:
#   - Category: github-copilot, ghas, github-platform
#   - Type: code, design-guidance, migration-guidance, blog, level-up, demo-online, demo-deployable

ORG="DevExpGbb"

add_topics() {
  local repo=$1
  shift
  local topics=("$@")
  
  echo "📦 $repo: ${topics[*]}"
  
  # Get existing topics
  existing=$(gh repo view "$ORG/$repo" --json repositoryTopics -q '.repositoryTopics[].name' 2>/dev/null | tr '\n' ' ')
  
  # Add new topics (gh api handles duplicates gracefully)
  for topic in "${topics[@]}"; do
    gh repo edit "$ORG/$repo" --add-topic "$topic" 2>/dev/null
  done
}

echo "🚀 Adding categorization topics to DevExpGbb repos..."
echo ""

# GitHub Copilot repos
add_topics "agentic-devops-demo" "github-copilot" "demo-deployable"
add_topics "ai-native-dev-lab" "github-copilot" "level-up"
add_topics "platform-mode" "github-copilot" "code"
add_topics "vscode-ghcp-starter-kit" "github-copilot" "code"
add_topics "github-copilot-office-hours" "github-copilot" "level-up"
add_topics "xamarin-to-maui-ghcp-demo" "github-copilot" "migration-guidance"
add_topics "demo-cobol-knowledge-base" "github-copilot" "design-guidance"
add_topics "Cobol-Demo" "github-copilot" "code"
add_topics "ado-github-copilot-extension" "github-copilot" "code"
add_topics "rk-testing-gh-copilot-azure-agent-on-codespaces" "github-copilot" "demo-online"
add_topics "GitHubCopilotLicenseAssignment" "github-copilot" "code"

# GHAS repos
add_topics "sec-check" "ghas" "code"
add_topics "dependency-review-demo" "ghas" "demo-online"

# GitHub Platform repos
add_topics "devexpgbb.github.io" "github-platform" "code"
add_topics "agentic-platform-engineering" "github-platform" "demo-deployable"
add_topics "three-horizons-v1.2" "github-platform" "demo-deployable"
add_topics "samples" "github-platform" "code"
add_topics ".github" "github-platform" "code"
add_topics "30-days-of-platform-engineering" "github-platform" "level-up"
add_topics "devcenter-catalog" "github-platform" "code"
add_topics "azure-dev-center-demos" "github-platform" "demo-deployable"
add_topics "common-terraform-modules" "github-platform" "code"
add_topics "project-protomatter-bootstrap-template-repo" "github-platform" "demo-deployable"
add_topics "codespaces-azure-nas" "github-platform" "demo-deployable"
add_topics "rk-github-demo" "github-platform" "demo-online"
add_topics "gitops-demo" "github-platform" "demo-deployable"
add_topics "mlflow-codespaces" "github-platform" "demo-deployable"
add_topics "github-azure-workload-identity" "github-platform" "code"
add_topics "streamlit-codespaces" "github-platform" "demo-deployable"

echo ""
echo "✅ Done! Topics added successfully."
