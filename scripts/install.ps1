#Requires -Version 5.1
<#
    Starshift Mod Loader Installer (Windows / PowerShell)
    Equivalent of install.sh. The Linux native-port (base NW.js runtime)
    install step is skipped since Windows users already run the game's
    native Windows build — but the -Dev option still applies, since it
    swaps in the SDK (DevTools-enabled) build of that same engine.
#>

param(
    # Equivalent of bash's DEV=1: installs the SDK build of NW.js (with
    # DevTools) over the existing engine files instead of the normal build.
    # Can also be set via $Env:DEV = '1' for irm | iex usage.
    [switch]$Dev
)

$ErrorActionPreference = 'Stop'

# --- Configuration ---
$GameNames = @("In Stars And Time", "In Stars And Time Demo")
$RepoApiUrl = "https://codeberg.org/api/v1/repos/jakeayy/Starshift/releases?limit=1"
# NOTE: pinned deliberately — this must match the version the game's
# original Windows build ships with, so don't bump it casually.
$NwjsVersion = "0.49.2"
$WantsDev = $Dev -or ($Env:DEV -eq '1')

function Write-Ok    { param($msg) Write-Host " - $msg" -ForegroundColor Green }
function Write-Warn2 { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err2  { param($msg) Write-Host $msg -ForegroundColor Red }

# --- Auto-detect Game Directory ---
function Find-GameDirs {
    $steamRoots = @()

    # Registry-based Steam install location (covers custom install paths)
    try {
        $regPath = Get-ItemProperty -Path 'HKCU:\Software\Valve\Steam' -Name 'SteamPath' -ErrorAction Stop
        if ($regPath.SteamPath) { $steamRoots += $regPath.SteamPath }
    } catch {}
    try {
        $regPath64 = Get-ItemProperty -Path 'HKLM:\SOFTWARE\WOW6432Node\Valve\Steam' -Name 'InstallPath' -ErrorAction Stop
        if ($regPath64.InstallPath) { $steamRoots += $regPath64.InstallPath }
    } catch {}

    # Common default fallbacks
    $steamRoots += "$Env:ProgramFiles(x86)\Steam"
    $steamRoots += "$Env:ProgramFiles\Steam"

    $steamappsDirs = New-Object System.Collections.Generic.List[string]

    foreach ($root in ($steamRoots | Where-Object { $_ } | Select-Object -Unique)) {
        $steamapps = Join-Path $root "steamapps"
        $steamappsDirs.Add($steamapps)

        $vdf = Join-Path $steamapps "libraryfolders.vdf"
        if (Test-Path $vdf) {
            # Parse "path" entries — covers both old and new VDF formats
            $lines = Get-Content $vdf
            foreach ($line in $lines) {
                if ($line -match '"path"\s*"([^"]*)"') {
                    $libPath = $Matches[1] -replace '\\\\', '\'
                    $libSteamapps = Join-Path $libPath "steamapps"
                    if (Test-Path $libSteamapps) {
                        $steamappsDirs.Add($libSteamapps)
                    }
                }
            }
        }
    }

    # De-duplicate by resolved full path
    $uniqueDirs = $steamappsDirs | ForEach-Object {
        $path = $_
        try { (Resolve-Path -LiteralPath $path -ErrorAction Stop).Path } catch { $path }
    } | Select-Object -Unique

    # Search each steamapps directory for any of the accepted game folder names
    $found = New-Object System.Collections.Generic.List[string]
    foreach ($dir in $uniqueDirs) {
        foreach ($name in $GameNames) {
            $candidate = Join-Path $dir "common\$name"
            if (Test-Path $candidate -PathType Container) {
                $found.Add((Resolve-Path -LiteralPath $candidate).Path)
            }
        }
    }

    return ($found | Select-Object -Unique)
}

Clear-Host
Write-Host "=== Starshift Mod Loader Installer ===" -ForegroundColor Green
Write-Host ""

# --- Locate Game ---
Write-Host "Searching for a supported installation ($($GameNames -join ', '))..." -ForegroundColor Green
$foundDirs = @(Find-GameDirs)

if ($foundDirs.Count -eq 0) {
    Write-Warn2 "Could not auto-detect game directory."
    $gameDir = Read-Host "Please enter the full path to the game folder"
    $gameDir = $gameDir.TrimEnd('\', '/')
} elseif ($foundDirs.Count -eq 1) {
    $gameDir = $foundDirs[0]
    Write-Ok "Found: $gameDir"
} else {
    Write-Host " - Found $($foundDirs.Count) matching installations:"
    for ($i = 0; $i -lt $foundDirs.Count; $i++) {
        Write-Host "   $($i + 1)) $($foundDirs[$i])"
    }
    Write-Host ""
    do {
        $choice = Read-Host "Which one would you like to install to? (1-$($foundDirs.Count))"
        $valid = $choice -match '^\d+$' -and [int]$choice -ge 1 -and [int]$choice -le $foundDirs.Count
        if (-not $valid) { Write-Err2 "Invalid choice. Please enter a number between 1 and $($foundDirs.Count)." }
    } until ($valid)
    $gameDir = $foundDirs[[int]$choice - 1]
    Write-Ok "Selected: $gameDir"
}
Write-Host ""

# 1. Verify Clean Install
Write-Warn2 "IMPORTANT: Before proceeding, please ensure:"
Write-Host "1. You have verified the integrity of game files on Steam."
Write-Host "2. You are running on a CLEAN installation of the game."
Write-Host ""
$confirmClean = Read-Host "Have you verified these steps? (y/n)"

if ($confirmClean -notin @('y', 'Y')) {
    Write-Err2 "Aborting installation. Please verify your game files and try again."
    exit 1
}

# Check if Game Directory Exists
if (-not (Test-Path $gameDir -PathType Container)) {
    Write-Err2 "Error: Game directory not found at:"
    Write-Host "  $gameDir"
    Write-Host "Please ensure one of the supported titles ($($GameNames -join ', ')) is installed via Steam, then re-run this script."
    exit 1
}
Write-Ok "Game directory confirmed."

# --- Temp working directory ---
$tempDir = Join-Path $Env:TEMP ("starshift_install_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    # 2. Download and Install Latest Release
    Write-Host ""
    Write-Host "Fetching latest release info..." -ForegroundColor Green

    $downloadUrl = $null
    try {
        $release = Invoke-RestMethod -Uri $RepoApiUrl -UseBasicParsing
        if ($release -and $release.Count -gt 0 -and $release[0].assets -and $release[0].assets.Count -gt 0) {
            $downloadUrl = $release[0].assets[0].browser_download_url
        }
    } catch {
        Write-Err2 "Failed to reach the Codeberg API. Check your internet connection."
        exit 1
    }

    if (-not $downloadUrl) {
        Write-Err2 "Failed to find latest release. Check your internet connection or API limits."
        exit 1
    }

    Write-Host "Downloading Starshift from $downloadUrl..."
    $fileName = Split-Path $downloadUrl -Leaf
    $destFile = Join-Path $tempDir $fileName

    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $destFile -UseBasicParsing
    } catch {
        Write-Err2 "Failed to download Starshift release. Check your internet connection."
        exit 1
    }

    $extractDir = Join-Path $tempDir "Starshift"
    New-Item -ItemType Directory -Path $extractDir | Out-Null

    Write-Host "Extracting..."
    try {
        if ($fileName -like "*.zip") {
            Expand-Archive -Path $destFile -DestinationPath $extractDir -Force
        } elseif ($fileName -like "*.tar.gz" -or $fileName -like "*.tgz") {
            # tar.exe ships built-in with Windows 10 1803+ / Windows 11
            tar -xzf $destFile -C $extractDir
            if ($LASTEXITCODE -ne 0) { throw "tar extraction failed" }
        } else {
            Write-Err2 "Unknown archive format: $fileName"
            exit 1
        }
    } catch {
        Write-Err2 "Failed to extract $fileName (archive may be corrupt)."
        exit 1
    }

    Write-Host "Copying files to game directory..."

    $sourceDir = $extractDir
    # Handle case where the archive wraps files in a top-level folder
    if (-not (Test-Path (Join-Path $sourceDir "www"))) {
        $subDirs = Get-ChildItem -Path $sourceDir -Directory
        if ($subDirs.Count -eq 1) {
            $sourceDir = $subDirs[0].FullName
        }
    }

    $sourceWww = Join-Path $sourceDir "www"
    if (Test-Path $sourceWww) {
        $targetWww = Join-Path $gameDir "www"

        if (Test-Path $targetWww) {
            # Merge mod files into the existing www folder. robocopy overlays
            # files (adding/overwriting only what's in the mod archive) without
            # touching or deleting any other existing files, like the base game's.
            robocopy $sourceWww $targetWww /E /NFL /NDL /NJH /NJS | Out-Null
            if ($LASTEXITCODE -ge 8) {
                throw "robocopy failed while merging www folder (exit code $LASTEXITCODE)"
            }
        } else {
            Copy-Item -Path $sourceWww -Destination $gameDir -Recurse
        }
        Write-Ok "Installed mod files into www folder"
    } else {
        Write-Err2 "Warning: www folder not found in the downloaded release."
    }

    # 3. Optional DevTools (SDK) Build
    Write-Host ""
    Write-Warn2 "Would you like to install the DevTools-enabled (SDK) build of the engine?"
    Write-Host "This lets you open DevTools in-game with F12 for modding/debugging."
    Write-Host "It only replaces the engine binaries (nw.exe and friends) -- your www folder is untouched."

    if (-not $WantsDev) {
        $installDevChoice = Read-Host "Install DevTools build? (y/n)"
        $WantsDev = $installDevChoice -in @('y', 'Y')
    }

    if ($WantsDev) {
        Write-Host ""
        Write-Host "Downloading NW.js SDK v$NwjsVersion (includes DevTools)..." -ForegroundColor Green
        $nwjsUrl = "https://dl.nwjs.io/v$NwjsVersion/nwjs-sdk-v$NwjsVersion-win-x64.zip"
        $nwjsZip = Join-Path $tempDir "nwjs-sdk.zip"

        $devOk = $true
        try {
            Invoke-WebRequest -Uri $nwjsUrl -OutFile $nwjsZip -UseBasicParsing
        } catch {
            Write-Err2 "Failed to download NW.js SDK build. Check your internet connection."
            $devOk = $false
        }

        if ($devOk) {
            $nwjsExtractDir = Join-Path $tempDir "nwjs-sdk"
            New-Item -ItemType Directory -Path $nwjsExtractDir | Out-Null

            Write-Host "Extracting..."
            try {
                Expand-Archive -Path $nwjsZip -DestinationPath $nwjsExtractDir -Force
            } catch {
                Write-Err2 "Failed to extract NW.js SDK archive (it may be corrupt)."
                $devOk = $false
            }
        }

        if ($devOk) {
            # The zip wraps everything in a single top-level folder, e.g.
            # nwjs-sdk-v0.49.2-win-x64 -- unwrap it like the mod archive above.
            $nwjsSourceDir = $nwjsExtractDir
            $subDirs = Get-ChildItem -Path $nwjsExtractDir -Directory
            if ($subDirs.Count -eq 1) {
                $nwjsSourceDir = $subDirs[0].FullName
            }

            Write-Host "Installing DevTools build (overwriting engine files only)..."
            # robocopy overlays the engine binaries (nw.exe, dlls, locales, etc.)
            # without touching the www folder -- NW.js's own distribution
            # doesn't ship one, so there's nothing there to collide with.
            robocopy $nwjsSourceDir $gameDir /E /NFL /NDL /NJH /NJS | Out-Null
            if ($LASTEXITCODE -ge 8) {
                Write-Err2 "robocopy failed while installing the DevTools build (exit code $LASTEXITCODE)."
            } else {
                # The SDK build's binary is named nw.exe, but the game expects
                # Game.exe -- rename it, replacing the existing Game.exe.
                $nwExe = Join-Path $gameDir "nw.exe"
                $gameExe = Join-Path $gameDir "Game.exe"
                if (Test-Path $nwExe) {
                    Move-Item -Path $nwExe -Destination $gameExe -Force
                }
                Write-Ok "DevTools build installed. Press F12 in-game to open DevTools."
            }
        }
    } else {
        Write-Host "Skipping DevTools build."
    }
}
finally {
    # Always clean up the temp dir
    Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}

# 4. Outro
Write-Host ""
Write-Host "Installation complete! Have a great adventure!" -ForegroundColor Green
Write-Host ""
