Add-Type -AssemblyName System.Drawing

$assets = "$PSScriptRoot\..\assets"

function New-LobImage {
    param([string]$Path, [int]$Size = 1024, [double]$ContentScale = 1.0)

    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Dark background
    $g.Clear([System.Drawing.Color]::FromArgb(24, 24, 24))

    # Scale and vertical offset (centres content when ContentScale < 1)
    $s   = ($Size / 1024.0) * $ContentScale
    $cx  = $Size / 2.0
    $top = ($Size - $Size * $ContentScale) / 2.0

    $gold   = [System.Drawing.Color]::FromArgb(201, 168, 76)
    $goldB  = New-Object System.Drawing.SolidBrush($gold)
    $goldP  = New-Object System.Drawing.Pen($gold, [float]([Math]::Max(2.0, $s * 4)))
    $whiteB = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

    # ── Cross (geometric) ────────────────────────────────────────
    $vW = [int]($s * 36);  $vH = [int]($s * 170)
    $vX = [int]($cx - $vW / 2.0);  $vY = [int]($top + $s * 185)
    $g.FillRectangle($goldB, $vX, $vY, $vW, $vH)          # vertical bar

    $hW = [int]($s * 160);  $hH = [int]($s * 36)
    $hX = [int]($cx - $hW / 2.0);  $hY = [int]($vY + $s * 52)
    $g.FillRectangle($goldB, $hX, $hY, $hW, $hH)          # horizontal bar

    # ── "LOB" ───────────────────────────────────────────────────
    $fPx  = [float]([Math]::Max(1.0, $s * 258))
    $font = New-Object System.Drawing.Font("Times New Roman", $fPx, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $sf   = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $tY   = [float]($top + $s * 415)
    $tH   = [float]($s * 360)
    $rect = [System.Drawing.RectangleF]::new([float]0, $tY, [float]$Size, $tH)
    $g.DrawString("LOB", $font, $whiteB, $rect, $sf)

    # ── Decorative gold line ─────────────────────────────────────
    $lY  = [int]($top + $s * 815)
    $lHW = [int]($s * 200)
    $g.DrawLine($goldP, [int]($cx - $lHW), $lY, [int]($cx + $lHW), $lY)

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

    $goldB.Dispose(); $goldP.Dispose(); $whiteB.Dispose(); $font.Dispose()
    $g.Dispose(); $bmp.Dispose()
    Write-Host "  OK  $Path"
}

New-Item -ItemType Directory -Force -Path $assets | Out-Null

New-LobImage "$assets\icon.png"          1024 1.0   # iOS / base
New-LobImage "$assets\adaptive-icon.png" 1024 0.70  # Android (safe zone)
New-LobImage "$assets\splash.png"        1024 0.60  # Splash screen

Write-Host "Icones gerados."
