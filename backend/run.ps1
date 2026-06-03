# Helper script to bootstrap Maven and run Spring Boot using local OpenJDK 24
$ErrorActionPreference = "Stop"

$JavaHome = "C:\Users\Admin\.jdks\openjdk-24.0.1"
if (-not (Test-Path $JavaHome)) {
    # Fallback to MS JDK 25 if OpenJDK 24 is missing
    $JavaHome = "C:\Users\Admin\.jdks\ms-25.0.3"
}

$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome\bin;" + $env:PATH

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "Interview Copilot Backend Launcher" -ForegroundColor Cyan
Write-Host "Using JDK at: $JavaHome" -ForegroundColor Green
Write-Host "--------------------------------------------------" -ForegroundColor Cyan

# Check Java compiler version
& java -version

# Setup Local Maven if not present
$MavenBin = "maven\apache-maven-3.9.6"
if (-not (Test-Path $MavenBin)) {
    Write-Host "Maven not found locally. Downloading Apache Maven 3.9.6..." -ForegroundColor Yellow
    if (-not (Test-Path "maven")) {
        New-Item -ItemType Directory -Path "maven" | Out-Null
    }
    
    $downloadUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    $zipPath = "maven\maven.zip"
    
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
    
    Write-Host "Extracting Maven..." -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath "maven"
    Remove-Item $zipPath -Force
    Write-Host "Maven set up completed successfully." -ForegroundColor Green
}

# Run Spring Boot application
Write-Host "Starting Spring Boot application..." -ForegroundColor Green
& "maven\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
