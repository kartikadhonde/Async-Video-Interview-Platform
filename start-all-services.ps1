param(
    [switch]$SkipDocker,
    [switch]$IncludeFrontend
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Start-ServiceTerminal {
    param(
        [string]$Name,
        [string]$WorkingDir,
        [string]$Command
    )

    $safeDir = $WorkingDir.Replace("'", "''")
    $fullCmd = "Set-Location -LiteralPath '$safeDir'; $Command"

    Start-Process -FilePath "powershell.exe" -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-Command", $fullCmd
    ) | Out-Null

    Write-Host "Started $Name in $WorkingDir"
}

if (-not $SkipDocker) {
    Write-Host "Starting Docker infrastructure..."
    docker compose up -d
}

$services = @(
    @{ Name = 'Scheduling Service'; Dir = Join-Path $root 'scheduling-service'; Cmd = 'npm start' },
    @{ Name = 'Gateway'; Dir = Join-Path $root 'gateway'; Cmd = 'npm start' },
    @{ Name = 'Upload Service'; Dir = Join-Path $root 'upload-service'; Cmd = 'npm start' },
    @{ Name = 'Transcription Service'; Dir = Join-Path $root 'transcription-service'; Cmd = '.\\.venv\\Scripts\\Activate.ps1; python -m uvicorn main:app --host 0.0.0.0 --port 3002 --reload' },
    @{ Name = 'Feedback Service'; Dir = Join-Path $root 'feedback-service'; Cmd = 'npm start' },
    @{ Name = 'Notification Service'; Dir = Join-Path $root 'notification-service'; Cmd = 'npm start' },
    @{ Name = 'Analytics Service'; Dir = Join-Path $root 'analytics-service'; Cmd = 'npm start' }
)

if ($IncludeFrontend) {
    $services += @{ Name = 'Frontend'; Dir = Join-Path $root 'frontend'; Cmd = 'npm start' }
}

foreach ($svc in $services) {
    Start-ServiceTerminal -Name $svc.Name -WorkingDir $svc.Dir -Command $svc.Cmd
}

Write-Host "All requested services have been launched in separate terminals."
Write-Host "Use -SkipDocker to skip docker compose up -d."
Write-Host "Use -IncludeFrontend to launch frontend too."
