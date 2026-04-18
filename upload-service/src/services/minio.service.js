const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/minio');

async function uploadFile(key, buffer, contentType) {
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  return `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${key}`;
}

async function getSignedReadUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { uploadFile, getSignedReadUrl };
