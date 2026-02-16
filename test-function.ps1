$uri = "https://rtwkhggnjytdijwfewcn.supabase.co/functions/v1/ask"
$headers = @{
    "Authorization" = "Bearer sb_publishable_v3gupYmHl3bHIkZvKblDyA_qQvFZQ3a"
    "Content-Type" = "application/json"
}
$body = '{"question": "What is force?"}'

try {
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $body
    Write-Output "Success:"
    Write-Output ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Output "Error Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Output "Error Message:"
    $streamReader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Output $streamReader.ReadToEnd()
    $streamReader.Close()
}
