#!/bin/bash
# =============================================================================
# ZCrystal Plugin Setup Wizard
# =============================================================================
# Interactive setup script for installing ZCrystal Plugin
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Config defaults
OPENCLAW_PATH="$HOME/.openclaw"
ZCrystal_DATA_PATH="$OPENCLAW_PATH/extensions/zcrystal"
ZCrystal_SKILLS_PATH="$OPENCLAW_PATH/skills"

# Print functions
print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         ZCrystal Plugin Setup Wizard v0.7.0              ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "\n${GREEN}[STEP $1]${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_info() {
    echo -e "  $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "1" "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    else
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm: v$NPM_VERSION"
    else
        print_error "npm is required but not installed"
        exit 1
    fi
    
    # Check OpenClaw
    if [ -d "$OPENCLAW_PATH" ]; then
        print_success "OpenClaw: $OPENCLAW_PATH"
    else
        print_warning "OpenClaw directory not found at $OPENCLAW_PATH"
    fi
}

# Detect OpenClaw path
detect_openclaw() {
    print_step "2" "Detecting OpenClaw installation..."
    
    if [ -d "$HOME/.openclaw" ]; then
        print_success "OpenClaw found: $HOME/.openclaw"
        OPENCLAW_PATH="$HOME/.openclaw"
    elif [ -d "/root/.openclaw" ]; then
        print_success "OpenClaw found: /root/.openclaw"
        OPENCLAW_PATH="/root/.openclaw"
    else
        print_warning "OpenClaw not found. Using default: $OPENCLAW_PATH"
    fi
}

# Create directories
create_directories() {
    print_step "3" "Creating directories..."
    
    mkdir -p "$ZCrystal_DATA_PATH/data"
    mkdir -p "$ZCrystal_DATA_PATH/skills"
    mkdir -p "$OPENCLAW_PATH/extensions/zcrystal/dist"
    print_success "Directories created"
}

# Install dependencies
install_dependencies() {
    print_step "4" "Installing dependencies..."
    
    cd "$(dirname "$0")"
    npm install
    print_success "Dependencies installed"
}

# Build plugin
build_plugin() {
    print_step "5" "Building plugin..."
    
    npm run build
    print_success "Plugin built successfully"
}

# Copy to extensions
copy_to_extensions() {
    print_step "6" "Installing to OpenClaw..."
    
    cp dist/index.js "$OPENCLAW_PATH/extensions/zcrystal/dist/"
    print_success "Plugin installed to OpenClaw"
}

# Update config (optional)
update_env() {
    print_step "7" "Configuring environment..."
    
    ENV_FILE="$OPENCLAW_PATH/.env"
    if [ -f "$ENV_FILE" ]; then
        if ! grep -q "ZCRYSTAL" "$ENV_FILE"; then
            echo "" >> "$ENV_FILE"
            echo "# ZCrystal Plugin Configuration" >> "$ENV_FILE"
            echo "ZCRYSTAL_DATA_PATH=$ZCrystal_DATA_PATH" >> "$ENV_FILE"
            echo "ZCRYSTAL_SKILLS_PATH=$ZCrystal_SKILLS_PATH" >> "$ENV_FILE"
        fi
        print_success "Environment variables updated"
    else
        print_info "No .env file found, skipping..."
    fi
}

# Final check
final_check() {
    print_step "8" "Final verification..."
    
    if [ -f "$OPENCLAW_PATH/extensions/zcrystal/dist/index.js" ]; then
        print_success "Installation verified!"
        return 0
    else
        print_error "Installation verification failed"
        return 1
    fi
}

# Print completion
print_completion() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           ZCrystal Plugin Setup Complete!               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "  Installation path: $ZCrystal_DATA_PATH"
    echo "  OpenClaw path: $OPENCLAW_PATH"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Restart OpenClaw to load the plugin"
    echo "  2. Check plugin status with: zcrystal_evo_health"
    echo "  3. Start auto-evolution: zcrystal_scheduler_start"
    echo ""
    echo -e "${YELLOW}Configuration:${NC}"
    echo "  Set ZCRYSTAL_FTS5_PORT to change FTS5 MCP port (default: 18795)"
    echo "  Set ZCRYSTAL_EVOLUTION_INTERVAL for evolution interval (default: 3600000ms)"
    echo ""
}

# Main
main() {
    print_header
    
    check_prerequisites
    detect_openclaw
    create_directories
    install_dependencies
    build_plugin
    copy_to_extensions
    update_env
    
    if final_check; then
        print_completion
    else
        echo -e "\n${RED}Setup failed. Please check the errors above.${NC}"
        exit 1
    fi
}

main "$@"
