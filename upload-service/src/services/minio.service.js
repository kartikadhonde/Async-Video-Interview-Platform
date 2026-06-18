// Purpose: Provide reusable service/business logic.

const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/minio');

// Main flow: Execute core operations and return results.

// Function: uploadFile - Uploads a file object to MinIO and returns its object URL.
async function uploadFile(key, buffer, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${key}`;
}

// Function: getSignedReadUrl - Returns a temporary signed URL for secure object playback.
async function getSignedReadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { uploadFile, getSignedReadUrl };
