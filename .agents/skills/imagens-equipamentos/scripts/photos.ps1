param(
    [Parameter(Mandatory)][ValidateSet('Search','Prepare','Verify')][string]$Mode,
    [Parameter(Mandatory)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$inventoryPath = Join-Path $PSScriptRoot '../../../../prisma/equipment-practice.json'
$inventory = @((Get-Content -Encoding UTF8 -Raw -LiteralPath $inventoryPath | ConvertFrom-Json))
$null = New-Item -Force -ItemType Directory -Path $OutputDirectory
$root = (Resolve-Path -LiteralPath $OutputDirectory).Path
$candidatePath = Join-Path $root 'candidates.json'
$cache = Join-Path $root 'cache'
$assetDirectory = Join-Path $root 'equipment'
$null = New-Item -Force -ItemType Directory -Path $cache,$assetDirectory
$license = 'https://pixabay.com/service/license-summary/'

function Write-Json($Items, $Path) {
    ConvertTo-Json -InputObject @($Items) -Depth 8 | Set-Content -Encoding UTF8 -LiteralPath $Path
}

if ($Mode -eq 'Search') {
    $candidates = foreach ($item in $inventory) {
        $file = Join-Path $cache "$($item.assetTag).json"
        if (!(Test-Path -LiteralPath $file) -or (Get-Item -LiteralPath $file).LastWriteTimeUtc -lt [DateTime]::UtcNow.AddHours(-24)) {
            if (!$env:PIXABAY_API_KEY) { throw 'Configure PIXABAY_API_KEY na sessão local.' }
            $key = [Uri]::EscapeDataString($env:PIXABAY_API_KEY)
            $query = [Uri]::EscapeDataString($item.query)
            try {
                $results = Invoke-RestMethod -Uri "https://pixabay.com/api/?key=$key&q=$query&image_type=photo&orientation=horizontal&safesearch=true&per_page=20" -Verbose:$false
            } catch {
                throw "A pesquisa Pixabay falhou para $($item.assetTag). Confira a chave, a conexão ou a cota."
            }
            Write-Json $results.hits $file
        }
        foreach ($hit in @((Get-Content -Encoding UTF8 -Raw -LiteralPath $file | ConvertFrom-Json))) {
            [pscustomobject]@{ assetTag=$item.assetTag; photoId=$hit.id; author=$hit.user; source=$hit.pageURL; download=$hit.largeImageURL }
        }
    }
    Write-Json $candidates $candidatePath
    return
}

function Convert-Photo($Source, $Target) {
    $image = [Drawing.Image]::FromFile($Source)
    try {
        if ($image.Width -lt 800 -or $image.Height -lt 600) { throw 'A fonte tem menos de 800 × 600 pixels.' }
        $bitmap = New-Object Drawing.Bitmap 800,600
        try {
            $graphics = [Drawing.Graphics]::FromImage($bitmap)
            try {
                $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $ratio = [Math]::Min($image.Width / 800.0, $image.Height / 600.0)
                $width = [int][Math]::Floor($ratio * 800)
                $height = [int][Math]::Floor($ratio * 600)
                $x = [int][Math]::Floor(($image.Width - $width) / 2)
                $y = [int][Math]::Floor(($image.Height - $height) / 2)
                $rect = New-Object Drawing.Rectangle 0,0,800,600
                $graphics.DrawImage($image,$rect,$x,$y,$width,$height,[Drawing.GraphicsUnit]::Pixel)
                $bitmap.Save($Target, [Drawing.Imaging.ImageFormat]::Jpeg)
            } finally { $graphics.Dispose() }
        } finally { $bitmap.Dispose() }
    } finally { $image.Dispose() }
}

$candidates = @((Get-Content -Encoding UTF8 -Raw -LiteralPath $candidatePath | ConvertFrom-Json))
$selections = @((Get-Content -Encoding UTF8 -Raw -LiteralPath (Join-Path $root 'selections.json') | ConvertFrom-Json))
if ($selections.Count -ne $inventory.Count -or @($selections.photoId | Sort-Object -Unique).Count -ne $inventory.Count) {
    throw 'Escolha 12 fotos distintas.'
}
$manifest = foreach ($item in $inventory) {
    $tag = $item.assetTag
    $choices = @($selections | Where-Object assetTag -EQ $tag)
    if ($choices.Count -ne 1) { throw "Escolha exatamente uma foto para $tag." }
    $choice = $choices[0]
    $candidate = $candidates | Where-Object { $_.assetTag -eq $tag -and $_.photoId -eq $choice.photoId } | Select-Object -First 1
    if (!$candidate -or !$candidate.author -or ([uri]$candidate.source).Host -ne 'pixabay.com') { throw "Foto Pixabay inválida para $tag." }
    $target = Join-Path $assetDirectory "$tag.jpg"
    $receipt = Join-Path $cache "$tag.prepared.json"
    if ($Mode -eq 'Prepare') {
        $url = [uri]$candidate.download
        if ($url.Scheme -ne 'https' -or $url.Host -notin 'pixabay.com','cdn.pixabay.com') { throw "Download Pixabay inválido para $tag." }
        $sourceFile = Join-Path $cache "$($candidate.photoId).download"
        if (!(Test-Path -LiteralPath $sourceFile)) {
            try {
                Invoke-WebRequest -Uri $url -OutFile "$sourceFile.tmp" -UseBasicParsing -Verbose:$false
                Move-Item -LiteralPath "$sourceFile.tmp" -Destination $sourceFile -Force
            } catch { throw "Falha no download para $tag." }
        }
        Convert-Photo $sourceFile "$target.tmp"
        Move-Item -LiteralPath "$target.tmp" -Destination $target -Force
        Write-Json @([pscustomobject]@{ photoId=$choice.photoId; hash=(Get-FileHash -LiteralPath $target).Hash }) $receipt
        continue
    }
    if ($choice.approved -isnot [bool] -or !$choice.approved) { throw "Falta aprovação humana para $tag." }
    $image = [Drawing.Image]::FromFile($target)
    try {
        if ($image.Width -ne 800 -or $image.Height -ne 600 -or $image.RawFormat.Guid -ne [Drawing.Imaging.ImageFormat]::Jpeg.Guid) {
            throw "JPEG inválido para $tag."
        }
    } finally { $image.Dispose() }
    $hash = (Get-FileHash -LiteralPath $target).Hash
    $proof = Get-Content -Encoding UTF8 -Raw -LiteralPath $receipt | ConvertFrom-Json
    if ($proof.photoId -ne $choice.photoId -or $proof.hash -ne $hash) { throw "Gere e revise novamente a foto de $tag." }
    [pscustomobject]@{ assetTag=$tag; photoId=[long]$choice.photoId; author=$candidate.author; source=$candidate.source; license=$license; sha256=$hash.ToLowerInvariant(); imagePath="equipment/$tag.jpg"; width=800; height=600 }
}
if ($Mode -eq 'Verify') {
    $rejections = Get-Content -Encoding UTF8 -Raw -LiteralPath (Join-Path $root 'rejections.json') | ConvertFrom-Json
    foreach ($rejection in $rejections) {
        if (!$rejection.photoId -or [string]::IsNullOrWhiteSpace($rejection.reason)) { throw 'Toda recusa precisa de ID e motivo.' }
        if ($rejection.photoId -in $manifest.photoId) { throw 'Uma foto recusada ainda está na seleção.' }
    }
    if (@($manifest.sha256 | Sort-Object -Unique).Count -ne $inventory.Count) { throw 'Fotos duplicadas por hash.' }
    if (@(Get-ChildItem -File -LiteralPath $assetDirectory).Count -ne $inventory.Count) { throw 'A pasta de saída deve conter apenas os 12 JPEGs.' }
    Write-Json $manifest (Join-Path $root 'manifest.json')
}
