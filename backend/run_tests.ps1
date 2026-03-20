$baseUrl = "http://localhost:3000/api"
$ErrorActionPreference = "Stop"

function Write-TestResult {
    param([string]$Name, [bool]$Passed, [string]$Details = "")
    if ($Passed) {
        Write-Host "[PASS] $Name" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        if ($Details) { Write-Host "       Details: $Details" -ForegroundColor Yellow }
    }
}

Write-Host "--- API Test Suite Start ---" -ForegroundColor Cyan

# 1. Test Auth: Invalid Login
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{username="admin"; password="wrongpassword"} | ConvertTo-Json) -ContentType "application/json"
    Write-TestResult "Invalid Login" $false "Expected 401 but succeeded"
} catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-TestResult "Invalid Login" $true 
    } else {
        Write-TestResult "Invalid Login" $false $_.Exception.Message
    }
}

# 2. Test Auth: Valid Login
$token = $null
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{username="admin"; password="admin"} | ConvertTo-Json) -ContentType "application/json"
    if ($response.token) { 
        $token = $response.token
        Write-TestResult "Valid Login" $true 
    } else { 
        Write-TestResult "Valid Login" $false "No token returned" 
    }
} catch {
    Write-TestResult "Valid Login" $false $_.Exception.Message
}

$headers = @{Authorization="Bearer $token"}

# 3. Test Tags: Get without token
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tags" -Method Get
    Write-TestResult "Get Tags (Unauthorized)" $false "Expected 401 but succeeded"
} catch {
    if ($_.Exception.Response.StatusCode -eq "Unauthorized") {
        Write-TestResult "Get Tags (Unauthorized)" $true 
    } else {
        Write-TestResult "Get Tags (Unauthorized)" $false $_.Exception.Message
    }
}

# 4. Test Tags: Create Tag
$testEpc = "TEST-EPC-" + (Get-Random)
try {
    $newTag = Invoke-RestMethod -Uri "$baseUrl/tags" -Method Post -Headers $headers -Body (@{epc=$testEpc; name="Test Tag"; category="Test"; location="Lab"} | ConvertTo-Json) -ContentType "application/json"
    if ($newTag.epc -eq $testEpc) { Write-TestResult "Create Tag" $true } else { Write-TestResult "Create Tag" $false "Returned EPC didn't match" }
} catch {
    Write-TestResult "Create Tag" $false $_.Exception.Message
}

# 5. Test Tags: Get Tags
try {
    $tags = Invoke-RestMethod -Uri "$baseUrl/tags" -Method Get -Headers $headers
    if ($tags.Length -ge 1) { Write-TestResult "Get Tags (Authorized)" $true } else { Write-TestResult "Get Tags (Authorized)" $false "No tags returned" }
} catch {
    Write-TestResult "Get Tags (Authorized)" $false $_.Exception.Message
}

# 6. Test Tags: Update Tag
try {
    $updatedTag = Invoke-RestMethod -Uri "$baseUrl/tags/$testEpc" -Method Patch -Headers $headers -Body (@{name="Updated Test Tag"} | ConvertTo-Json) -ContentType "application/json"
    if ($updatedTag.name -eq "Updated Test Tag") { Write-TestResult "Update Tag" $true } else { Write-TestResult "Update Tag" $false "Name not updated" }
} catch {
    Write-TestResult "Update Tag" $false $_.Exception.Message
}

# 7. Test Tags: Bulk Update
try {
    $bulkData = @(
        @{epc=$testEpc; name="Bulk Updated Tag"},
        @{epc="NEW-EPC"; name="New Bulk Tag"; category="Test"; location="Lab"}
    )
    $bulkResponse = Invoke-RestMethod -Uri "$baseUrl/tags/bulk" -Method Patch -Headers $headers -Body ($bulkData | ConvertTo-Json) -ContentType "application/json"
    if ($bulkResponse.success -eq $true) { Write-TestResult "Bulk Update Tags" $true } else { Write-TestResult "Bulk Update Tags" $false "Success flag false" }
} catch {
    Write-TestResult "Bulk Update Tags" $false $_.Exception.Message
}

# 8. Test Sessions: Create Session
$sessionId = $null
try {
    $sessionData = @{
        name = "Test Session"
        scans = @(
            @{epc=$testEpc; rssi=-50; time=(Get-Date).ToString("o")},
            @{epc="NEW-EPC"; rssi=-60; time=(Get-Date).ToString("o")}
        )
    }
    $newSession = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Post -Headers $headers -Body ($sessionData | ConvertTo-Json -Depth 3) -ContentType "application/json"
    if ($newSession.id) { 
        $sessionId = $newSession.id
        Write-TestResult "Create Session" $true 
    } else { 
        Write-TestResult "Create Session" $false "No session ID returned" 
    }
} catch {
    Write-TestResult "Create Session" $false $_.Exception.Message
}

# 9. Test Sessions: Get All Sessions
try {
    $sessions = Invoke-RestMethod -Uri "$baseUrl/sessions" -Method Get -Headers $headers
    if ($sessions.Length -ge 1) { Write-TestResult "Get All Sessions" $true } else { Write-TestResult "Get All Sessions" $false "No sessions returned" }
} catch {
    Write-TestResult "Get All Sessions" $false $_.Exception.Message
}

# 10. Test Sessions: Get Specific Session
try {
    if ($sessionId) {
        $sessionDetails = Invoke-RestMethod -Uri "$baseUrl/sessions/$sessionId" -Method Get -Headers $headers
        if ($sessionDetails.scans.Length -gt 0) { Write-TestResult "Get Specific Session" $true } else { Write-TestResult "Get Specific Session" $false "No scans in session details" }
    } else {
        Write-TestResult "Get Specific Session" $false "Skipped due to missing sessionId"
    }
} catch {
    Write-TestResult "Get Specific Session" $false $_.Exception.Message
}

# 11. Test Tags: Delete Tags
try {
    $delResponse1 = Invoke-RestMethod -Uri "$baseUrl/tags/$testEpc" -Method Delete -Headers $headers
    $delResponse2 = Invoke-RestMethod -Uri "$baseUrl/tags/NEW-EPC" -Method Delete -Headers $headers
    if ($delResponse1.success -and $delResponse2.success) { Write-TestResult "Delete Tags" $true } else { Write-TestResult "Delete Tags" $false "Delete failed" }
} catch {
    Write-TestResult "Delete Tags" $false $_.Exception.Message
}

Write-Host "--- API Test Suite End ---" -ForegroundColor Cyan
