const ffmpeg = require('fluent-ffmpeg');

function convertAudioToOgg(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .audioCodec('libopus')
      .format('ogg')
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

module.exports = { convertAudioToOgg };