# Rakshak AI Full Live API Test Suite
$baseUrl = "https://scam-defender-honeypot-1-fi61.onrender.com"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = "operator_test_$timestamp"
$testPass = "Rakshak@2026!Secure"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "   🛡️ RAKSHAK AI DEFENSE PLATFORM - COMPREHENSIVE LIVE TEST" -ForegroundColor Cyan
Write-Host "   Target: $baseUrl" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$passed = 0
$total = 0

function Run-Test($name, $scriptBlock) {
    $script:total++
    Write-Host "`n[$($script:total)] Testing: $name..." -NoNewline
    try {
        $result = & $scriptBlock
        if ($result.Success) {
            Write-Host " [PASS]" -ForegroundColor Green
            if ($result.Detail) { Write-Host "    $($result.Detail)" -ForegroundColor Gray }
            $script:passed++
        } else {
            Write-Host " [FAIL]" -ForegroundColor Red
            if ($result.Detail) { Write-Host "    $($result.Detail)" -ForegroundColor Yellow }
        }
    } catch {
        Write-Host " [ERROR]" -ForegroundColor Red
        Write-Host "    $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 1. Health Check
Run-Test "System Health & Core Version" {
    $res = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 15
    return @{
        Success = ($res.status -eq "ok")
        Detail = "System: $($res.system) | Version: $($res.version)"
    }
}

# 2. Operator Registration & Token
$global:token = $null
Run-Test "Operator Registration & JWT Authentication" {
    $body = @{ username = $testUser; password = $testPass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/register" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15
    $global:token = $res.token
    return @{
        Success = ($null -ne $res.token -and $res.token.Length -gt 20)
        Detail = "Operator: $testUser | JWT Token Received (Length: $($res.token.Length))"
    }
}

# 3. Stats Endpoint
Run-Test "Real-time Threat & Scam Statistics (/api/stats)" {
    $headers = @{ Authorization = "Bearer $($global:token)" }
    $res = Invoke-RestMethod -Uri "$baseUrl/api/stats" -Method Get -Headers $headers -TimeoutSec 15
    return @{
        Success = ($null -ne $res)
        Detail = "Total Scams Detected: $($res.total_scams_detected) | Active Threads: $($res.active_honeypots) | Money Protected: Rs $($res.total_money_saved)"
    }
}

# 4. Analyze Tech Support Scam
Run-Test "AI Scam Analysis: Tech Support & Remote Access Tool" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Your Windows PC is infected with Zeus Trojan! Call Microsoft support immediately at 1-800-555-0199 and download AnyDesk to fix."
        conversation_id = "thread-$timestamp-1"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam"))
        Detail = "Verdict: $($res.classification.ToUpper()) | Type: $($res.scam_type) | Risk: $($res.risk_level)"
    }
}

# 5. Analyze Crypto Doubler
Run-Test "AI Scam Analysis: Crypto Doubler & BTC Address Extraction" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Send 0.5 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa to double your Bitcoin in 24 hours guaranteed!"
        conversation_id = "thread-$timestamp-2"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam"))
        Detail = "Verdict: $($res.classification.ToUpper()) | Extracted IOCs: $($res.extracted_intelligence -join ', ')"
    }
}

# 6. Analyze Banking OTP / Phishing
Run-Test "AI Scam Analysis: Banking OTP Harvesting" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Dear Customer, your HDFC netbanking will be suspended today. Share the 6-digit OTP sent to your number to complete KYC."
        conversation_id = "thread-$timestamp-3"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam"))
        Detail = "Verdict: $($res.classification.ToUpper()) | Flagged Threat Detected"
    }
}

# 7. AI Persona Response Generation
Run-Test "Honeypot Persona AI Response Generation (/api/generate-response)" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        sender_name = "Scammer_Alex"
        message = "Please send Rs 5000 processing fee immediately"
        classification = "scam"
        persona = "Grandma Betty"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/generate-response" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 20
    return @{
        Success = ($null -ne $res.response -and $res.response.Length -gt 5)
        Detail = "Persona: $($res.persona) | AI Bait Response: '$($res.response)'"
    }
}

# 8. Threat Intelligence Cases / Evidence Locker
Run-Test "Cyber Cell Evidence Cases (/api/cases)" {
    $headers = @{ Authorization = "Bearer $($global:token)" }
    $res = Invoke-RestMethod -Uri "$baseUrl/api/cases" -Method Get -Headers $headers -TimeoutSec 15
    return @{
        Success = ($null -ne $res)
        Detail = "Forensic Evidence Records Available: $(if ($res.Count) { $res.Count } else { 'Active' })"
    }
}

Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS: $passed / $total Tests Passed ($([Math]::Round(($passed/$total)*100))%)" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "=================================================================" -ForegroundColor Cyan
