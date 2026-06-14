**DataRetention&** **StorageArchitecture** **Objective**

INTROSPECT'slong-termvaluecomesfrombehavioralanalysisovermonthsandyears.

Therefore,processedjournalandanalyticsdatashouldberetainedindefinitelyunlesstheuserdeletestheir
account.

**StorePermanently** Thefollowingdatashouldbestoredindefinitely:

**UserProfile**

> •UserID •RegistrationDate •SubscriptionStatus •Settings

**ReconstructedTrades** Storefinalreconstructedtradesonly.

Donotrelyonuploadedfilesforfutureanalysis.

Fields:

> •TradeID •Symbol •Direction •EntryTime •ExitTime •Quantity
> •AverageEntry •AverageExit •GrossP&L
>
> •ProjectedNetP&L
>
> 1

**JournalEntries** Store:

> •DailyJournal •TradeNotes •JournalStatus •TradeTags

**BehavioralAnalytics** Store:

> •OvertradingFlags •RevengeTradingFlags •FOMOFlags •AveragingDownFlags
> •EarlyExitFlags •HoldingLosersFlags

**DisciplineScores** Store:

> •DailyDisciplineScore •WeeklyDisciplineScore •MonthlyDisciplineScore

Usedforlong-termtrendanalysis.

**AIReviews** Store:

> •DailyAIReviews •WeeklyAIReviews •MonthlyAIReviews

Thesebecomepartoftheuser'sperformancehistory.

> 2

**PerformanceMetrics** Store:

> •WinRateHistory •P&LHistory •HoldingTimeHistory •PositionSizeHistory
> •Best/WorstTradingTimes

**DoNotStorePermanently**
Thesefilesshouldbeconsideredtemporaryprocessingfiles.

**RawUploadFiles** Examples:

> •CSV •XLSX
>
> •BrokerExportFiles

Retention:

30DaysMaximum

Preferred:

Deleteimmediatelyaftersuccessfulprocessing.

**TemporaryImportFiles** Examples:

> •Parsingfiles •Processingcache •Intermediateimports

Retention:

Deleteafterprocessingcompletes.

> 3

**AccountDeletionPolicy** Ifuserdeletesaccount:

Delete:

> •TradeData •JournalEntries •BehavioralAnalytics •DisciplineScores
> •AIReviews

within30days.

**DesignPrinciple**
INTROSPECTshouldbecometheuser'slifetimetradingperformancedatabase.

Historicalanalyticsshouldremainavailablesotheplatformcananswerquestionssuchas:

> •Howhasmywinratechangedover12months? •Hasmydisciplineimproved?
> •Isovertradingbecominglessfrequent?
> •Whatismymostprofitabletradingwindow? •Howhasmyriskmanagementevolved?

Theseinsightsrequirelong-termretentionofprocesseddata.

> 4
