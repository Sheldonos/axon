CREATE TABLE `counterparties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`legalEntity` varchar(255) NOT NULL,
	`jurisdiction` varchar(100) NOT NULL,
	`creditRating` varchar(50),
	`contactEmail` varchar(320),
	`contactPhone` varchar(50),
	`address` text,
	`status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `counterparties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskCalculations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`termSheetId` int NOT NULL,
	`exposureAmount` int NOT NULL,
	`potentialExposure` int NOT NULL,
	`collateralRequired` int NOT NULL,
	`baseScenarioPnL` int NOT NULL,
	`bullScenarioPnL` int NOT NULL,
	`bearScenarioPnL` int NOT NULL,
	`stressScenarioPnL` int NOT NULL,
	`creditRisk` varchar(50) NOT NULL,
	`marketRisk` varchar(50) NOT NULL,
	`liquidityRisk` varchar(50) NOT NULL,
	`valueAtRisk95` int,
	`valueAtRisk99` int,
	`calculatedAt` timestamp NOT NULL DEFAULT (now()),
	`calculatedById` int NOT NULL,
	CONSTRAINT `riskCalculations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `termSheets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instrumentType` enum('interest_rate_swap','currency_swap','credit_default_swap','equity_option','commodity_forward','fx_forward','variance_swap','total_return_swap') NOT NULL,
	`notionalAmount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`strikePrice` int,
	`fixedRate` int,
	`tradeDate` timestamp NOT NULL,
	`effectiveDate` timestamp NOT NULL,
	`maturityDate` timestamp NOT NULL,
	`counterpartyAId` int NOT NULL,
	`counterpartyBId` int NOT NULL,
	`collateralRequired` boolean NOT NULL DEFAULT true,
	`collateralType` varchar(100),
	`collateralAmount` int,
	`marginCallThreshold` int,
	`paymentFrequency` enum('monthly','quarterly','semi_annual','annual','at_maturity'),
	`dayCountConvention` varchar(50),
	`underlyingAsset` varchar(255),
	`status` enum('draft','pending_approval','approved','rejected') NOT NULL DEFAULT 'draft',
	`createdById` int NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `termSheets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tradeEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tradeId` int NOT NULL,
	`eventType` enum('created','status_changed','counterparty_confirmed','approved','rejected','executed','settled','cancelled','note_added') NOT NULL,
	`eventData` text,
	`performedById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tradeEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`termSheetId` int NOT NULL,
	`tradeStatus` enum('negotiating','pending_approval','approved','executing','executed','settling','settled','cancelled','failed') NOT NULL DEFAULT 'negotiating',
	`executionPrice` int,
	`executionTimestamp` timestamp,
	`settlementTimestamp` timestamp,
	`counterpartyAConfirmed` boolean NOT NULL DEFAULT false,
	`counterpartyBConfirmed` boolean NOT NULL DEFAULT false,
	`counterpartyAConfirmedAt` timestamp,
	`counterpartyBConfirmedAt` timestamp,
	`clearinghouseRef` varchar(255),
	`settlementRef` varchar(255),
	`initiatedById` int NOT NULL,
	`approvedById` int,
	`approvedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','trader') NOT NULL DEFAULT 'user';