# Rakshak AI Live API Test Suite
$baseUrl = "https://scam-defender-honeypot-1-fi61.onrender.com"
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = "test_operator_$timestamp"
$testPass = "Rakshak@2026!Secure"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   🛡️ RAKSHAK AI DEFENSE PLATFORM - LIVE VERIFICATION" -ForegroundColor Cyan
Write-Host "   Target: $baseUrl" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

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

# 2. Registration & Token
$global:token = $null
Run-Test "Operator Registration & JWT Authentication" {
    $body = @{ username = $testUser; password = $testPass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/register" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 15
    $global:token = $res.token
    return @{
        Success = ($null -ne $res.token -and $res.token.Length -gt 20)
        Detail = "Operator Created: $testUser | Token: $($res.token.Substring(0, 20))..."
    }
}

# 3. Analyze Tech Support Scam
Run-Test "AI Scam Analysis: Tech Support & Remote Access" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Your Windows PC is infected with Zeus Trojan! Call Microsoft support immediately at 1-800-555-0199 and download AnyDesk."
        conversation_id = "thread-$timestamp-1"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam") -or $res.intent -like "*TECH*" -or $res.scam_score -gt 50)
        Detail = "Class: $($res.classification) | Intent: $($res.intent) | Score: $($res.scam_score) | Reply: $($res.reply)"
    }
}

# 4. Analyze Crypto & Wallet Scam
Run-Test "AI Scam Analysis: Crypto Doubler / Wallet Address" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Send 0.5 BTC to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa to get 1.0 BTC back immediately! Guaranteed 100% profit."
        conversation_id = "thread-$timestamp-2"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam") -or $res.scam_score -gt 50)
        Detail = "Class: $($res.classification) | Intent: $($res.intent) | Score: $($res.scam_score) | IOCs: $($res.extracted_intelligence -join ', ')"
    }
}

# 5. Analyze Lottery / Advance Fee Scam
Run-Test "AI Scam Analysis: Lottery & Prize Notification" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Congratulations! You have won Rs 25,00,000 in Kaun Banega Crorepati lucky draw. Transfer Rs 5,000 processing fee to claim."
        conversation_id = "thread-$timestamp-3"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam") -or $res.scam_score -gt 50)
        Detail = "Class: $($res.classification) | Intent: $($res.intent) | Score: $($res.scam_score)"
    }
}

# 6. Analyze OTP Theft / Phishing
Run-Test "AI Scam Analysis: Banking OTP & Credential Harvesting" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Dear Customer, your SBI YONO account will be blocked today. Please share the 6-digit OTP sent to your mobile to verify KYC."
        conversation_id = "thread-$timestamp-4"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -in @("scam", "likely_scam") -or $res.scam_score -gt 50)
        Detail = "Class: $($res.classification) | Intent: $($res.intent) | Threat Score: $($res.scam_score)"
    }
}

# 7. Benign Message (False Positive Check)
Run-Test "AI Scam Analysis: Benign False-Positive Filter" {
    $headers = @{ Authorization = "Bearer $($global:token)"; "Content-Type" = "application/json" }
    $body = @{
        text = "Hi mom, I will be home by 7 PM today. Please keep dinner ready."
        conversation_id = "thread-$timestamp-5"
    } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Headers $headers -Body $body -ContentType "application/json" -TimeoutSec 15
    return @{
        Success = ($res.classification -eq "benign" -or $res.scam_score -lt 40)
        Detail = "Class: $($res.classification) | Score: $($res.scam_score) (Expected Benign)"
    }
}

# 8. Personas Availability
Run-Test "Honeypot Personas Registry" {
    $headers = @{ Authorization = "Bearer $($global:token)" }
    $res = Invoke-RestMethod -Uri "$baseUrl/api/personas" -Method Get -Headers $headers -TimeoutSec 15
    return @{
        Success = ($res.Count -gt 0 -or $res.personas.Count -gt 0)
        Detail = "Available Personas: $($res | ConvertTo-Json -Compress)"
    }
}

# 9. Evidence Locker / Threat Cases
Run-Test "Cyber Threat Intelligence & Evidence Cases" {
    $headers = @{ Authorization = "Bearer $($global:token)" }
    $res = Invoke-RestMethod -Uri "$baseUrl/api/cases" -Method Get -Headers $headers -TimeoutSec 15
    return @{
        Success = ($res -is [array] -or $res.cases -is [array] -or $res.total -ge 0)
        Detail = "Active Recorded Intelligence Cases: $(if ($res.Count) { $res.Count } else { 0 })"
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY: $passed / $total Tests Passed ($([Math]::Round(($passed/$total)*100))%)" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })
Write-Host "========================================================" -ForegroundColor Cyan
