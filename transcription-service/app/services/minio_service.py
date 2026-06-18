# Purpose: Provide reusable service/business logic.

import os
import boto3
import tempfile


# Main flow: Execute core operations and return results.

# Function: get_s3_client - Returns s3 client.
def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=os.getenv('MINIO_ENDPOINT'),
        aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('MINIO_SECRET_KEY'),
        region_name='us-east-1',
    )


# Function: download_video - Handles download video.
def download_video(minio_url: str) -> str:
    """Download a video from MinIO to a temp file. Returns the local file path."""
    # Parse the key from the URL
    bucket = os.getenv('MINIO_BUCKET', 'videos')
    key = minio_url.split(f"/{bucket}/", 1)[1]

    s3 = get_s3_client()
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.webm')
    s3.download_fileobj(bucket, key, tmp)
    tmp.close()
    return tmp.name
