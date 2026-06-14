INTROSPECT V1 – Trade Journal Import &
Reconstruction Engine
Final Developer Specification
1. Product Objective
INTROSPECT is a post-market behavioral journaling platform.
Users upload their broker Trade Book after market hours.
INTROSPECT automatically:
• 
• 
• 
• 
• 
Reconstructs trades
Calculates P&L
Calculates holding duration
Creates journal entries
Generates behavioral insights
No manual trade entry should be required.
Target user effort:
Less than 60 seconds per day
2. User Workflow
Step 1
User exports Trade Book from broker.
Supported brokers:
• 
• 
• 
• 
• 
• 
Zerodha
FYERS
Angel One
Upstox
Dhan
Shoonya
1
Any broker providing Trade Book export
• 
Step 2
User copies only:
Symbol Trade Type Quantity Price Execution Time
Step 3
User pastes data into INTROSPECT template or uploads CSV/XLSX.
Step 4
User clicks:
Upload & Analyze
Step 5
INTROSPECT:
• 
• 
• 
• 
• 
Validates data
Reconstructs trades
Creates journal entries
Runs behavioral analytics
Displays results
3. Supported Asset Types (V1)
Supported
✅ Equity Intraday
✅ Futures
✅ Options
✅ Long Trades
2
✅ Short Trades
Not Supported
❌ CNC Holdings
❌ Delivery Portfolio
❌ Mutual Funds
❌ Currency
❌ Commodities
❌ Multi-Day Holdings
4. Import Template
Required Columns:
Column
Symbol
Required
Yes
Trade Type (BUY/SELL)
Yes
Quantity
Yes
Price
Yes
Execution Time
Yes
5. Import Validation Rules
Before processing:
Validate:
• 
• 
• 
• 
Symbol exists
Trade Type exists
Quantity > 0
Price > 0
3
Execution Time valid
• 
Invalid rows must NOT stop import.
Instead:
• 
• 
• 
Skip row
Add to Ignored Records Report
Show reason
Examples:
• 
• 
• 
• 
• 
Missing Symbol
Missing Quantity
Missing Price
Invalid Trade Type
Invalid Timestamp
6. Trade Reconstruction Engine
Core Principle
A trade is considered CLOSED only when:
Net Position = 0
Processing Logic
Step 1
Group rows by Symbol.
Step 2
Sort by:
1. 
2. 
3. 
Full Execution Datetime
Trade ID (if available)
Upload Sequence
Important:
4
Use FULL DATETIME.
Never sort by time alone.
Step 3
Determine Trade Direction
If first transaction = BUY
Direction = LONG
If first transaction = SELL
Direction = SHORT
Step 4
Maintain Running Position
BUY
Position += Quantity
SELL
Position -= Quantity
Step 5
Track Accumulators
Maintain:
• 
• 
• 
• 
Total Buy Quantity
Total Buy Value
Total Sell Quantity
Total Sell Value
5
Step 6
Close Trade
When:
Position = 0
Create Journal Entry
Reset counters
Start next trade cycle
7. Trade Matching Method
Use:
Weighted Average Method
Not FIFO
Not LIFO
Average Entry
Average Entry Price
=
Total Buy Value
÷
Total Buy Quantity
Average Exit
Average Exit Price
=
6
Total Sell Value
÷
Total Sell Quantity
8. P&L Calculation
Long Trade
Gross P&L
=
(Avg Exit Price − Avg Entry Price)
×
Quantity
Short Trade
Gross P&L
=
(Avg Sell Price − Avg Buyback Price)
×
Quantity
9. Journal Entry Schema
Create one record per completed trade.
Fields:
• 
• 
Journal ID
Trade Date
7
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
Symbol
Direction
Entry Time
Exit Time
Holding Duration
Quantity
Average Entry Price
Average Exit Price
Gross P&L
Projected Net P&L
Status
Status values:
• 
• 
• 
Completed
Open
Ignored
10. Behavioral Analytics Input
Analytics must run ONLY on reconstructed trades.
Never run analytics on raw executions.
Input fields:
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
Symbol
Direction
Entry Time
Exit Time
Holding Duration
Quantity
Average Entry Price
Average Exit Price
Gross P&L
Projected Net P&L
11. Behavioral Analysis (V1)
Generate:
• 
• 
Total Trades
Win Rate
8
• 
• 
• 
• 
• 
• 
• 
• 
• 
Detect:
• 
• 
• 
• 
• 
• 
Average Winner
Average Loser
Total Gross P&L
Projected Net P&L
Trade Frequency
Holding Time Analysis
Best Symbols
Worst Symbols
Time-of-Day Performance
Overtrading
Revenge Trading
Position Size Escalation
Averaging Down
Early Profit Booking
Holding Losers Too Long
12. Edge Cases
Open Position
Example:
BUY 10
BUY 5
Position = +15
Rule:
Do not journal.
Mark:
Status = Open Position
Overnight Position
Day 1
9
BUY 10
Day 2
SELL 10
Rule:
Ignore in V1
Support in V2
Position Reversal
Example:
BUY 10
SELL 20
Position:
+10 → -10
Rule:
Split automatically
Trade #1
BUY 10
SELL 10
Trade #2
SHORT 10
10
Same Timestamp
Sort by:
1. 
2. 
3. 
Datetime
Trade ID
Upload Sequence
Quantity Mismatch
BUY 10
SELL 8
Position = +2
Rule:
Open Position
Do not journal
13. Duplicate Upload Protection
If user uploads same Trade Book multiple times:
Do not create duplicate journal entries.
Use unique fingerprint:
• 
• 
• 
• 
• 
Symbol
Trade Type
Quantity
Price
Execution Time
to detect duplicates.
14. Ignored & Unprocessed Records Report
Never silently ignore data.
11
Every row must belong to:
1. 
2. 
3. 
Processed
Open Position
Ignored
Processing Summary
Display:
• 
• 
• 
• 
• 
Total Rows Uploaded
Rows Processed
Rows Ignored
Completed Trades Created
Open Positions
Ignored Records
Show reason:
Open Position
Example:
RELIANCE → Open Position (+15)
Overnight Position
Example:
INFY → Overnight Carry Forward
Invalid Data
Examples:
• 
• 
• 
Missing Price
Missing Quantity
Invalid Timestamp
12
Unsupported Transaction Type
Unable to classify BUY/SELL
15. P&L Display Logic
Gross P&L
All journal calculations should be labeled:
Gross P&L
Reason:
Trade Book exports generally do not include:
• 
• 
• 
• 
• 
• 
Brokerage
STT
Exchange Charges
GST
SEBI Charges
Stamp Duty
Projected Net P&L
Display:
• 
• 
• 
Gross P&L
Estimated Charges
Projected Net P&L
Conservative Estimation Model
If Gross P&L > 0
Estimated Charges
=
Gross P&L × 5%
13
Projected Net P&L
=
Gross P&L × 95%
Examples:
Gross
₹1,000
Charges
₹50
Projected Net
₹950
₹5,000
₹250
₹4,750
₹10,000
₹500
₹9,500
If Gross P&L < 0
Projected Net P&L
=
Gross P&L
(No adjustment required in V1)
Disclaimer
Projected Net P&L is only an estimate.
Actual broker-reported P&L may vary depending on:
• 
• 
• 
• 
• 
• 
Brokerage
STT
Exchange Charges
GST
SEBI Charges
Stamp Duty
Behavioral analysis should use Gross P&L.
Projected Net P&L is for conservative display purposes only.
14
16. Success Criteria
A user should be able to:
1. 
2. 
3. 
4. 
5. 
Export Trade Book
Copy 5 required columns
Upload
Receive a fully generated trading journal
Receive behavioral insights
without manually entering any trade details.
Target completion time:
Under 60 seconds.
