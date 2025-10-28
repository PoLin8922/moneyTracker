# 分支重組快速指南 (Branch Reorganization Quick Guide)

## 目標 (Objective)
將版本 93c0b2c 變成 development 分支，main 分支回到 5aa8a06

## 快速執行 (Quick Execution)

### 方法 1: 使用自動化腳本 (Recommended)
```bash
./reorganize_branches.sh
```

### 方法 2: 手動執行
```bash
# 1. 建立 development 分支
git checkout -b development 93c0b2ce4c2f8895e7ce85e7d6193d03b5d364ad
git push origin development

# 2. 重置 main 分支
git checkout main
git reset --hard 5aa8a06cd07686cd635c3995121cd0dd0573dda9
git push origin main --force  # 需要管理員權限
```

## 注意事項 (Important Notes)
- ⚠️ 需要管理員權限才能 force push 到 main
- ⚠️ 執行前請通知團隊成員
- ⚠️ 建議先備份重要資料
- ✅ development 分支將包含最新的功能
- ✅ main 分支將回到較早的穩定版本

## 詳細文件 (Detailed Documentation)
請參閱 `BRANCH_REORGANIZATION.md` 了解完整說明

## 驗證 (Verification)
```bash
# 檢查分支狀態
git branch -vv

# 檢查 main 是否在 5aa8a06
git log main -1

# 檢查 development 是否在 93c0b2c  
git log development -1
```

## 如果遇到問題 (Troubleshooting)
1. **權限不足**: 聯繫倉庫管理員
2. **Branch protection**: 需要暫時關閉 main 分支保護
3. **Conflicts**: 確保本地沒有未提交的更改

## 技術支援 (Support)
如有問題，請參閱 `BRANCH_REORGANIZATION.md` 的詳細說明或聯繫團隊。
