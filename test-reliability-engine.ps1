# AI Trust & Reliability Engine - Validation Test
# Test with: "What is photosynthesis?"
# 
# Expected Results:
# - Coverage > 0
# - Hallucination < 20%
# - Trust score consistent
# - No value above 100%

$uri = "http://localhost:54321/functions/v1/ask"
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer YOUR_ANON_KEY_HERE"
}

$body = @{
    question = "What is photosynthesis?"
} | ConvertTo-Json

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TESTING AI TRUST & RELIABILITY ENGINE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Question: What is photosynthesis?" -ForegroundColor Yellow
Write-Host "`nSending request to Edge Function..." -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
    
    Write-Host "`n✅ Response received successfully!`n" -ForegroundColor Green
    
    # Extract metrics
    $trustScore = $response.trust_score
    $hallucinationScore = $response.hallucination_score
    $coverageScore = $response.context_completeness_score
    $confidenceScore = $response.confidence_score
    
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RELIABILITY METRICS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "`n📊 Trust Score: $trustScore%" -ForegroundColor $(if ($trustScore -ge 0 -and $trustScore -le 100) { "Green" } else { "Red" })
    Write-Host "⚠️  Hallucination Score: $hallucinationScore%" -ForegroundColor $(if ($hallucinationScore -lt 20) { "Green" } else { "Red" })
    Write-Host "📚 Coverage Score: $coverageScore%" -ForegroundColor $(if ($coverageScore -gt 0) { "Green" } else { "Red" })
    Write-Host "🎯 Confidence Score: $([math]::Round($confidenceScore * 100, 1))%" -ForegroundColor Green
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "VALIDATION RESULTS" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Validation checks
    $allPassed = $true
    
    # Check 1: Coverage > 0
    if ($coverageScore -gt 0) {
        Write-Host "✅ Coverage > 0: PASS ($coverageScore%)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Coverage > 0: FAIL ($coverageScore%)" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Check 2: Hallucination < 20%
    if ($hallucinationScore -lt 20) {
        Write-Host "✅ Hallucination < 20%: PASS ($hallucinationScore%)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Hallucination < 20%: FAIL ($hallucinationScore%)" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Check 3: Trust score consistent (between 0 and 100)
    if ($trustScore -ge 0 -and $trustScore -le 100) {
        Write-Host "✅ Trust Score 0-100: PASS ($trustScore%)" -ForegroundColor Green
    }
    else {
        Write-Host "❌ Trust Score 0-100: FAIL ($trustScore%)" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Check 4: No value above 100%
    if ($trustScore -le 100 -and $hallucinationScore -le 100 -and $coverageScore -le 100) {
        Write-Host "✅ No value above 100%: PASS" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No value above 100%: FAIL" -ForegroundColor Red
        $allPassed = $false
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    if ($allPassed) {
        Write-Host "🎉 ALL VALIDATION TESTS PASSED!" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  SOME TESTS FAILED - REVIEW NEEDED" -ForegroundColor Red
    }
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "`nAdditional Info:" -ForegroundColor Gray
    Write-Host "Model: $($response.model_used)" -ForegroundColor Gray
    Write-Host "Risk Level: $($response.risk_level)" -ForegroundColor Gray
    Write-Host "Covered Topics: $($response.covered_topics.Count)" -ForegroundColor Gray
    
}
catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception -ForegroundColor Red
}
