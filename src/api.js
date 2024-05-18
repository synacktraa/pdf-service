const os = require('os');
const fs = require('fs');
const path = require('path')
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const multer = require('multer');
const { read } = require('./pdf');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT ?? 3000;

const uploadDirectory = `${os.homedir()}/.pdf-service/uploads`
if (fs.existsSync(uploadDirectory) === false) {
  fs.mkdirSync(uploadDirectory, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}.pdf`);
  }
});
const upload = multer({ storage });

app.all('/', async (req, res) => {
  res.status(200).json({ 
    msg: "Welcome to PDF service. Check `/endpoints` for more details." 
  })
})

app.all('/endpoints', async (req, res) => {
  res.status(200).json({
    '/upload': {
      type: 'POST',
      input: 'PDF file object.',
      output: 'JsON value with msg and uploadId as keys.'
    },
    '/remove/:uploadId': {
      type: 'DELETE',
      input: 'upload ID as path parameter.',
      output: 'JsON value with msg as key.'
    },
    '/elements/:uploadId': {
      type: 'GET',
      input: 'upload ID as path parameter and batchSize as query parameter.',
      output: 'Streaming response with PDF elements.'
    }
  })
})

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const uploadedFile = req.file;
    if (!uploadedFile) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    if (uploadedFile.mimetype !== 'application/pdf') {
      await fs.promises.unlink(uploadedFile.path, (err) => {
        if (err) {
          console.error(`Failed to delete file: ${err.message}`);
          return;
        }
      });
      return res.status(400).json({ msg: 'Only PDF file is supported' })
    }

    res.status(200).json({
      uploadId: uploadedFile.filename.split('.pdf')[0], 
      msg: `'${uploadedFile.originalname}' has been successfully uploaded`
    })
  } catch (error) {
    res.status(500).json({ msg: 'Could not process the request' });
  }
})

app.delete('/remove/:uploadId', async (req, res) => {
  const uploadId = req.params.uploadId
  const filePath = path.join(uploadDirectory, `${uploadId}.pdf`)

  try {
    if (fs.existsSync(filePath) === false) {
      return res.status(400).json({ 
        msg: `PDF file associated with '${uploadId}' Id doesn't exists`
      })
    }

    await fs.promises.unlink(filePath, (err) => {})
    return res.status(200).json({ 
      msg: `PDF file associated with '${uploadId}' has been successfully deleted`
    })
  } catch (error) {
    console.log(error)
    res.status(400).json({ msg: `Could not process request with upload ID: '${uploadId}'`});
  }
})

app.get('/elements/:uploadId', async (req, res) => {
  const uploadId = req.params.uploadId
  const batchSize = req.query.batchSize ?? 1
  const filePath = path.join(uploadDirectory, `${uploadId}.pdf`)

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const reader = read(filePath, batchSize);
    for await (const batch of reader) {
      res.write(`data: ${JSON.stringify(batch)}\n\n`);
    }
    res.end();
  } catch (error) {
    res.status(400).json({ msg: `Could not process request with upload ID: ${uploadId}`});
  }
})

app.listen(PORT, () => {
    console.log(`API server is running on http://localhost:${PORT}`);
});
