Add-Type -AssemblyName System.Drawing

$out = 'C:\Users\ImpulsionClub\Desktop\secu\assets\images'

$NAVY  = [System.Drawing.Color]::FromArgb(255, 0x13, 0x1B, 0x2E)
$CREAM = [System.Drawing.Color]::FromArgb(255, 0xFC, 0xDE, 0xB5)
$WHITE = [System.Drawing.Color]::FromArgb(255, 0xFF, 0xFF, 0xFF)

# Le tracé est dessiné dans un carré normalisé de 512, puis mis à l'échelle.
# Aucune fonction imbriquée : PowerShell n'y propage pas la portée, et le
# premier jet du script produisait un bouclier vide pour cette raison.
function Trace-Shield {
    param($g, [double]$s, [double]$o, $couleur, [double]$epaisseur)

    $g.SmoothingMode   = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $pinceau = New-Object System.Drawing.Pen($couleur, [float]($epaisseur * $s))
    $pinceau.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pinceau.EndCap   = [System.Drawing.Drawing2D.LineCap]::Round
    $pinceau.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # --- Bouclier : bord supérieur, flanc droit, pointe basse, flanc gauche.
    $b = New-Object System.Drawing.Drawing2D.GraphicsPath
    $b.StartFigure()
    $b.AddLine(
        [single]($o + 116 * $s), [single]($o +  92 * $s),
        [single]($o + 396 * $s), [single]($o +  92 * $s))
    $b.AddBezier(
        [single]($o + 396 * $s), [single]($o +  92 * $s),
        [single]($o + 396 * $s), [single]($o + 262 * $s),
        [single]($o + 336 * $s), [single]($o + 366 * $s),
        [single]($o + 256 * $s), [single]($o + 424 * $s))
    $b.AddBezier(
        [single]($o + 256 * $s), [single]($o + 424 * $s),
        [single]($o + 176 * $s), [single]($o + 366 * $s),
        [single]($o + 116 * $s), [single]($o + 262 * $s),
        [single]($o + 116 * $s), [single]($o +  92 * $s))
    $b.CloseFigure()
    $g.DrawPath($pinceau, $b)

    # --- Coche, centrée dans le bouclier.
    $c = New-Object System.Drawing.Drawing2D.GraphicsPath
    $c.StartFigure()
    $c.AddLines([System.Drawing.PointF[]]@(
        (New-Object System.Drawing.PointF -ArgumentList ([single]($o + 182 * $s)), ([single]($o + 262 * $s))),
        (New-Object System.Drawing.PointF -ArgumentList ([single]($o + 234 * $s)), ([single]($o + 314 * $s))),
        (New-Object System.Drawing.PointF -ArgumentList ([single]($o + 334 * $s)), ([single]($o + 196 * $s)))
    ))
    $g.DrawPath($pinceau, $c)

    $pinceau.Dispose()
}

# Image transparente portant uniquement la marque.
function New-Mark {
    param([int]$Taille, $Couleur, [double]$Remplissage = 0.78, [double]$Epaisseur = 20)

    $bmp = New-Object System.Drawing.Bitmap($Taille, $Taille, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::Transparent)
    $s = $Taille * $Remplissage / 512
    $o = ($Taille - 512 * $s) / 2
    Trace-Shield -g $g -s $s -o $o -couleur $Couleur -epaisseur $Epaisseur
    $g.Dispose()
    return $bmp
}

# Aplat de couleur, taille au choix.
function New-Plain {
    param([int]$Taille, $Couleur)
    $bmp = New-Object System.Drawing.Bitmap($Taille, $Taille, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear($Couleur)
    $g.Dispose()
    return $bmp
}

# Marque posée sur un aplat.
function New-Composed {
    param([int]$Taille, $Fond, $Couleur, [double]$Remplissage, [double]$Epaisseur)
    $bmp = New-Plain -Taille $Taille -Couleur $Fond
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $s = $Taille * $Remplissage / 512
    $o = ($Taille - 512 * $s) / 2
    Trace-Shield -g $g -s $s -o $o -couleur $Couleur -epaisseur $Epaisseur
    $g.Dispose()
    return $bmp
}

function Save-Png($bmp, $chemin) {
    $bmp.Save($chemin, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    '{0,-34} {1,8} octets' -f (Split-Path $chemin -Leaf), (Get-Item $chemin).Length
}

# --- Fichiers produits -------------------------------------------------------
Write-Output '--- marque et icones ---'
Save-Png (New-Mark      -Taille 1024 -Couleur $CREAM -Remplissage 0.72 -Epaisseur 20) "$out\secuguard-mark.png"
Save-Png (New-Composed  -Taille 1024 -Fond $NAVY  -Couleur $CREAM -Remplissage 0.58 -Epaisseur 20) "$out\icon.png"
Save-Png (New-Composed  -Taille 1024 -Fond $NAVY  -Couleur $CREAM -Remplissage 0.40 -Epaisseur 20) "$out\android-icon-foreground.png"
Save-Png (New-Plain     -Taille 1024 -Couleur $NAVY) "$out\android-icon-background.png"
Save-Png (New-Mark      -Taille 1024 -Couleur $WHITE -Remplissage 0.40 -Epaisseur 20) "$out\android-icon-monochrome.png"
Save-Png (New-Composed  -Taille 512  -Fond $NAVY  -Couleur $CREAM -Remplissage 0.62 -Epaisseur 20) "$out\splash-icon.png"
Save-Png (New-Composed  -Taille 512  -Fond $NAVY  -Couleur $CREAM -Remplissage 0.66 -Epaisseur 20) "$out\favicon.png"
