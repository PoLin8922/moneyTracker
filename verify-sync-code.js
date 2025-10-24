#!/usr/bin/env node

/**
 * 驗證 sync-prices API 代碼是否存在
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 驗證投資帳戶同步代碼...\n');

// 讀取 routes.ts
const routesPath = path.join(__dirname, 'server', 'routes.ts');
const routesContent = fs.readFileSync(routesPath, 'utf-8');

// 檢查關鍵代碼是否存在
const checks = [
  {
    name: 'sync-prices 路由',
    pattern: /app\.post\('\/api\/investments\/sync-prices'/,
    required: true
  },
  {
    name: '帳戶餘額同步邏輯',
    pattern: /同步投資帳戶餘額/,
    required: true
  },
  {
    name: 'accountsUpdated 變數',
    pattern: /let accountsUpdated/,
    required: true
  },
  {
    name: 'accountBalances Map',
    pattern: /const accountBalances = new Map/,
    required: true
  },
  {
    name: '更新帳戶餘額',
    pattern: /storage\.updateAssetAccount\(accountId/,
    required: true
  },
  {
    name: 'accountsUpdated 回應',
    pattern: /accountsUpdated,/,
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const found = check.pattern.test(routesContent);
  const status = found ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${found ? '存在' : '缺失'}`);
  
  if (check.required && !found) {
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ 所有必要代碼都已存在！');
  console.log('\n本地代碼正確，問題在於 Render 未部署最新版本。');
  console.log('\n建議操作：');
  console.log('1. 前往 Render Dashboard');
  console.log('2. 取消當前部署（如果卡住）');
  console.log('3. 手動觸發新部署');
  console.log('4. 或等待自動部署完成（可能需要 5-10 分鐘）');
} else {
  console.log('❌ 代碼不完整！');
  console.log('\n請確認是否正確 commit 和 push 了所有變更。');
}

console.log('='.repeat(50) + '\n');

// 顯示最近的 commits
console.log('📝 最近的 commits:');
const { execSync } = require('child_process');
try {
  const commits = execSync('git log --oneline -5', { encoding: 'utf-8 ' });
  console.log(commits);
} catch (err) {
  console.log('無法讀取 git log');
}

// 檢查是否有未 push 的 commits
try {
  const unpushed = execSync('git log origin/main..HEAD --oneline', { encoding: 'utf-8' });
  if (unpushed.trim()) {
    console.log('⚠️  警告：有未 push 的 commits:');
    console.log(unpushed);
    console.log('請執行: git push origin main');
  } else {
    console.log('✅ 所有 commits 都已 push 到 origin/main');
  }
} catch (err) {
  console.log('無法檢查 git push 狀態');
}
