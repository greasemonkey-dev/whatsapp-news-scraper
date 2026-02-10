#!/bin/bash
# WhatsApp News Scraper Scheduler Management Script

PLIST_PATH="$HOME/Library/LaunchAgents/com.newsscraper.whatsapp.plist"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "$1" in
    start)
        echo "Loading scheduler..."
        launchctl load "$PLIST_PATH"
        echo "✅ Scheduler started - running every 10 minutes"
        ;;
    stop)
        echo "Unloading scheduler..."
        launchctl unload "$PLIST_PATH"
        echo "✅ Scheduler stopped"
        ;;
    restart)
        echo "Restarting scheduler..."
        launchctl unload "$PLIST_PATH" 2>/dev/null
        launchctl load "$PLIST_PATH"
        echo "✅ Scheduler restarted"
        ;;
    status)
        if launchctl list | grep -q "com.newsscraper.whatsapp"; then
            echo "✅ Scheduler is running"
            launchctl list | grep newsscraper
            echo ""
            echo "Last run output:"
            tail -10 "$PROJECT_DIR/logs/launchd-stdout.log"
        else
            echo "❌ Scheduler is not running"
        fi
        ;;
    logs)
        echo "=== Standard Output ==="
        tail -50 "$PROJECT_DIR/logs/launchd-stdout.log"
        echo ""
        echo "=== Standard Error ==="
        tail -50 "$PROJECT_DIR/logs/launchd-stderr.log"
        ;;
    run-now)
        echo "Running scraper manually..."
        cd "$PROJECT_DIR"
        npm start
        ;;
    *)
        echo "WhatsApp News Scraper Scheduler Management"
        echo ""
        echo "Usage: $0 {start|stop|restart|status|logs|run-now}"
        echo ""
        echo "Commands:"
        echo "  start     - Start the scheduler (runs every 10 minutes)"
        echo "  stop      - Stop the scheduler"
        echo "  restart   - Restart the scheduler"
        echo "  status    - Check if scheduler is running"
        echo "  logs      - View recent scheduler logs"
        echo "  run-now   - Run scraper manually (bypass scheduler)"
        exit 1
        ;;
esac
