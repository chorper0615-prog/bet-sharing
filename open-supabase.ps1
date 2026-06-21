Write-Host "正在打开 Supabase 控制台 SQL 编辑器..." -ForegroundColor Cyan
Write-Host ""
Write-Host "请按以下步骤操作：" -ForegroundColor Yellow
Write-Host "  1. 登录你的 Supabase 账号（如果未登录）" -ForegroundColor White
Write-Host "  2. 点击 SQL 编辑器左侧的按钮" -ForegroundColor White  
Write-Host "  3. 复制下方的 SQL 到编辑器中" -ForegroundColor White
Write-Host "  4. 点击运行 (Run / Ctrl+Enter)" -ForegroundColor White
Write-Host ""

# Display the SQL
Write-Host "===== 请复制下方 SQL =====" -ForegroundColor Green
Get-Content "C:\Users\zhang0615\Desktop\333\supabase-bet-shares.sql" -Tail 4
Write-Host "==========================" -ForegroundColor Green
Write-Host ""

# Open the SQL file
Write-Host "正在打开 SQL 文件..." -ForegroundColor Cyan
Invoke-Item "C:\Users\zhang0615\Desktop\333\supabase-bet-shares.sql"

# Open the Supabase dashboard
Write-Host "正在打开 Supabase 控制台..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/bufylnzgwubahttxbsaw/sql/new"
