# ============================================================
# Kisan-DePIN — Geospatial D-MRV Cross-Verification
# Sentinel-2 Satellite Data Fetcher + Thermal Heatmap Generator
# ============================================================
#
# This module provides:
# 1. OpenEO client script to fetch Copernicus Sentinel-2 imagery
# 2. Mock super-resolution model (diffusion-based upscaling placeholder)
# 3. Thermal anomaly heatmap generator for fire detection
#
# For the hackathon demo, we generate realistic synthetic satellite
# tiles and heatmaps using NumPy + Pillow (no API key required).
# ============================================================

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import hashlib
import os
from datetime import datetime, timezone
from typing import Tuple, Optional


# ─────────────────────────────────────────────────────────────
# 1. OpenEO Sentinel-2 Data Fetcher (Production Code)
# ─────────────────────────────────────────────────────────────

def fetch_sentinel2_openeo(
    latitude: float,
    longitude: float,
    date_start: str = "2025-10-01",
    date_end: str = "2025-11-30",
    bbox_size_deg: float = 0.01,
    output_path: str = "sentinel2_tile.tif",
) -> str:
    """
    Fetch Sentinel-2 imagery using OpenEO (Copernicus Data Space).

    This is the PRODUCTION implementation. For the demo, use
    generate_mock_satellite_tile() instead.

    Requirements:
        pip install openeo

    Usage:
        fetch_sentinel2_openeo(28.6139, 77.2090)
    """
    try:
        import openeo

        # Connect to Copernicus Data Space Ecosystem
        connection = openeo.connect("https://openeo.dataspace.copernicus.eu")
        connection.authenticate_oidc()

        # Define bounding box around GPS point
        west = longitude - bbox_size_deg
        east = longitude + bbox_size_deg
        south = latitude - bbox_size_deg
        north = latitude + bbox_size_deg

        # Load Sentinel-2 L2A (atmospherically corrected)
        s2 = connection.load_collection(
            "SENTINEL2_L2A",
            spatial_extent={"west": west, "south": south, "east": east, "north": north},
            temporal_extent=[date_start, date_end],
            bands=["B02", "B03", "B04", "B08", "B11", "B12"],  # Blue, Green, Red, NIR, SWIR1, SWIR2
        )

        # Compute NDVI = (NIR - Red) / (NIR + Red)
        nir = s2.band("B08")
        red = s2.band("B04")
        ndvi = (nir - red) / (nir + red)

        # Compute NBR (for burn detection) = (NIR - SWIR2) / (NIR + SWIR2)
        swir2 = s2.band("B12")
        nbr = (nir - swir2) / (nir + swir2)

        # Download as GeoTIFF
        result = s2.save_result(format="GTiff")
        job = result.create_job(title=f"KisanDePIN_{latitude}_{longitude}")
        job.start_and_wait()
        job.get_results().download_file(output_path)

        print(f"[Sentinel-2] Downloaded tile to {output_path}")
        return output_path

    except ImportError:
        print("[Sentinel-2] openeo not installed — using mock generator")
        return generate_mock_satellite_tile(latitude, longitude)
    except Exception as e:
        print(f"[Sentinel-2] API error: {e} — using mock generator")
        return generate_mock_satellite_tile(latitude, longitude)


# ─────────────────────────────────────────────────────────────
# 2. Mock Satellite Tile Generator (For Demo)
# ─────────────────────────────────────────────────────────────

def generate_mock_satellite_tile(
    latitude: float,
    longitude: float,
    size: Tuple[int, int] = (512, 512),
    output_dir: str = "output",
) -> str:
    """
    Generate a realistic-looking mock satellite tile for the given GPS coordinates.
    Uses deterministic seeding from coordinates for consistent demo results.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Deterministic seed from coordinates
    seed = int(hashlib.md5(f"{latitude:.4f},{longitude:.4f}".encode()).hexdigest()[:8], 16)
    rng = np.random.RandomState(seed)

    w, h = size

    # Base agricultural terrain (green-brown gradient)
    # Create field-like patterns using noise
    base_r = np.clip(rng.normal(80, 20, (h, w)), 30, 130).astype(np.uint8)
    base_g = np.clip(rng.normal(110, 25, (h, w)), 50, 170).astype(np.uint8)
    base_b = np.clip(rng.normal(60, 15, (h, w)), 20, 100).astype(np.uint8)

    # Add field grid pattern (rectangular plots)
    for _ in range(rng.randint(4, 8)):
        x1, y1 = rng.randint(0, w - 50), rng.randint(0, h - 50)
        x2, y2 = x1 + rng.randint(40, 150), y1 + rng.randint(40, 150)
        x2, y2 = min(x2, w), min(y2, h)

        field_type = rng.choice(["crop", "tilled", "fallow"])
        if field_type == "crop":
            base_g[y1:y2, x1:x2] = np.clip(base_g[y1:y2, x1:x2] + 40, 0, 200)
        elif field_type == "tilled":
            base_r[y1:y2, x1:x2] = np.clip(base_r[y1:y2, x1:x2] + 30, 0, 180)
            base_g[y1:y2, x1:x2] = np.clip(base_g[y1:y2, x1:x2] - 20, 30, 170)
        else:
            base_r[y1:y2, x1:x2] = np.clip(base_r[y1:y2, x1:x2] + 10, 0, 150)
            base_b[y1:y2, x1:x2] = np.clip(base_b[y1:y2, x1:x2] + 10, 0, 120)

    # Compose RGB
    img_array = np.stack([base_r, base_g, base_b], axis=2)
    img = Image.fromarray(img_array, "RGB")

    # Add slight blur for satellite realism
    img = img.filter(ImageFilter.GaussianBlur(radius=1.2))

    # Add coordinate overlay
    draw = ImageDraw.Draw(img)
    label = f"{abs(latitude):.4f}°{'N' if latitude >= 0 else 'S'}, {abs(longitude):.4f}°{'E' if longitude >= 0 else 'W'}"
    draw.rectangle([5, h - 25, len(label) * 7 + 10, h - 5], fill=(0, 0, 0, 160))
    draw.text((8, h - 23), label, fill=(200, 200, 200))

    # Add "Sentinel-2 L2A" label
    draw.rectangle([5, 5, 140, 25], fill=(0, 0, 0, 160))
    draw.text((8, 7), "Sentinel-2 L2A (Mock)", fill=(100, 200, 100))

    output_path = os.path.join(output_dir, f"satellite_{latitude:.4f}_{longitude:.4f}.png")
    img.save(output_path, "PNG")
    print(f"[Mock Satellite] Generated tile: {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────
# 3. Thermal Anomaly Heatmap Generator
# ─────────────────────────────────────────────────────────────

def generate_thermal_heatmap(
    satellite_path: str,
    is_compliant: bool = True,
    output_dir: str = "output",
) -> str:
    """
    Generate a thermal anomaly heatmap from a satellite tile.

    In production: This would use Sentinel-2 B11/B12 SWIR bands
    to compute Normalized Burn Ratio (NBR) and detect fire hotspots.

    For demo: Overlays a color-mapped heatmap on the satellite tile,
    with hotspots injected for VIOLATION cases.
    """
    os.makedirs(output_dir, exist_ok=True)

    # Load satellite tile
    sat_img = Image.open(satellite_path).convert("RGB")
    w, h = sat_img.size
    sat_array = np.array(sat_img).astype(np.float32)

    # Generate thermal layer
    rng = np.random.RandomState(42)

    if is_compliant:
        # Low, uniform thermal signature (no fire)
        thermal = rng.normal(0.2, 0.05, (h, w))
        thermal = np.clip(thermal, 0, 0.4)
    else:
        # Inject thermal hotspots (fire detected!)
        thermal = rng.normal(0.15, 0.05, (h, w))
        # Add 2-4 hotspots
        for _ in range(rng.randint(2, 5)):
            cx, cy = rng.randint(50, w - 50), rng.randint(50, h - 50)
            radius = rng.randint(20, 60)
            Y, X = np.ogrid[:h, :w]
            dist = np.sqrt((X - cx) ** 2 + (Y - cy) ** 2)
            hotspot = np.exp(-dist ** 2 / (2 * radius ** 2))
            thermal += hotspot * rng.uniform(0.5, 0.9)
        thermal = np.clip(thermal, 0, 1)

    # Apply colormap: blue(cool) → green → yellow → red(hot)
    heatmap_r = np.clip(thermal * 3 - 1, 0, 1) * 255
    heatmap_g = np.clip(1 - np.abs(thermal * 3 - 1.5) * 2, 0, 1) * 255
    heatmap_b = np.clip(1 - thermal * 3, 0, 1) * 255

    heatmap_array = np.stack([heatmap_r, heatmap_g, heatmap_b], axis=2).astype(np.uint8)
    heatmap_img = Image.fromarray(heatmap_array, "RGB")

    # Blend satellite + heatmap (40% heatmap overlay)
    blended = Image.blend(sat_img, heatmap_img, alpha=0.4)

    # Add labels
    draw = ImageDraw.Draw(blended)
    status_text = "NO FIRE DETECTED [OK]" if is_compliant else "[!] THERMAL ANOMALY DETECTED"
    status_color = (100, 255, 100) if is_compliant else (255, 80, 80)
    draw.rectangle([5, 5, len(status_text) * 7 + 15, 28], fill=(0, 0, 0, 200))
    draw.text((10, 8), status_text, fill=status_color)

    # Temperature scale bar
    draw.rectangle([w - 35, 40, w - 10, h - 40], fill=(0, 0, 0, 160))
    for i in range(h - 80):
        t = i / (h - 80)
        r = int(min(t * 3 - 1, 1) * 255) if t > 0.33 else 0
        g = int(max(0, 1 - abs(t * 3 - 1.5) * 2) * 255)
        b = int(max(0, 1 - t * 3) * 255)
        draw.line([(w - 32, 43 + i), (w - 13, 43 + i)], fill=(r, g, b))
    draw.text((w - 33, 30), "HOT", fill=(255, 80, 80))
    draw.text((w - 38, h - 38), "COOL", fill=(80, 80, 255))

    output_path = os.path.join(output_dir, "thermal_heatmap.png")
    blended.save(output_path, "PNG")
    print(f"[Thermal Heatmap] Generated: {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────
# 4. Side-by-Side Comparison Generator
# ─────────────────────────────────────────────────────────────

def generate_comparison(
    satellite_path: str,
    heatmap_path: str,
    output_dir: str = "output",
) -> str:
    """
    Create a side-by-side comparison of satellite tile and thermal heatmap.
    This is the key demo visual for D-MRV cross-verification.
    """
    os.makedirs(output_dir, exist_ok=True)

    sat = Image.open(satellite_path).convert("RGB")
    heat = Image.open(heatmap_path).convert("RGB")

    # Ensure same size
    target_size = (512, 512)
    sat = sat.resize(target_size, Image.LANCZOS)
    heat = heat.resize(target_size, Image.LANCZOS)

    # Create canvas with gap and labels
    gap = 20
    label_h = 40
    canvas_w = target_size[0] * 2 + gap
    canvas_h = target_size[1] + label_h
    canvas = Image.new("RGB", (canvas_w, canvas_h), (10, 14, 23))
    draw = ImageDraw.Draw(canvas)

    # Left: Satellite
    canvas.paste(sat, (0, label_h))
    draw.text((target_size[0] // 2 - 60, 10), "SENTINEL-2 ORIGINAL", fill=(100, 200, 100))

    # Right: Heatmap
    canvas.paste(heat, (target_size[0] + gap, label_h))
    draw.text((target_size[0] + gap + target_size[0] // 2 - 70, 10), "THERMAL ANALYSIS (NBR)", fill=(255, 200, 80))

    # Separator
    draw.line([(target_size[0] + gap // 2, label_h), (target_size[0] + gap // 2, canvas_h)], fill=(56, 189, 108), width=2)

    output_path = os.path.join(output_dir, "dmrv_comparison.png")
    canvas.save(output_path, "PNG")
    print(f"[Comparison] Generated: {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────
# 5. Mock Super-Resolution Model
# ─────────────────────────────────────────────────────────────

def mock_super_resolution(
    input_path: str,
    scale_factor: int = 4,
    output_dir: str = "output",
) -> str:
    """
    Mock diffusion-based super-resolution model.

    In production: This would use a fine-tuned diffusion model (e.g.,
    StableSR or Real-ESRGAN) to upscale Sentinel-2 imagery from
    10m/px to ~2.5m/px resolution.

    For demo: Uses Pillow bicubic upscaling with sharpening.
    """
    os.makedirs(output_dir, exist_ok=True)

    img = Image.open(input_path)
    w, h = img.size
    new_size = (w * scale_factor, h * scale_factor)

    # "Super-resolve" with bicubic interpolation
    upscaled = img.resize(new_size, Image.BICUBIC)

    # Apply sharpening to simulate detail enhancement
    upscaled = upscaled.filter(ImageFilter.SHARPEN)
    upscaled = upscaled.filter(ImageFilter.DETAIL)

    # Add label
    draw = ImageDraw.Draw(upscaled)
    label = f"Super-Resolved {scale_factor}x (Mock Diffusion)"
    draw.rectangle([5, 5, len(label) * 7 + 15, 28], fill=(0, 0, 0, 200))
    draw.text((10, 8), label, fill=(200, 100, 255))

    output_path = os.path.join(output_dir, "super_resolved.png")
    upscaled.save(output_path, "PNG")
    print(f"[Super-Res] Generated {scale_factor}x upscaled image: {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────
# CLI Entry Point
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    lat = float(sys.argv[1]) if len(sys.argv) > 1 else 28.6139
    lng = float(sys.argv[2]) if len(sys.argv) > 2 else 77.2090
    compliant = sys.argv[3].lower() != "violation" if len(sys.argv) > 3 else True

    print(f"\n{'='*60}")
    print(f"  Kisan-DePIN — Geospatial D-MRV Pipeline")
    print(f"  Coordinates: {lat}°N, {lng}°E")
    print(f"  Mode: {'COMPLIANT' if compliant else 'VIOLATION'}")
    print(f"{'='*60}\n")

    # Step 1: Fetch/generate satellite tile
    print("[Step 1/4] Generating satellite tile...")
    sat_path = generate_mock_satellite_tile(lat, lng)

    # Step 2: Super-resolution
    print("[Step 2/4] Applying super-resolution...")
    sr_path = mock_super_resolution(sat_path, scale_factor=2)

    # Step 3: Thermal heatmap
    print("[Step 3/4] Generating thermal heatmap...")
    heat_path = generate_thermal_heatmap(sat_path, is_compliant=compliant)

    # Step 4: Side-by-side comparison
    print("[Step 4/4] Creating comparison image...")
    comp_path = generate_comparison(sat_path, heat_path)

    print(f"\n✅ All outputs saved to ./output/")
    print(f"   Satellite:    {sat_path}")
    print(f"   Super-Res:    {sr_path}")
    print(f"   Heatmap:      {heat_path}")
    print(f"   Comparison:   {comp_path}")
