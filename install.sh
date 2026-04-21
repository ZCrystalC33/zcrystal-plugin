#!/bin/bash
# =============================================================================
# ZCrystal Plugin - Fully Automated Installation Script v0.7.0
# =============================================================================
# Usage: ./install.sh [--help|--check]
#   --help     Show this help message
#   --check    Run pre-installation check only
#   --force    Force reinstallation
# =============================================================================

set -e

# =============================================================================
# Configuration
# =============================================================================
VERSION="1.0.0"
PLUGIN_NAME="@zcrystal/openclaw-plugin"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OPENCLAW_PATH="${OPENCLAW_PATH:-$HOME/.openclaw}"
ZCrystal_DATA_PATH="${ZCRYSTAL_DATA_PATH:-$OPENCLAW_PATH/extensions/zcrystal}"

# Environment variables (can be overridden)
ZCRYSTAL_FTS5_PORT="${ZCRYSTAL_FTS5_PORT:-18795}"
ZCRYSTAL_EVOLUTION_INTERVAL="${ZCRYSTAL_EVOLUTION_INTERVAL:-3600000}"
ZCRYSTAL_HEARTBEAT_INTERVAL="${ZCRYSTAL_HEARTBEAT_INTERVAL:-300000}"
ZCRYSTAL_PROACTIVE_INTERVAL="${ZCRYSTAL_PROACTIVE_INTERVAL:-600000}"
ZCRYSTAL_AUTO_START="${ZCRYSTAL_AUTO_START:-false}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Log functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# =============================================================================
# Help
# =============================================================================
show_help() {
    cat << EOF
ZCrystal Plugin v${VERSION} - Automated Installer

Usage: ./install.sh [OPTIONS]

Options:
  --help     Show this help message
  --check    Run pre-installation check only
  --force    Force reinstallation (overwrites existing files)

Environment Variables:
  OPENCLAW_PATH              OpenClaw installation path (default: ~/.openclaw)
  ZCRYSTAL_DATA_PATH         ZCrystal data directory
  ZCRYSTAL_FTS5_PORT         FTS5 MCP port (default: 18795)
  ZCRYSTAL_EVOLUTION_INTERVAL Evolution interval in ms (default: 3600000)
  ZCRYSTAL_HEARTBEAT_INTERVAL Heartbeat interval in ms (default: 300000)
  ZCRYSTAL_PROACTIVE_INTERVAL Proactive check interval in ms (default: 600000)
  ZCRYSTAL_AUTO_START        Enable auto-evolution on startup (default: false)

Example:
  OPENCLAW_PATH=/opt/openclaw ./install.sh

For more information, see:
  https://github.com/ZCrystalC33/zcrystal-plugin
EOF
}

# =============================================================================
# Prerequisites Check
# =============================================================================
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing=()
    
    # Node.js
    if ! command -v node &> /dev/null; then
        missing+=("node")
    else
        log_success "Node.js: $(node --version)"
    fi
    
    # npm
    if ! command -v npm &> /dev/null; then
        missing+=("npm")
    else
        log_success "npm: v$(npm --version)"
    fi
    
    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required dependencies: ${missing[*]}"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# =============================================================================
# Path Detection
# =============================================================================
detect_paths() {
    log_info "Detecting OpenClaw installation..."
    
    local detected=false
    
    for path in "$HOME/.openclaw" "/root/.openclaw" "/home/$USER/.openclaw"; do
        if [ -d "$path" ]; then
            OPENCLAW_PATH="$path"
            detected=true
            log_success "OpenClaw found: $OPENCLAW_PATH"
            break
        fi
    done
    
    if [ "$detected" = false ]; then
        log_warn "OpenClaw not found. Using: $OPENCLAW_PATH"
    fi
    
    ZCRYSTAL_DATA_PATH="${ZCRYSTAL_DATA_PATH:-$OPENCLAW_PATH/extensions/zcrystal}"
}

# =============================================================================
# Directory Setup
# =============================================================================
setup_directories() {
    log_info "Creating directory structure..."
    
    for dir in "$OPENCLAW_PATH" "$ZCrystal_DATA_PATH" "$ZCrystal_DATA_PATH/data" \
               "$ZCrystal_DATA_PATH/skills" "$OPENCLAW_PATH/extensions/zcrystal" \
               "$OPENCLAW_PATH/extensions/zcrystal/dist"; do
        [ -d "$dir" ] || mkdir -p "$dir"
    done
    
    log_success "Directories created"
}

# =============================================================================
# ZCrystal_evo Setup
# =============================================================================
setup_zcrystal_evo() {
    log_info "Setting up ZCrystal_evo dependency..."
    
    local evo_path="$SCRIPT_DIR/../ZCrystal_evo"
    
    if [ ! -d "$evo_path" ]; then
        log_error "ZCrystal_evo not found at: $evo_path"
        exit 1
    fi
    
    log_success "ZCrystal_evo found: $evo_path"
    
    # Only create package.json if it doesn't exist
    if [ ! -f "$evo_path/package.json" ]; then
        cat > "$evo_path/package.json" << 'EOF'
{
  "name": "@zcrystal/evo",
  "version": "0.3.0",
  "description": "ZCrystal Evolution Engine",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
EOF
    fi
    
    # Build ZCrystal_evo
    log_info "Building ZCrystal_evo..."
    (cd "$evo_path" && npm run build)
    
    log_success "ZCrystal_evo built"
}

# =============================================================================
# Plugin Installation
# =============================================================================
install_plugin() {
    log_info "Installing ZCrystal Plugin..."
    
    cd "$SCRIPT_DIR"
    
    # Create package.json for plugin if needed
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    # Update ZCrystal_evo path in package.json
    python3 -c "
import json
with open('package.json', 'r') as f:
    data = json.load(f)
data['dependencies']['@zcrystal/evo'] = 'file:$SCRIPT_DIR/../ZCrystal_evo'
with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
" 2>/dev/null || true
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm install --legacy-peer-deps 2>&1 | tail -3
    
    # Build plugin
    log_info "Building plugin..."
    npm run build 2>&1 | tail -3
    
    # Copy to extensions
    log_info "Installing to OpenClaw..."
    cp dist/index.js "$OPENCLAW_PATH/extensions/zcrystal/dist/"
    
    log_success "Plugin installed"
}

# =============================================================================
# Configuration
# =============================================================================
create_configuration() {
    log_info "Creating configuration..."
    
    cat > "$ZCrystal_DATA_PATH/config.json" << EOF
{
  "version": "$VERSION",
  "paths": {
    "openclaw": "$OPENCLAW_PATH",
    "data": "$ZCrystal_DATA_PATH",
    "skills": "$OPENCLAW_PATH/skills",
    "temp": "/tmp/zcrystal"
  },
  "fts5": {
    "mcpUrl": "http://localhost:${ZCRYSTAL_FTS5_PORT}/mcp",
    "port": "${ZCRYSTAL_FTS5_PORT}",
    "enabled": true
  },
  "intervals": {
    "evolution": ${ZCRYSTAL_EVOLUTION_INTERVAL},
    "heartbeat": ${ZCRYSTAL_HEARTBEAT_INTERVAL},
    "proactive": ${ZCRYSTAL_PROACTIVE_INTERVAL}
  },
  "autoStart": {
    "evolution": ${ZCRYSTAL_AUTO_START}
  }
}
EOF

    log_success "Configuration created"
}

# =============================================================================
# Verification
# =============================================================================
verify_installation() {
    log_info "Verifying installation..."
    
    local plugin_file="$OPENCLAW_PATH/extensions/zcrystal/dist/index.js"
    
    if [ -f "$plugin_file" ]; then
        local size=$(stat -c%s "$plugin_file" 2>/dev/null || echo "unknown")
        log_success "Plugin: $plugin_file ($size bytes)"
        
        local tool_count=$(grep -c "api.registerTool" "$plugin_file" 2>/dev/null || echo "0")
        log_success "Tools: $tool_count"
        
        return 0
    else
        log_error "Plugin not found"
        return 1
    fi
}

# =============================================================================
# Main
# =============================================================================
main() {
    # Parse arguments
    local check_only=false
    local force=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --check|-c)
                check_only=true
                shift
                ;;
            --force|-f)
                force=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║         ZCrystal Plugin v${VERSION} - Automated Installer          ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    check_prerequisites
    detect_paths
    setup_directories
    setup_zcrystal_evo
    install_plugin
    create_configuration
    
    echo ""
    if verify_installation; then
        echo ""
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║            Installation Complete!                              ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "  Plugin: $OPENCLAW_PATH/extensions/zcrystal/dist/"
        echo "  Config: $ZCrystal_DATA_PATH/config.json"
        echo ""
        echo "Next: Restart OpenClaw, then run: zcrystal_evo_health"
    else
        log_error "Installation failed"
        exit 1
    fi
}

main "$@"
