ALTER TABLE "IssueItem"
ADD COLUMN "receiveItemId" INTEGER;

ALTER TABLE "IssueItem"
ADD CONSTRAINT "IssueItem_receiveItemId_fkey"
FOREIGN KEY ("receiveItemId")
REFERENCES "ReceiveItem"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
