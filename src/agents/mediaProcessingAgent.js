/**
 * WhatsCore.AI - Maverick Edition
 * Media Processing Agent - Handles all types of media content
 */
const BaseAgent = require('./baseAgent');
const { createWorker } = require('tesseract.js');
const { Tensor } = require('@tensorflow/tfjs-node');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');

class MediaProcessingAgent extends BaseAgent {
  constructor(config) {
    super({
      id: 'media_processing_agent',
      type: 'processor',
      capabilities: [
        'image_processing',
        'video_processing',
        'audio_processing',
        'document_processing',
        'media_transformation',
        'content_extraction',
        'format_conversion'
      ],
      ...config
    });

    this.ocrWorker = null;
    this.mediaCache = new Map();
    this.processingQueue = [];
    this.activeProcesses = new Map();
  }

  async loadResources(config) {
    // Initialize OCR worker
    this.ocrWorker = await createWorker('eng+rus+aze');
    
    // Ensure temp directories exist
    await fs.ensureDir(this.getTempDir('image'));
    await fs.ensureDir(this.getTempDir('video'));
    await fs.ensureDir(this.getTempDir('audio'));
    await fs.ensureDir(this.getTempDir('document'));
  }

  async preProcess(input, context) {
    const { media, type } = input;
    
    // Validate media input
    if (!media) throw new Error('No media content provided');
    
    // Generate unique processing ID
    const processId = uuidv4();
    
    // Prepare processing context
    const processingContext = {
      id: processId,
      type,
      startTime: Date.now(),
      tempFiles: [],
      metadata: await this.extractMetadata(media)
    };
    
    // Add to active processes
    this.activeProcesses.set(processId, processingContext);
    
    return {
      processId,
      media,
      type,
      context: processingContext
    };
  }

  async execute(input, context) {
    const { processId, media, type } = input;
    
    // Process based on media type
    switch (type) {
      case 'image':
        return await this.processImage(media, context);
      
      case 'video':
        return await this.processVideo(media, context);
      
      case 'audio':
        return await this.processAudio(media, context);
      
      case 'document':
        return await this.processDocument(media, context);
      
      default:
        throw new Error(`Unsupported media type: ${type}`);
    }
  }

  async postProcess(result, context) {
    const { processId } = context;
    
    // Clean up temporary files
    await this.cleanupTempFiles(processId);
    
    // Remove from active processes
    this.activeProcesses.delete(processId);
    
    // Cache results if applicable
    if (result.cacheable) {
      this.mediaCache.set(result.cacheKey, {
        timestamp: Date.now(),
        data: result
      });
    }
    
    return result;
  }

  async processImage(media, context) {
    const { processId } = context;
    const tempPath = await this.saveTempFile(media, 'image');
    
    try {
      // Load image
      const image = sharp(tempPath);
      const metadata = await image.metadata();
      
      // Perform various processing tasks in parallel
      const [
        textExtraction,
        objectDetection,
        imageOptimization,
        thumbnailGeneration
      ] = await Promise.all([
        this.extractTextFromImage(tempPath),
        this.detectObjects(tempPath),
        this.optimizeImage(image),
        this.generateThumbnails(image)
      ]);
      
      return {
        type: 'image_analysis',
        metadata,
        text: textExtraction,
        objects: objectDetection,
        optimized: imageOptimization,
        thumbnails: thumbnailGeneration,
        cacheable: true,
        cacheKey: `img_${processId}`
      };
    } finally {
      context.tempFiles.push(tempPath);
    }
  }

  async processVideo(media, context) {
    const { processId } = context;
    const tempPath = await this.saveTempFile(media, 'video');
    
    try {
      // Extract video information
      const info = await this.getVideoInfo(tempPath);
      
      // Process video in parallel tasks
      const [
        audioTrack,
        keyFrames,
        transcription,
        scenes
      ] = await Promise.all([
        this.extractAudio(tempPath),
        this.extractKeyFrames(tempPath),
        this.transcribeAudio(tempPath),
        this.detectScenes(tempPath)
      ]);
      
      // Analyze extracted content
      const analysis = await Promise.all([
        this.analyzeScenes(scenes),
        this.analyzeFrames(keyFrames),
        this.analyzeAudio(audioTrack)
      ]);
      
      return {
        type: 'video_analysis',
        metadata: info,
        audioTrack,
        keyFrames,
        transcription,
        scenes,
        analysis: {
          scenes: analysis[0],
          frames: analysis[1],
          audio: analysis[2]
        },
        cacheable: true,
        cacheKey: `vid_${processId}`
      };
    } finally {
      context.tempFiles.push(tempPath);
    }
  }

  async processAudio(media, context) {
    const { processId } = context;
    const tempPath = await this.saveTempFile(media, 'audio');
    
    try {
      // Process audio in parallel tasks
      const [
        transcription,
        waveform,
        spectrum,
        features
      ] = await Promise.all([
        this.transcribeAudio(tempPath),
        this.generateWaveform(tempPath),
        this.analyzeSpectrum(tempPath),
        this.extractAudioFeatures(tempPath)
      ]);
      
      return {
        type: 'audio_analysis',
        transcription,
        waveform,
        spectrum,
        features,
        cacheable: true,
        cacheKey: `aud_${processId}`
      };
    } finally {
      context.tempFiles.push(tempPath);
    }
  }

  async processDocument(media, context) {
    const { processId } = context;
    const tempPath = await this.saveTempFile(media, 'document');
    
    try {
      // Extract document content
      const content = await this.extractDocumentContent(tempPath);
      
      // Process content in parallel
      const [
        text,
        structure,
        metadata
      ] = await Promise.all([
        this.extractText(content),
        this.analyzeStructure(content),
        this.extractDocumentMetadata(content)
      ]);
      
      return {
        type: 'document_analysis',
        text,
        structure,
        metadata,
        cacheable: true,
        cacheKey: `doc_${processId}`
      };
    } finally {
      context.tempFiles.push(tempPath);
    }
  }

  // Media processing helper methods
  async extractTextFromImage(imagePath) {
    return await this.ocrWorker.recognize(imagePath);
  }

  async detectObjects(imagePath) {
    // Implement object detection using TensorFlow.js
    return [];
  }

  async optimizeImage(image) {
    return await image
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

  async generateThumbnails(image) {
    const sizes = [100, 300, 600];
    return await Promise.all(
      sizes.map(size =>
        image
          .resize(size, size, { fit: 'inside' })
          .jpeg({ quality: 80 })
          .toBuffer()
      )
    );
  }

  async getVideoInfo(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }

  async extractAudio(videoPath) {
    const outputPath = this.getTempFilePath('audio', 'mp3');
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('mp3')
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .save(outputPath);
    });
  }

  async extractKeyFrames(videoPath) {
    const outputDir = this.getTempDir('image');
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count: 10,
          folder: outputDir,
          filename: 'frame-%i.jpg'
        })
        .on('end', () => resolve(outputDir))
        .on('error', reject);
    });
  }

  // Utility methods
  getTempDir(type) {
    return path.join(process.env.TEMP_DIR || 'tmp', type);
  }

  getTempFilePath(type, ext) {
    return path.join(this.getTempDir(type), `${uuidv4()}.${ext}`);
  }

  async saveTempFile(media, type) {
    const ext = mime.extension(media.mimetype);
    const tempPath = this.getTempFilePath(type, ext);
    await fs.writeFile(tempPath, media.data, 'base64');
    return tempPath;
  }

  async cleanupTempFiles(processId) {
    const context = this.activeProcesses.get(processId);
    if (context?.tempFiles) {
      await Promise.all(
        context.tempFiles.map(file =>
          fs.remove(file).catch(() => {})
        )
      );
    }
  }

  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
    }
    // Cleanup temp directories
    const types = ['image', 'video', 'audio', 'document'];
    await Promise.all(
      types.map(type =>
        fs.emptyDir(this.getTempDir(type)).catch(() => {})
      )
    );
  }
}

module.exports = MediaProcessingAgent;
