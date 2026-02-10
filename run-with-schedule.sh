#!/bin/bash
# Wrapper script that checks active hours before running the scraper

# Configuration - Active hours (24-hour format)
ACTIVE_START_HOUR=6   # Start at 6:00 AM
ACTIVE_END_HOUR=21    # End at 9:00 PM (21:00)

# Get current hour
CURRENT_HOUR=$(date +%H)

# Remove leading zero for comparison
CURRENT_HOUR=$((10#$CURRENT_HOUR))

# Check if current time is within active hours
if [ $CURRENT_HOUR -ge $ACTIVE_START_HOUR ] && [ $CURRENT_HOUR -lt $ACTIVE_END_HOUR ]; then
    # Within active hours - run the scraper
    cd "$(dirname "$0")"
    node index.js
else
    # Outside active hours - skip this run
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Skipping run - outside active hours ($ACTIVE_START_HOUR:00 - $ACTIVE_END_HOUR:00)"
    exit 0
fi
