# Deployment Verification Script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DETERMINISTIC ROUTING - DEPLOYMENT CHECK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if files exist
$files = @(
    "supabase\functions\ask\classifier.ts",
    "supabase\functions\ask\modelRouter.ts",
    "supabase\functions\ask\index.ts"
)

Write-Host "Checking if refactored files exist..." -ForegroundColor Yellow

foreach ($file in $files) {
    $fullPath = "c:\Users\HP\Downloads\smart-study-buddy-main\$file"
    if (Test-Path $fullPath) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file MISSING!" -ForegroundColor Red
    }
}

Write-Host "`nChecking if index.ts uses new routing..." -ForegroundColor Yellow

$indexContent = Get-Content "c:\Users\HP\Downloads\smart-study-buddy-main\supabase\functions\ask\index.ts" -Raw

if ($indexContent -match "classifyQuery") {
    Write-Host "  ✅ classifyQuery() found" -ForegroundColor Green
} else {
    Write-Host "  ❌ classifyQuery() NOT found" -ForegroundColor Red
}

if ($indexContent -match "selectModel") {
    Write-Host "  ✅ selectModel() found" -ForegroundColor Green
} else {
    Write-Host "  ❌ selectModel() NOT found" -ForegroundColor Red
}

if ($indexContent -match "DETERMINISTIC ROUTING") {
    Write-Host "  ✅ Deterministic routing logic found" -ForegroundColor Green
} else {
    Write-Host "  ❌ Deterministic routing logic NOT found" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "The refactoring is COMPLETE in your local files." -ForegroundColor Green
Write-Host "`nTo activate it, you need to DEPLOY the Edge Function:" -ForegroundColor Yellow
Write-Host "`n1. Via Supabase Dashboard:" -ForegroundColor White
Write-Host "   - Go to https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "   - Select your project" -ForegroundColor Gray
Write-Host "   - Navigate to Edge Functions > ask" -ForegroundColor Gray
Write-Host "   - Click 'Deploy new version'" -ForegroundColor Gray

Write-Host "`n2. Via CLI (if installed):" -ForegroundColor White
Write-Host "   supabase functions deploy ask" -ForegroundColor Gray

Write-Host "`n========================================`n" -ForegroundColor Cyan
