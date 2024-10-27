const express = require('express');
const ytdl = require("@distube/ytdl-core");
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());

app.get('/formats', async (req, res) => {
  const videoURL = req.query.url;
  if (!ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    console.log(`Mendapatkan format untuk URL: ${videoURL}`);
    const info = await ytdl.getInfo(videoURL, {
      requestOptions: {
        // headers: {
        //   'Accept': '*/*',
        //   'Accept-Encoding': 'gzip, deflate, br, zstd',
        //   'Accept-Language': 'en-US,en;q=0.9,id;q=0.8,fi;q=0.7',
        //   'Origin': 'https://www.youtube.com',
        //   'Referer': 'https://www.youtube.com/',
        //   'Priority': 'u=1, i',
        //   'Sec-Ch-Ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
        //   'Sec-Ch-Ua-Mobile': '?0',
        //   'Sec-Ch-Ua-Platform': '"macOS"',
        //   'Sec-Fetch-Dest': 'empty',
        //   'Sec-Fetch-Mode': 'cors',
        //   'Sec-Fetch-Site': 'cross-site',
        //   'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
        // }
      }
    });
    // console.log("formats", info.formats.filter((format) => format.hasVideo || format.hasAudio));
    
    const formats = info.formats
      .filter((format) => format.hasVideo || format.hasAudio)
      .map((format) => ({
        qualityLabel: format.qualityLabel,
        itag: format.itag,
        mimeType: format.mimeType,
        contentLength: format.contentLength,
      }));
    res.json(formats);
  } catch (error) {
    console.error("Error mendapatkan format video:", error);
    res.status(500).json({ error: 'Gagal mendapatkan format video' });
  }
});

app.get('/download', async (req, res) => {
  const videoURL = req.query.url;
  const itag = req.query.itag;

  if (!ytdl.validateURL(videoURL)) {
    return res.status(400).json({ error: 'URL tidak valid' });
  }

  try {
    const info = await ytdl.getInfo(videoURL, {
      requestOptions: {
        headers: {
        //   'Accept': '*/*',
        //   'Accept-Encoding': 'gzip, deflate, br, zstd',
        //   'Accept-Language': 'en-US,en;q=0.9,id;q=0.8,fi;q=0.7',
        //   'Origin': 'https://www.youtube.com',
        //   'Referer': 'https://www.youtube.com/',
        //   'Priority': 'u=1, i',
        //   'Sec-Ch-Ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
        //   'Sec-Ch-Ua-Mobile': '?0',
        //   'Sec-Ch-Ua-Platform': '"macOS"',
        //   'Sec-Fetch-Dest': 'empty',
        //   'Sec-Fetch-Mode': 'cors',
        //   'Sec-Fetch-Site': 'cross-site',
        //   'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
        }
      }
    });
    
    const format = ytdl.chooseFormat(info.formats, { quality: itag });

    if (!format) {
      return res.status(404).json({ error: 'Format tidak ditemukan' });
    }

    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    
    // Set proper headers for response
    res.header('Content-Type', 'video/mp4');
    res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
    
    // Create download stream with updated headers
    const videoStream = ytdl(videoURL, {
      format: format,
      quality: itag,
      requestOptions: {
        maxRedirects: 5,
        maxRetries: 3,
        headers: {
        //   'Accept': '*/*',
        //   'Accept-Encoding': 'gzip, deflate, br, zstd',
        //   'Accept-Language': 'en-US,en;q=0.9,id;q=0.8,fi;q=0.7',
        //   'Origin': 'https://www.youtube.com',
        //   'Referer': 'https://www.youtube.com/',
        //   'Priority': 'u=1, i',
        //   'Sec-Ch-Ua': '"Chromium";v="124", "Microsoft Edge";v="124", "Not-A.Brand";v="99"',
        //   'Sec-Ch-Ua-Mobile': '?0',
        //   'Sec-Ch-Ua-Platform': '"macOS"',
        //   'Sec-Fetch-Dest': 'empty',
        //   'Sec-Fetch-Mode': 'cors',
        //   'Sec-Fetch-Site': 'cross-site',
        //   'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
        }
      }
    });

    videoStream.on('error', (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error streaming video' });
      }
    });

    videoStream.on('response', (response) => {
      // Log response headers for debugging
      console.log('YouTube Response Headers:', response.headers);
    });

    // Add error event listener to response
    res.on('error', (error) => {
      console.error("Response error:", error);
      videoStream.destroy();
    });

    videoStream.pipe(res);

    req.on('close', () => {
      videoStream.destroy();
    });

  } catch (error) {
    console.error("Error mendownload video:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal mendownload video' });
    }
  }
});

// Add error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});