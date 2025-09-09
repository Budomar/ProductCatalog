"""
Scheduler for periodic tasks like data synchronization
"""

import os
import time
import logging
import schedule
from datetime import datetime
from sheets_sync import scheduled_sync
from data_service import DataService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def sync_data_job():
    """Job to sync data from Google Sheets"""
    logger.info("Starting scheduled data sync...")
    
    try:
        success = scheduled_sync()
        if success:
            logger.info("Data sync completed successfully")
            
            # Also update database if Flask app is running
            try:
                data_service = DataService()
                result = data_service.load_from_json()
                logger.info(f"Database updated: {result}")
            except Exception as db_error:
                logger.error(f"Database update failed: {db_error}")
                
        else:
            logger.error("Data sync failed")
            
    except Exception as e:
        logger.error(f"Scheduled sync error: {e}")

def cleanup_logs_job():
    """Job to cleanup old log files"""
    logger.info("Starting log cleanup...")
    
    try:
        # Keep only last 7 days of logs
        import glob
        import os
        from datetime import datetime, timedelta
        
        log_files = glob.glob("*.log")
        cutoff_date = datetime.now() - timedelta(days=7)
        
        for log_file in log_files:
            if os.path.getmtime(log_file) < cutoff_date.timestamp():
                os.remove(log_file)
                logger.info(f"Removed old log file: {log_file}")
                
    except Exception as e:
        logger.error(f"Log cleanup error: {e}")

def health_check_job():
    """Job to perform health checks"""
    logger.info("Performing health check...")
    
    try:
        # Check if data file exists and is recent
        data_file = 'data/products.json'
        if os.path.exists(data_file):
            file_time = os.path.getmtime(data_file)
            current_time = time.time()
            age_hours = (current_time - file_time) / 3600
            
            if age_hours > 25:  # More than 25 hours old
                logger.warning(f"Data file is {age_hours:.1f} hours old - may need manual sync")
            else:
                logger.info(f"Data file is {age_hours:.1f} hours old - OK")
        else:
            logger.error("Data file does not exist!")
            
        # Check disk space
        import shutil
        total, used, free = shutil.disk_usage('.')
        free_gb = free // (1024**3)
        
        if free_gb < 1:  # Less than 1GB free
            logger.warning(f"Low disk space: {free_gb}GB free")
        else:
            logger.info(f"Disk space OK: {free_gb}GB free")
            
    except Exception as e:
        logger.error(f"Health check error: {e}")

def setup_schedule():
    """Setup the schedule for all jobs"""
    logger.info("Setting up scheduler...")
    
    # Data sync every hour
    schedule.every().hour.do(sync_data_job)
    
    # Health check every 6 hours
    schedule.every(6).hours.do(health_check_job)
    
    # Log cleanup daily at 2 AM
    schedule.every().day.at("02:00").do(cleanup_logs_job)
    
    logger.info("Scheduler setup complete")
    
    # Print next run times
    for job in schedule.jobs:
        logger.info(f"Next run: {job.next_run} - {job.job_func.__name__}")

def run_scheduler():
    """Run the scheduler"""
    setup_schedule()
    
    logger.info("Scheduler started. Press Ctrl+C to stop.")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        logger.info("Scheduler stopped by user")
    except Exception as e:
        logger.error(f"Scheduler error: {e}")
        raise

def run_single_sync():
    """Run a single sync job manually"""
    logger.info("Running single sync job...")
    sync_data_job()
    logger.info("Single sync job completed")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "sync":
        # Run single sync
        run_single_sync()
    else:
        # Run continuous scheduler
        run_scheduler()
