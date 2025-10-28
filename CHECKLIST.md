# ✅ Branch Reorganization Checklist

## Pre-Execution Phase

### Before Starting
- [ ] Read all documentation files:
  - [ ] `README_BRANCH_REORG.md` (main guide)
  - [ ] `BRANCH_REORGANIZATION.md` (detailed documentation)
  - [ ] `QUICK_GUIDE_ZH.md` (quick reference)
- [ ] Understand the changes:
  - [ ] Development branch will be at `93c0b2c` (current main)
  - [ ] Main branch will be reset to `5aa8a06` (earlier version)
- [ ] Verify you have:
  - [ ] Admin/maintainer permissions on the repository
  - [ ] Ability to force push to main branch
  - [ ] Access to GitHub branch protection settings

### Team Communication
- [ ] Notify all team members about the upcoming change
- [ ] Schedule a time when no one is actively working on main
- [ ] Inform about expected downtime (if any)
- [ ] Share the new branch structure plan

### Backup and Safety
- [ ] Create manual backup:
  ```bash
  git checkout main
  git branch backup-main-$(date +%Y%m%d_%H%M%S)
  git push origin backup-main-$(date +%Y%m%d_%H%M%S)
  ```
- [ ] Document current main commit: `93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad`
- [ ] List all open PRs and their base branches
- [ ] Screenshot or document current branch protection rules

### GitHub Settings
- [ ] Navigate to: Repository → Settings → Branches
- [ ] Temporarily modify "main" branch protection:
  - [ ] Allow force pushes (temporarily)
  - [ ] OR: Add yourself to bypass list
- [ ] Document original settings for restoration

## Execution Phase

### Choose Your Method

#### Option A: GitHub Actions Workflow (Recommended)
- [ ] Navigate to: Actions → Branch Reorganization
- [ ] Click "Run workflow"
- [ ] Enter "CONFIRM" in the confirmation field
- [ ] Select "Create backup branch" (recommended)
- [ ] Click "Run workflow" button
- [ ] Monitor the workflow execution
- [ ] Verify success in workflow summary

#### Option B: Automated Script
- [ ] Clone/pull the latest repository
- [ ] Navigate to repository directory
- [ ] Run: `./reorganize_branches.sh`
- [ ] Follow the interactive prompts
- [ ] Confirm each step when asked

#### Option C: Manual Execution
- [ ] Fetch all history: `git fetch --all --unshallow || git fetch --all`
- [ ] Create development branch:
  ```bash
  git checkout -b development 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
  git push origin development
  ```
- [ ] Reset main branch:
  ```bash
  git checkout main
  git reset --hard 5aa8a06cd07686cd635c3995121cd0dd0573dda9
  git push origin main --force
  ```

## Verification Phase

### Immediate Verification
- [ ] Verify main branch commit:
  ```bash
  git log origin/main -1 --oneline
  # Expected: 5aa8a06 feat: 整合記帳類別到預算分配選擇器
  ```
- [ ] Verify development branch commit:
  ```bash
  git log origin/development -1 --oneline
  # Expected: 93c0b2c fix: 增強錯誤日誌以診斷伺服器回應問題
  ```
- [ ] Visual check:
  ```bash
  git log --graph --oneline --all -20
  ```

### Branch Status Check
- [ ] Check all branches:
  ```bash
  git branch -a | grep -E '(main|development)'
  ```
- [ ] Verify remote branches:
  ```bash
  git ls-remote --heads origin | grep -E '(main|development)'
  ```

### Functional Testing
- [ ] Clone fresh copy in new directory
- [ ] Test checkout of main branch
- [ ] Test checkout of development branch
- [ ] Build and run tests on main branch
- [ ] Build and run tests on development branch

## Post-Execution Phase

### GitHub Settings Restoration
- [ ] Navigate to: Repository → Settings → Branches
- [ ] Restore original "main" branch protection rules:
  - [ ] Disable force pushes
  - [ ] Restore bypass list
  - [ ] Restore review requirements
- [ ] Verify protection rules are active

### Team Communication
- [ ] Announce completion to all team members
- [ ] Share instructions for updating local repositories:
  ```bash
  git fetch --all
  git checkout main
  git reset --hard origin/main
  git checkout development  # to get the new branch
  ```
- [ ] Remind about the new branch structure

### Pull Request Management
- [ ] Review all open PRs
- [ ] For each PR:
  - [ ] Note if base branch is "main"
  - [ ] Evaluate if it should target "development" instead
  - [ ] Update base branch if necessary
  - [ ] Notify PR author of changes

### CI/CD Updates
- [ ] Check CI/CD pipeline status
- [ ] Update any hardcoded "main" branch references
- [ ] Verify deployment configurations
- [ ] Test deployment from both branches

### Documentation Updates
- [ ] Update README if it references branches
- [ ] Update contributing guidelines
- [ ] Update development workflow documentation
- [ ] Add note about branch structure change

## Monitoring Phase (First 24-48 Hours)

### Watch For Issues
- [ ] Monitor for team member questions
- [ ] Check for failed CI/CD runs
- [ ] Watch for deployment issues
- [ ] Review error logs

### Support Team Members
- [ ] Be available for questions
- [ ] Help with local repository updates
- [ ] Assist with PR base branch changes
- [ ] Clarify new branching strategy

## Rollback Plan (If Needed)

### If Issues Occur
- [ ] Assess severity of issue
- [ ] Decide if rollback is necessary
- [ ] Execute rollback:
  ```bash
  git checkout main
  git reset --hard 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
  git push origin main --force
  
  # Optional: Remove development branch
  git push origin --delete development
  ```
- [ ] Notify team of rollback
- [ ] Investigate root cause
- [ ] Plan for retry

## Completion

### Final Verification
- [ ] All items in all phases completed
- [ ] No critical issues reported
- [ ] Team successfully updated their local repos
- [ ] CI/CD pipelines functioning
- [ ] Documentation updated

### Archive This Checklist
- [ ] Date completed: _______________
- [ ] Completed by: _______________
- [ ] Any issues encountered: _______________
- [ ] Notes: _______________

---

## Quick Reference Commands

### Check Current State
```bash
git log --oneline --graph --all -10
git branch -a
```

### Update Local Repository (For Team Members)
```bash
git fetch --all
git checkout main
git reset --hard origin/main
git checkout development
```

### Verify Branches
```bash
git log main -1 --oneline        # Should show 5aa8a06
git log development -1 --oneline  # Should show 93c0b2c
```

---

**Note**: This checklist is designed to be thorough. Not all items may apply to your specific situation. Use your judgment and adapt as needed.
