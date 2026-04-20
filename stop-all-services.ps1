param(
    [switch]$IncludeDocker
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

# Service ports used by this project
$ports = @(3000, 3001, 3002, 3003, 3004, 3006, 3007, 3008)

function Stop-ProcessesOnPort {
    param([int]$Port)

    $lines = netstat -ano | Select-String ":$Port"
    if (-not $lines) {
        Write-Host "Port ${Port}: no active process"
        return
    }

    $processIds = @()
    foreach ($line in $lines) {
        $parts = ($line.ToString().Trim() -split '\s+')
        if ($parts.Length -ge 5) {
            $procId = $parts[-1]
            if ($procId -match '^\d+$' -and $procId -ne '0') {
                $processIds += [int]$procId
            }
        }
    }

    $processIds = $processIds | Sort-Object -Unique
    if (-not $processIds) {
        Write-Host "Port ${Port}: no killable PID found"
        return
    }

    foreach ($procId in $processIds) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "Port ${Port}: stopped PID $procId"
        } catch {
            Write-Host "Port ${Port}: failed to stop PID $procId ($($_.Exception.Message))"
        }
    }
}

Write-Host "Stopping local app services..."
foreach ($port in $ports) {
    Stop-ProcessesOnPort -Port $port
}

if ($IncludeDocker) {
    Write-Host "Stopping Docker infrastructure..."
    Push-Location $root
    try {
        docker compose stop
    } finally {
        Pop-Location
    }
}

Write-Host "Done."
Write-Host "Tip: run .\stop-all-services.ps1 -IncludeDocker to stop MongoDB/RabbitMQ/MinIO containers too."
