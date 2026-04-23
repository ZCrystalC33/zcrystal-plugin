#!/bin/bash
# Auto-setup for @zcrystal/evo dependency

set -e

TARGET_DIR="node_modules/@zcrystal/evo"
REPO_URL="https://github.com/ZCrystalC33/ZCrystal_evo.git"

# Check if already valid
if [ -d "$TARGET_DIR/dist" ] && [ -f "$TARGET_DIR/package.json" ]; then
    echo "✅ @zcrystal/evo already installed"
    exit 0
fi

# Check if it's a broken symlink
if [ -L "$TARGET_DIR" ]; then
    echo "🔗 Fixing broken symlink..."
    rm -rf "$TARGET_DIR"
fi

# Create directory
mkdir -p "$TARGET_DIR"

# Clone into temp, then move files (to avoid .git)
TEMP_DIR=$(mktemp -d)
git clone --depth 1 "$REPO_URL" "$TEMP_DIR"

# Move files (exclude .git, node_modules, etc.)
rsync -av --exclude='.git' --exclude='node_modules' --exclude='.gitignore' \
    "$TEMP_DIR/" "$TARGET_DIR/"

# Cleanup
rm -rf "$TEMP_DIR"

echo "✅ @zcrystal/evo installed from GitHub"
