const UploadJob = require('../models/uploadJob.model');
const minioService = require('../services/minio.service');
const { publishVideoUploaded } = require('../services/rabbitmq.service');
const { v4: uuidv4 } = require('uuid');

async function uploadChunk(req, res) {
  try {
    const { session_id, candidate_id, candidate_name, question_boundaries, is_final } = req.body;
    const chunk = req.file;

    if (!chunk) return res.status(400).json({ error: 'No chunk provided' });

    const videoId = uuidv4();
    const key = `${session_id}/${videoId}.webm`;

    const minioUrl = await minioService.uploadFile(key, chunk.buffer, chunk.mimetype);

    let parsedQuestionBoundaries = [];
    if (question_boundaries) {
      try {
        const parsed = typeof question_boundaries === 'string' ? JSON.parse(question_boundaries) : question_boundaries;
        if (Array.isArray(parsed)) {
          parsedQuestionBoundaries = parsed;
        }
      } catch {
        parsedQuestionBoundaries = [];
      }
    }

    const job = await UploadJob.create({
      session_id,
      candidate_id,
      candidate_name,
      question_boundaries: parsedQuestionBoundaries,
      minio_url: minioUrl,
      status: is_final === 'true' ? 'COMPLETE' : 'UPLOADING',
    });

    if (is_final === 'true') {
      await publishVideoUploaded({
        videoId: job._id.toString(),
        sessionId: session_id,
        candidateId: candidate_id,
        minioUrl,
        questionBoundaries: parsedQuestionBoundaries,
      });
    }

    res.status(201).json({ jobId: job._id, status: job.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
}

async function getJob(req, res) {
  try {
    const job = await UploadJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
}

async function getLatestSessionVideo(req, res) {
  try {
    const { sessionId } = req.params;
    const latestCompleteJob = await UploadJob.findOne({
      session_id: sessionId,
      status: 'COMPLETE',
    }).sort({ created_at: -1 });

    if (!latestCompleteJob) {
      return res.status(404).json({ error: 'No completed video found for this session' });
    }

    const minioUrl = latestCompleteJob.minio_url || '';
    const bucketWithSlash = `/${process.env.MINIO_BUCKET}/`;
    const keyStartIndex = minioUrl.indexOf(bucketWithSlash);

    if (keyStartIndex < 0) {
      return res.status(500).json({ error: 'Stored video URL has invalid format' });
    }

    const objectKey = minioUrl.slice(keyStartIndex + bucketWithSlash.length);
    const playbackUrl = await minioService.getSignedReadUrl(objectKey);

    res.json({
      session_id: sessionId,
      job_id: latestCompleteJob._id,
      playback_url: playbackUrl,
      created_at: latestCompleteJob.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch latest session video' });
  }
}

async function getLatestSessionVideosByCandidate(req, res) {
  try {
    const { sessionId } = req.params;
    const grouped = await UploadJob.aggregate([
      { $match: { session_id: sessionId, status: 'COMPLETE' } },
      { $sort: { created_at: -1 } },
      {
        $group: {
          _id: '$candidate_id',
          candidate_name: { $first: '$candidate_name' },
          job_id: { $first: '$_id' },
          minio_url: { $first: '$minio_url' },
          created_at: { $first: '$created_at' },
        },
      },
      { $sort: { created_at: -1 } },
    ]);

    const results = await Promise.all(grouped.map(async (item) => {
      const minioUrl = item.minio_url || '';
      const bucketWithSlash = `/${process.env.MINIO_BUCKET}/`;
      const keyStartIndex = minioUrl.indexOf(bucketWithSlash);

      if (keyStartIndex < 0) {
        return {
          candidate_id: item._id,
          candidate_name: item.candidate_name || item._id,
          job_id: item.job_id,
          created_at: item.created_at,
          playback_url: null,
        };
      }

      const objectKey = minioUrl.slice(keyStartIndex + bucketWithSlash.length);
      const playbackUrl = await minioService.getSignedReadUrl(objectKey);

      return {
        candidate_id: item._id,
        candidate_name: item.candidate_name || item._id,
        job_id: item.job_id,
        created_at: item.created_at,
        playback_url: playbackUrl,
      };
    }));

    res.json({ session_id: sessionId, candidates: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch candidate videos' });
  }
}

async function getLatestVideoByCandidate(req, res) {
  try {
    const { sessionId, candidateId } = req.params;
    const latestCompleteJob = await UploadJob.findOne({
      session_id: sessionId,
      candidate_id: candidateId,
      status: 'COMPLETE',
    }).sort({ created_at: -1 });

    if (!latestCompleteJob) {
      return res.status(404).json({ error: 'No completed video found for this candidate' });
    }

    const minioUrl = latestCompleteJob.minio_url || '';
    const bucketWithSlash = `/${process.env.MINIO_BUCKET}/`;
    const keyStartIndex = minioUrl.indexOf(bucketWithSlash);

    if (keyStartIndex < 0) {
      return res.status(500).json({ error: 'Stored video URL has invalid format' });
    }

    const objectKey = minioUrl.slice(keyStartIndex + bucketWithSlash.length);
    const playbackUrl = await minioService.getSignedReadUrl(objectKey);

    res.json({
      session_id: sessionId,
      candidate_id: candidateId,
      candidate_name: latestCompleteJob.candidate_name || candidateId,
      job_id: latestCompleteJob._id,
      playback_url: playbackUrl,
      created_at: latestCompleteJob.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch latest candidate video' });
  }
}

module.exports = {
  uploadChunk,
  getJob,
  getLatestSessionVideo,
  getLatestSessionVideosByCandidate,
  getLatestVideoByCandidate,
};
