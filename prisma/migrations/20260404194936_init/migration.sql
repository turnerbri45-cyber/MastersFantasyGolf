-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Golfer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "worldRank" INTEGER,
    "imageUrl" TEXT,
    "isMadeCut" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "GolferPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "golferId" TEXT NOT NULL,
    "pickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GolferPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GolferPick_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinalPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "golferId" TEXT NOT NULL,
    "lockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoSelected" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FinalPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FinalPick_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentScore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "golferId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "strokes" INTEGER,
    "scoreToPar" INTEGER,
    "position" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TournamentScore_golferId_fkey" FOREIGN KEY ("golferId") REFERENCES "Golfer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "League_inviteCode_key" ON "League"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_userId_leagueId_key" ON "LeagueMember"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "GolferPick_userId_leagueId_golferId_key" ON "GolferPick"("userId", "leagueId", "golferId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalPick_userId_leagueId_golferId_key" ON "FinalPick"("userId", "leagueId", "golferId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentScore_golferId_round_key" ON "TournamentScore"("golferId", "round");
