import json
import time
import csv
from datetime import datetime
import requests
from pathlib import Path

# Google Sheets integration (optional - install: pip install gspread oauth2client)
try:
    import gspread
    from oauth2client.service_account import ServiceAccountCredentials
    GSHEETS_AVAILABLE = True
except ImportError:
    GSHEETS_AVAILABLE = False
    print("Google Sheets integration not available. Install with: pip install gspread oauth2client")

class PolymarketArbitrageMonitor:
    """
    Monitors Polymarket markets for arbitrage opportunities where YES + NO < 1.00
    Records frequency and size of mispricings for analysis
    """
    
    def __init__(self, config_file='config.json'):
        """Initialize the monitor with configuration"""
        self.config = self.load_config(config_file)
        self.csv_file = self.config.get('output_csv', 'arbitrage_data.csv')
        self.setup_csv()
        
        # Google Sheets setup (optional)
        self.gsheet = None
        if GSHEETS_AVAILABLE and self.config.get('use_google_sheets', False):
            self.setup_google_sheets()
    
    def load_config(self, config_file):
        """Load configuration from JSON file"""
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Create default config if not exists
            default_config = {
                "markets": [
                    {
                        "id": "market_id_1",
                        "name": "Trump wins 2024",
                        "api_endpoint": "https://clob.polymarket.com/markets/market_id_1"
                    }
                ],
                "thresholds": {
                    "primary": 1.00,
                    "secondary": 0.95,
                    "tertiary": 0.90
                },
                "polling_interval_seconds": 5,
                "output_csv": "arbitrage_data.csv",
                "use_google_sheets": False,
                "google_sheets_name": "Polymarket Arbitrage Data"
            }
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            print(f"Created default config file: {config_file}")
            print("Please edit it with your market IDs and settings")
            return default_config
    
    def setup_csv(self):
        """Create CSV file with headers if it doesn't exist"""
        file_exists = Path(self.csv_file).exists()
        
        if not file_exists:
            with open(self.csv_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'Timestamp_UTC',
                    'Market_ID',
                    'Market_Name',
                    'YES_Price',
                    'NO_Price',
                    'Sum',
                    'Gap_From_One',
                    'Below_1.00',
                    'Below_0.95',
                    'Below_0.90'
                ])
            print(f"Created CSV file: {self.csv_file}")
    
    def setup_google_sheets(self):
        """Setup Google Sheets integration"""
        try:
            # Define the scope
            scope = ['https://spreadsheets.google.com/feeds',
                     'https://www.googleapis.com/auth/drive']
            
            # Add credentials to the account
            creds = ServiceAccountCredentials.from_json_keyfile_name(
                'credentials.json', scope)
            
            # Authorize the clientsheet
            client = gspread.authorize(creds)
            
            # Get the spreadsheet
            sheet_name = self.config.get('google_sheets_name', 'Polymarket Arbitrage Data')
            try:
                sheet = client.open(sheet_name)
            except gspread.SpreadsheetNotFound:
                # Create new spreadsheet if it doesn't exist
                sheet = client.create(sheet_name)
                sheet.share('', perm_type='anyone', role='reader')  # Make it viewable
            
            # Get the first worksheet
            self.gsheet = sheet.get_worksheet(0)
            
            # Add headers if empty
            if not self.gsheet.row_values(1):
                self.gsheet.append_row([
                    'Timestamp_UTC',
                    'Market_ID',
                    'Market_Name',
                    'YES_Price',
                    'NO_Price',
                    'Sum',
                    'Gap_From_One',
                    'Below_1.00',
                    'Below_0.95',
                    'Below_0.90'
                ])
            
            print(f"Connected to Google Sheet: {sheet_name}")
            print(f"Share link: {sheet.url}")
            
        except Exception as e:
            print(f"Could not setup Google Sheets: {e}")
            print("Will only write to CSV file")
            self.gsheet = None
    
    def fetch_market_prices(self, market):
        """
        Fetch current YES and NO prices for a market
        
        NOTE: This is a PLACEHOLDER. You need to implement actual Polymarket API calls.
        Polymarket uses CLOB API: https://docs.polymarket.com/
        """
        try:
            # PLACEHOLDER - Replace with actual API call
            # Example using their REST API:
            # response = requests.get(f"https://clob.polymarket.com/prices/{market['id']}")
            # data = response.json()
            # return data['yes_price'], data['no_price']
            
            # For demonstration, returning mock data
            # In production, implement actual API integration
            import random
            yes_price = round(random.uniform(0.40, 0.60), 4)
            no_price = round(random.uniform(0.40, 0.60), 4)
            
            return yes_price, no_price
            
        except Exception as e:
            print(f"Error fetching prices for {market['name']}: {e}")
            return None, None
    
    def record_data(self, market, yes_price, no_price):
        """Record market data and check for arbitrage opportunities"""
        timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        
        # Calculate sum and gap
        price_sum = yes_price + no_price
        gap = 1.00 - price_sum
        
        # Check thresholds
        thresholds = self.config['thresholds']
        below_primary = 'YES' if price_sum < thresholds['primary'] else 'NO'
        below_secondary = 'YES' if price_sum < thresholds['secondary'] else 'NO'
        below_tertiary = 'YES' if price_sum < thresholds['tertiary'] else 'NO'
        
        # Prepare row data
        row = [
            timestamp,
            market['id'],
            market['name'],
            f"{yes_price:.4f}",
            f"{no_price:.4f}",
            f"{price_sum:.4f}",
            f"{gap:.4f}",
            below_primary,
            below_secondary,
            below_tertiary
        ]
        
        # Write to CSV
        with open(self.csv_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(row)
        
        # Write to Google Sheets if available
        if self.gsheet:
            try:
                self.gsheet.append_row(row)
            except Exception as e:
                print(f"Error writing to Google Sheets: {e}")
        
        # Log arbitrage opportunities
        if price_sum < thresholds['primary']:
            print(f"🚨 ARBITRAGE FOUND! {market['name']}: "
                  f"YES={yes_price:.4f} + NO={no_price:.4f} = {price_sum:.4f} "
                  f"(Gap: {gap:.4f})")
        
        return gap
    
    def monitor_markets(self):
        """Main monitoring loop - runs continuously"""
        print("=" * 60)
        print("Polymarket Arbitrage Monitor Started")
        print("=" * 60)
        print(f"Monitoring {len(self.config['markets'])} markets")
        print(f"Polling interval: {self.config['polling_interval_seconds']} seconds")
        print(f"Output: {self.csv_file}")
        if self.gsheet:
            print(f"Google Sheets: ENABLED")
        print("Press Ctrl+C to stop")
        print("=" * 60)
        
        iteration = 0
        
        try:
            while True:
                iteration += 1
                print(f"\n[Iteration {iteration}] {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
                
                for market in self.config['markets']:
                    yes_price, no_price = self.fetch_market_prices(market)
                    
                    if yes_price is not None and no_price is not None:
                        gap = self.record_data(market, yes_price, no_price)
                        print(f"  ✓ {market['name']}: "
                              f"YES={yes_price:.4f} NO={no_price:.4f} "
                              f"Sum={yes_price+no_price:.4f} Gap={gap:.4f}")
                    else:
                        print(f"  ✗ {market['name']}: Failed to fetch prices")
                
                # Wait before next poll
                time.sleep(self.config['polling_interval_seconds'])
                
        except KeyboardInterrupt:
            print("\n\n" + "=" * 60)
            print("Monitor stopped by user")
            print(f"Data saved to: {self.csv_file}")
            if self.gsheet:
                print(f"Google Sheets updated")
            print("=" * 60)

def main():
    """Main entry point"""
    monitor = PolymarketArbitrageMonitor('config.json')
    monitor.monitor_markets()

if __name__ == "__main__":
    main()
