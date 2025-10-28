#!/bin/bash

# Branch Reorganization Script
# This script creates a development branch from the current main
# and resets main to an earlier commit

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Commit hashes
DEVELOPMENT_COMMIT="93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad"
MAIN_COMMIT="5aa8a06cd07686cd635c3995121cd0dd0573dda9"

echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}Branch Reorganization Script${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

# Verify we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}Error: Not in a git repository${NC}"
    exit 1
fi

# Fetch all branches and commits
echo -e "${YELLOW}Fetching all branches and commits...${NC}"
git fetch --all --unshallow || git fetch --all

# Verify commits exist
echo -e "${YELLOW}Verifying commits exist...${NC}"
if ! git cat-file -e ${DEVELOPMENT_COMMIT} 2>/dev/null; then
    echo -e "${RED}Error: Commit ${DEVELOPMENT_COMMIT} not found${NC}"
    exit 1
fi

if ! git cat-file -e ${MAIN_COMMIT} 2>/dev/null; then
    echo -e "${RED}Error: Commit ${MAIN_COMMIT} not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Both commits verified${NC}"
echo ""

# Show what will happen
echo -e "${YELLOW}Planned changes:${NC}"
echo "  1. Create 'development' branch at commit ${DEVELOPMENT_COMMIT}"
git log --oneline -1 ${DEVELOPMENT_COMMIT} | sed 's/^/     /'
echo "  2. Reset 'main' branch to commit ${MAIN_COMMIT}"
git log --oneline -1 ${MAIN_COMMIT} | sed 's/^/     /'
echo ""

# Confirmation prompt
read -p "Do you want to proceed? This will modify branches (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Operation cancelled${NC}"
    exit 0
fi

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo -e "${YELLOW}Current branch: ${CURRENT_BRANCH}${NC}"

# Step 1: Create development branch
echo ""
echo -e "${YELLOW}Step 1: Creating development branch...${NC}"
if git show-ref --verify --quiet refs/heads/development; then
    echo -e "${YELLOW}Development branch already exists. Deleting...${NC}"
    git branch -D development
fi

git checkout -b development ${DEVELOPMENT_COMMIT}
echo -e "${GREEN}✓ Development branch created${NC}"

# Show development branch status
echo -e "${YELLOW}Development branch details:${NC}"
git log --oneline -5 | sed 's/^/  /'
echo ""

# Ask about pushing development branch
read -p "Push development branch to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Pushing development branch...${NC}"
    git push origin development || echo -e "${RED}Failed to push development branch${NC}"
    echo -e "${GREEN}✓ Development branch pushed${NC}"
else
    echo -e "${YELLOW}Skipped pushing development branch${NC}"
fi

# Step 2: Reset main branch
echo ""
echo -e "${YELLOW}Step 2: Resetting main branch...${NC}"
echo -e "${RED}⚠️  WARNING: This will force reset the main branch!${NC}"
read -p "Are you sure you want to reset main? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Main branch reset cancelled${NC}"
    echo -e "${GREEN}Development branch has been created successfully${NC}"
    exit 0
fi

# Checkout main
git checkout main

# Reset main
echo -e "${YELLOW}Resetting main to ${MAIN_COMMIT}...${NC}"
git reset --hard ${MAIN_COMMIT}
echo -e "${GREEN}✓ Main branch reset locally${NC}"

# Show main branch status
echo -e "${YELLOW}Main branch details:${NC}"
git log --oneline -5 | sed 's/^/  /'
echo ""

# Ask about force pushing main
echo -e "${RED}⚠️  WARNING: Force push to main requires admin permissions${NC}"
read -p "Force push main branch to remote? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Force pushing main branch...${NC}"
    if git push origin main --force; then
        echo -e "${GREEN}✓ Main branch force pushed${NC}"
    else
        echo -e "${RED}Failed to force push main branch${NC}"
        echo -e "${YELLOW}You may need admin permissions or to disable branch protection${NC}"
    fi
else
    echo -e "${YELLOW}Skipped force pushing main branch${NC}"
    echo -e "${YELLOW}To push manually later, run: git push origin main --force${NC}"
fi

# Final verification
echo ""
echo -e "${YELLOW}======================================${NC}"
echo -e "${GREEN}Branch reorganization completed!${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""
echo -e "${YELLOW}Branch status:${NC}"
git branch -vv | grep -E '(main|development)' | sed 's/^/  /'
echo ""
echo -e "${YELLOW}Visual graph (last 10 commits):${NC}"
git log --graph --oneline --all -10 | sed 's/^/  /'
echo ""

# Return to original branch if it still exists
if git show-ref --verify --quiet refs/heads/${CURRENT_BRANCH}; then
    git checkout ${CURRENT_BRANCH}
    echo -e "${GREEN}Returned to original branch: ${CURRENT_BRANCH}${NC}"
else
    echo -e "${YELLOW}Original branch no longer exists, staying on current branch${NC}"
fi

echo ""
echo -e "${GREEN}Done!${NC}"
