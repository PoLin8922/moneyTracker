# Branch Reorganization Guide

## Objective
Reorganize the repository branches as follows:
1. Create a new `development` branch at commit `93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad`
2. Reset the `main` branch back to commit `5aa8a06cd07686cd635c3995121cd0dd0573dda9`

## Commits Information

### Target Development Branch (93c0b2c)
- **Commit**: 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
- **Message**: fix: 增強錯誤日誌以診斷伺服器回應問題
- **Description**: This is the current tip of the main branch, containing all the latest features including:
  - Unified category management system
  - Enhanced error logging
  - Category loading diagnostics
  - Ledger dialog improvements
  - Various bug fixes and documentation

### Target Main Branch (5aa8a06)
- **Commit**: 5aa8a06cd07686cd635c3995121cd0dd0573dda9
- **Message**: feat: 整合記帳類別到預算分配選擇器
- **Description**: An earlier stable version with budget allocation category integration

## Changes Between Versions

The difference between these two commits includes:
- **26 files changed**
- **3,748 lines added, 81 lines removed**

Major changes being rolled back from main:
- Unified category management system (backend and frontend)
- Category management dialog
- Enhanced ledger entry dialog
- Multiple bug fixes and improvements
- Extensive documentation files

## Manual Execution Steps

**⚠️ IMPORTANT**: These operations require force push and should be performed carefully with proper backups.

### Prerequisites
```bash
# Ensure you have the full repository history
git fetch --all --unshallow

# Verify the commits exist
git show 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
git show 5aa8a06cd07686cd635c3995121cd0dd0573dda9
```

### Step 1: Create Development Branch
```bash
# Create development branch from current main (93c0b2c)
git checkout -b development 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad

# Verify the branch is at the correct commit
git log -1

# Push the new development branch to remote
git push origin development
```

### Step 2: Reset Main Branch
```bash
# Checkout main branch
git checkout main

# Reset main to the earlier commit (5aa8a06)
git reset --hard 5aa8a06cd07686cd635c3995121cd0dd0573dda9

# Verify the reset
git log -1

# Force push the main branch (REQUIRES ADMIN PERMISSIONS)
git push origin main --force
```

### Step 3: Verification
```bash
# Verify main branch
git checkout main
git log --oneline -5

# Verify development branch
git checkout development
git log --oneline -5

# Check branch divergence
git log --oneline --graph --all -20
```

## Automated Script

An automated script `reorganize_branches.sh` is provided in this repository to perform these operations.

## Safety Considerations

1. **Backup**: Before executing, ensure you have backups of important data
2. **Permissions**: Force pushing to main requires admin/maintainer permissions
3. **Team Communication**: Notify all team members before reorganizing branches
4. **CI/CD**: Check if any CI/CD pipelines will be affected
5. **Protected Branches**: Main branch protection rules may need to be temporarily disabled

## Rollback Plan

If you need to rollback these changes:
```bash
# Restore main to 93c0b2c
git checkout main
git reset --hard 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
git push origin main --force

# Delete development branch if needed
git branch -D development
git push origin --delete development
```

## Expected Result

After successful execution:
- **main branch**: Points to commit 5aa8a06 (feat: 整合記帳類別到預算分配選擇器)
- **development branch**: Points to commit 93c0b2c (fix: 增強錯誤日誌以診斷伺服器回應問題)

The development branch will contain all the latest features, while main will be at the earlier stable version.
