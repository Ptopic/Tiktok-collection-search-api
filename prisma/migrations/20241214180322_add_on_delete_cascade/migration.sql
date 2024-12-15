-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "VideoHashtag" DROP CONSTRAINT "VideoHashtag_videoId_fkey";

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoHashtag" ADD CONSTRAINT "VideoHashtag_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
