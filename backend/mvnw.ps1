# Maven Wrapper Bootstrapper for PowerShell

# Dynamically set JAVA_HOME if not configured or points to an invalid directory (missing java.exe)
$javaExecutable = Join-Path $env:JAVA_HOME "bin\java.exe"
if (-not $env:JAVA_HOME -or -not (Test-Path $javaExecutable)) {
    $javaDirs = Get-ChildItem -Path "C:\Program Files\Java" -Filter "jdk-*" -Directory | Sort-Object Name -Descending
    if ($javaDirs.Count -gt 0) {
        $env:JAVA_HOME = $javaDirs[0].FullName
        Write-Host "Set JAVA_HOME dynamically to: $env:JAVA_HOME" -ForegroundColor Yellow
    } else {
        Write-Host "WARNING: JAVA_HOME is not set and no JDK was found in C:\Program Files\Java" -ForegroundColor Red
    }
}

$MAVEN_VERSION = "3.9.6"
$MAVEN_DIR = Join-Path $PSScriptRoot ".maven"
$MAVEN_HOME = Join-Path $MAVEN_DIR "apache-maven-$MAVEN_VERSION"
$ZIP_PATH = Join-Path $MAVEN_DIR "maven.zip"
$MVN_CMD = Join-Path $MAVEN_HOME "bin\mvn.cmd"

if (-not (Test-Path $MVN_CMD)) {
    Write-Host "Maven not found in workspace. Fetching Maven $MAVEN_VERSION..." -ForegroundColor Cyan
    if (-not (Test-Path $MAVEN_DIR)) {
        New-Item -ItemType Directory -Path $MAVEN_DIR | Out-Null
    }
    
    $URL = "https://archive.apache.org/dist/maven/maven-3/$MAVEN_VERSION/binaries/apache-maven-$MAVEN_VERSION-bin.zip"
    Write-Host "Downloading $URL ..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $URL -OutFile $ZIP_PATH
    
    Write-Host "Extracting archive..." -ForegroundColor Gray
    Expand-Archive -Path $ZIP_PATH -DestinationPath $MAVEN_DIR -Force
    
    if (Test-Path $ZIP_PATH) {
        Remove-Item $ZIP_PATH | Out-Null
    }
    Write-Host "Maven successfully downloaded and extracted." -ForegroundColor Green
}

# Run Maven command forwarding all script arguments
& $MVN_CMD @args
