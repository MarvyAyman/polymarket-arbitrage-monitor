# Polymarket Arbitrage Frequency Monitor

## 📋 Overview

This tool monitors selected Polymarket markets in real time and records:
- **How often** the sum of YES plus NO is below one
- **How large the difference is** when this happens (how far below one the sum goes)

The output is clean, structured data you can analyze in Excel or Google Sheets to understand:
- Which markets show the most opportunities
- How frequently the mispricing occurs
- Which times of day show the most occurrences

---

## 🚀 Quick Start

### 1. Install Requirements

```bash
pip install requests gspread oauth2client
```

### 2. Configure Markets

Edit `config.json` to add your markets:

```json
{
  "markets": [
    {
      "id": "YOUR_MARKET_ID",
      "name": "Trump wins 2024",
      "api_endpoint": "https://clob.polymarket.com/markets/YOUR_MARKET_ID"
    }
  ],
  "thresholds": {
    "primary": 1.0,
    "secondary": 0.95,
    "tertiary": 0.9
  },
  "polling_interval_seconds": 5
}
```

### 3. Run the Monitor

```bash
python polymarket_monitor.py
```

---

## 📊 Google Sheets Integration (Optional)

### Setup Steps:

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project: "Polymarket Monitor"
   - Enable Google Sheets API

2. **Create Service Account**
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download JSON key file
   - Rename it to `credentials.json` and place in same folder as script

3. **Enable in Config**
   ```json
   {
     "use_google_sheets": true,
     "google_sheets_name": "Polymarket Arbitrage Data"
   }
   ```

4. **Run Monitor**
   - Script will automatically create and update Google Sheet
   - You'll get a shareable link in console

---

## 📈 Google Sheets Dashboard

### Setup Dashboard:

1. Open your Google Sheet (created by Python script)
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Paste the dashboard script (provided separately)
5. Save and close
6. Refresh your sheet
7. Click **Arbitrage Dashboard** menu → **Setup Dashboard**

### Dashboard Features:

- **Dashboard Tab**: Real-time key metrics (last 24 hours)
- **Analysis Tab**: 
  - Frequency by market
  - Best times for arbitrage
  - Severity breakdown
- **Raw Data Tab**: All recorded updates with filters

### Auto-Email Reports:

1. In Apps Script editor, run `setupDailyTrigger()`
2. Authorize the script when prompted
3. You'll receive daily summaries at 9 AM

---

## 📁 Output Format

### CSV Columns:

| Column | Description |
|--------|-------------|
| Timestamp_UTC | When the update was recorded |
| Market_ID | Unique market identifier |
| Market_Name | Human-readable market name |
| YES_Price | Best available YES price |
| NO_Price | Best available NO price |
| Sum | YES + NO |
| Gap_From_One | 1.00 - Sum (the profit opportunity) |
| Below_1.00 | YES if sum < 1.00 |
| Below_0.95 | YES if sum < 0.95 |
| Below_0.90 | YES if sum < 0.90 |

### Example Data:

```
Timestamp_UTC,Market_Name,YES_Price,NO_Price,Sum,Gap_From_One,Below_1.00
2025-11-28 14:23:11,Trump wins 2024,0.4500,0.4700,0.9200,0.0800,YES
2025-11-28 14:23:45,Bitcoin 100k,0.5200,0.5100,1.0300,-0.0300,NO
```

---

## 🔧 Configuration Guide

### Adding Markets:

```json
{
  "id": "0xABCDEF123456",
  "name": "Your Market Name Here",
  "api_endpoint": "https://clob.polymarket.com/markets/0xABCDEF123456"
}
```

**Where to find Market IDs:**
- Visit Polymarket.com
- Open the market you want to track
- Market ID is in the URL: `polymarket.com/event/YOUR_MARKET_ID`

### Adjusting Thresholds:

```json
"thresholds": {
  "primary": 1.0,     // Main arbitrage threshold
  "secondary": 0.95,  // Significant opportunities
  "tertiary": 0.90    // Large opportunities
}
```

### Polling Interval:

```json
"polling_interval_seconds": 5  // Check every 5 seconds
```

**Recommended:**
- 5 seconds for active monitoring
- 10-30 seconds for background monitoring
- 60+ seconds for low-frequency markets

---

## 📊 Analysis Examples

### Excel/Sheets Formulas:

**Count total opportunities:**
```
=COUNTIF(H:H, "YES")
```

**Average gap size:**
```
=AVERAGEIF(H:H, "YES", G:G)
```

**Best market:**
```
=INDEX(C:C, MATCH(MAX(Opportunities), Opportunities, 0))
```

**Opportunities by hour:**
```
=COUNTIFS(A:A, ">="&DATE(2025,11,28), A:A, "<"&DATE(2025,11,29), H:H, "YES")
```

---

## 🔄 Continuous Operation

### Running 24/7:

**Option 1: Cloud Server (Recommended)**
```bash
# On AWS/Google Cloud/DigitalOcean
nohup python polymarket_monitor.py > monitor.log 2>&1 &
```

**Option 2: Local Machine with Screen**
```bash
screen -S polymarket
python polymarket_monitor.py
# Press Ctrl+A then D to detach
# Reconnect with: screen -r polymarket
```

**Option 3: systemd Service (Linux)**
```ini
[Unit]
Description=Polymarket Arbitrage Monitor

[Service]
ExecStart=/usr/bin/python3 /path/to/polymarket_monitor.py
Restart=always

[Install]
WantedBy=multi-user.target
```

---

## 🛠️ Troubleshooting

### "Module not found" Error
```bash
pip install requests gspread oauth2client
```

### Google Sheets Not Updating
- Check `credentials.json` is in correct folder
- Verify service account email has access to sheet
- Check `use_google_sheets: true` in config.json

### No Arbitrage Opportunities Found
- Normal! Real opportunities are rare
- Reduce thresholds to 0.98 for testing
- Increase number of monitored markets

### Connection Errors
- Check internet connection
- Verify Polymarket API endpoints are correct
- Script auto-reconnects on temporary failures

---

## 📧 Contact & Support

**Questions about setup?**
- Email: [your_email]
- Include your config.json (remove sensitive data)
- Attach error messages if any

**Feature requests welcome!**

---

## 📄 License

This tool is provided as-is for personal use in analyzing Polymarket market efficiency.

---

## 🎯 Next Steps

1. ✅ Install Python dependencies
2. ✅ Edit config.json with your markets
3. ✅ Run the monitor
4. ✅ (Optional) Setup Google Sheets integration
5. ✅ (Optional) Setup dashboard and email alerts
6. 📊 Start analyzing your data!

**Happy monitoring! May you find many arbitrage opportunities!** 🚀
