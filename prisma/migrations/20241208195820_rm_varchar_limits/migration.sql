-- AlterTable
ALTER TABLE "Collection" ALTER COLUMN "playlistUrl" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Hashtag" ALTER COLUMN "hashtag" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Video" ALTER COLUMN "videoUrl" SET DATA TYPE TEXT,
ALTER COLUMN "thumbnailUrl" SET DATA TYPE TEXT;
