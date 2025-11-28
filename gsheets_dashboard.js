/**
 * Polymarket Arbitrage Dashboard - Google Apps Script
 * 
 * This script creates analysis sheets and auto-updating dashboards
 * Install: Extensions > Apps Script > Paste this code > Save > Run setup()
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Arbitrage Dashboard')
      .addItem('Setup Dashboard', 'setupDashboard')
      .addItem('Refresh Analysis', 'refreshAnalysis')
      .addItem('Send Summary Email', 'sendDailySummary')
      .addToUi();
}

function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets if they don't exist
  createOrGetSheet(ss, 'Raw Data');
  createOrGetSheet(ss, 'Analysis');
  createOrGetSheet(ss, 'Dashboard');
  
  setupAnalysisSheet(ss);
  setupDashboardSheet(ss);
  
  SpreadsheetApp.getUi().alert('Dashboard setup complete! Check the Analysis and Dashboard tabs.');
}

function createOrGetSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function setupAnalysisSheet(ss) {
  const sheet = ss.getSheetByName('Analysis');
  sheet.clear();
  
  // Headers
  sheet.getRange('A1:D1').setValues([['Analysis Section', '', '', '']]);
  sheet.getRange('A1:D1').setFontWeight('bold').setBackground('#4285f4').setFontColor('#ffffff');
  
  // Market frequency analysis
  sheet.getRange('A3').setValue('📊 Arbitrage Frequency by Market');
  sheet.getRange('A3').setFontWeight('bold').setFontSize(12);
  
  sheet.getRange('A5:D5').setValues([['Market Name', 'Total Opportunities', 'Avg Gap', 'Max Gap']]);
  sheet.getRange('A5:D5').setFontWeight('bold').setBackground('#e8f0fe');
  
  // Formula to count opportunities per market
  const rawSheet = ss.getSheetByName('Raw Data');
  if (rawSheet) {
    sheet.getRange('A6').setFormula('=UNIQUE(\'Raw Data\'!C2:C)');
    sheet.getRange('B6').setFormula('=COUNTIFS(\'Raw Data\'!C:C,A6,\'Raw Data\'!H:H,"YES")');
    sheet.getRange('C6').setFormula('=AVERAGEIFS(\'Raw Data\'!G:G,\'Raw Data\'!C:C,A6,\'Raw Data\'!H:H,"YES")');
    sheet.getRange('D6').setFormula('=MAXIFS(\'Raw Data\'!G:G,\'Raw Data\'!C:C,A6,\'Raw Data\'!H:H,"YES")');
  }
  
  // Time analysis
  sheet.getRange('A15').setValue('⏰ Best Times for Arbitrage (Hour of Day)');
  sheet.getRange('A15').setFontWeight('bold').setFontSize(12);
  
  sheet.getRange('A17:C17').setValues([['Hour (UTC)', 'Opportunities', 'Avg Gap']]);
  sheet.getRange('A17:C17').setFontWeight('bold').setBackground('#e8f0fe');
  
  // Threshold breakdown
  sheet.getRange('F3').setValue('🎯 Severity Breakdown');
  sheet.getRange('F3').setFontWeight('bold').setFontSize(12);
  
  sheet.getRange('F5:G5').setValues([['Threshold', 'Count']]);
  sheet.getRange('F5:G5').setFontWeight('bold').setBackground('#e8f0fe');
  
  if (rawSheet) {
    sheet.getRange('F6:G8').setValues([
      ['Below 1.00', '=COUNTIF(\'Raw Data\'!H:H,"YES")'],
      ['Below 0.95', '=COUNTIF(\'Raw Data\'!I:I,"YES")'],
      ['Below 0.90', '=COUNTIF(\'Raw Data\'!J:J,"YES")']
    ]);
  }
  
  // Format columns
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 120);
}

function setupDashboardSheet(ss) {
  const sheet = ss.getSheetByName('Dashboard');
  sheet.clear();
  
  // Title
  sheet.getRange('A1:F1').merge();
  sheet.getRange('A1').setValue('🎯 Polymarket Arbitrage Dashboard');
  sheet.getRange('A1').setFontSize(18).setFontWeight('bold')
       .setBackground('#4285f4').setFontColor('#ffffff')
       .setHorizontalAlignment('center');
  
  // Key metrics
  sheet.getRange('A3').setValue('Key Metrics (Last 24 Hours)');
  sheet.getRange('A3').setFontWeight('bold').setFontSize(14);
  
  const rawSheet = ss.getSheetByName('Raw Data');
  if (rawSheet) {
    // Total opportunities
    sheet.getRange('A5').setValue('Total Opportunities:');
    sheet.getRange('B5').setFormula('=COUNTIFS(\'Raw Data\'!H:H,"YES",\'Raw Data\'!A:A,">="&NOW()-1)');
    sheet.getRange('B5').setNumberFormat('#,##0');
    
    // Average gap
    sheet.getRange('A6').setValue('Average Gap:');
    sheet.getRange('B6').setFormula('=AVERAGEIFS(\'Raw Data\'!G:G,\'Raw Data\'!H:H,"YES",\'Raw Data\'!A:A,">="&NOW()-1)');
    sheet.getRange('B6').setNumberFormat('0.0000');
    
    // Biggest opportunity
    sheet.getRange('A7').setValue('Biggest Gap:');
    sheet.getRange('B7').setFormula('=MAXIFS(\'Raw Data\'!G:G,\'Raw Data\'!H:H,"YES",\'Raw Data\'!A:A,">="&NOW()-1)');
    sheet.getRange('B7').setNumberFormat('0.0000');
    
    // Markets monitored
    sheet.getRange('A8').setValue('Markets Monitored:');
    sheet.getRange('B8').setFormula('=COUNTA(UNIQUE(\'Raw Data\'!C2:C))');
  }
  
  sheet.getRange('A5:A8').setFontWeight('bold');
  sheet.getRange('B5:B8').setBackground('#e8f0fe');
  
  // Instructions
  sheet.getRange('D3').setValue('📌 Quick Actions');
  sheet.getRange('D3').setFontWeight('bold').setFontSize(14);
  
  sheet.getRange('D5:E8').setValues([
    ['View Analysis Tab', 'Detailed breakdowns'],
    ['View Raw Data Tab', 'All recorded updates'],
    ['Menu > Refresh Analysis', 'Update calculations'],
    ['Menu > Send Summary Email', 'Email daily report']
  ]);
  
  sheet.getRange('D5:D8').setFontWeight('bold');
  
  // Format
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(4, 180);
  sheet.setColumnWidth(5, 200);
}

function refreshAnalysis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupAnalysisSheet(ss);
  SpreadsheetApp.getUi().alert('Analysis refreshed!');
}

function sendDailySummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rawSheet = ss.getSheetByName('Raw Data');
  
  if (!rawSheet) {
    SpreadsheetApp.getUi().alert('No data found!');
    return;
  }
  
  // Get last 24 hours data
  const data = rawSheet.getDataRange().getValues();
  const yesterday = new Date(Date.now() - 24*60*60*1000);
  
  let opportunities = 0;
  let totalGap = 0;
  let maxGap = 0;
  const markets = {};
  
  for (let i = 1; i < data.length; i++) {
    const timestamp = new Date(data[i][0]);
    if (timestamp >= yesterday && data[i][7] === 'YES') {
      opportunities++;
      const gap = parseFloat(data[i][6]);
      totalGap += gap;
      maxGap = Math.max(maxGap, gap);
      
      const market = data[i][2];
      markets[market] = (markets[market] || 0) + 1;
    }
  }
  
  const avgGap = opportunities > 0 ? (totalGap / opportunities).toFixed(4) : 0;
  
  // Find best market
  let bestMarket = '';
  let maxCount = 0;
  for (const [market, count] of Object.entries(markets)) {
    if (count > maxCount) {
      maxCount = count;
      bestMarket = market;
    }
  }
  
  // Create email
  const subject = `🎯 Polymarket Arbitrage Summary - ${new Date().toLocaleDateString()}`;
  const body = `
Daily Arbitrage Summary
=======================

📊 Last 24 Hours:
• Total Opportunities: ${opportunities}
• Average Gap: $${avgGap}
• Biggest Gap: $${maxGap.toFixed(4)}

🏆 Best Market:
${bestMarket} (${maxCount} opportunities)

📈 View full dashboard:
${ss.getUrl()}

---
This is an automated report from your Polymarket Arbitrage Monitor
`;
  
  // Get recipient from sheet or use placeholder
  const recipient = Session.getActiveUser().getEmail();
  
  try {
    MailApp.sendEmail(recipient, subject, body);
    SpreadsheetApp.getUi().alert(`Summary sent to ${recipient}`);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Error sending email: ' + e.toString());
  }
}

/**
 * Set up automatic daily emails
 * Run this once to enable daily summaries at 9 AM
 */
function setupDailyTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new daily trigger at 9 AM
  ScriptApp.newTrigger('sendDailySummary')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .create();
  
  SpreadsheetApp.getUi().alert('Daily email summary enabled! You will receive reports at 9 AM daily.');
}
