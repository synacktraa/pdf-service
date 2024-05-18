const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config()

const PORT = process.env.PORT ?? 3000
const baseURL = `http://localhost:${PORT}`; // Change to your server's URL if different

// Function to test the POST /upload endpoint
async function testUpload(pfdPath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(pfdPath));

  try {
    const response = await axios.post(`${baseURL}/upload`, form, {
      headers: form.getHeaders()
    });
    console.log('Upload Response:', response.data);
    return response.data.uploadId;
  } catch (error) {
    console.error('Upload Error:', error.response ? error.response.data : error.message);
  }
}

// Function to test the DELETE /remove/:uploadId endpoint
async function testDelete(uploadId) {
  try {
    const response = await axios.delete(`${baseURL}/remove/${uploadId}`);
    console.log('Delete Response:', response.data);
  } catch (error) {
    console.error('Delete Error:', error.response ? error.response.data : error.message);
  }
}

// Function to test the GET /elements/:uploadId endpoint
async function testGetElements(uploadId, batchSize) {
  try {
    const response = await axios.get(`${baseURL}/elements/${uploadId}?batchSize=${batchSize}`, {
      responseType: 'stream'
    });

    response.data.on('data', chunk => {
      console.log('Chunk:', chunk.toString());
    });

    response.data.on('end', () => {
      console.log('Stream ended');
    });
  } catch (error) {
    console.error('Get Elements Error:', error.response ? error.response.data : error.message);
  }
}

async function main() {
  const uploadId = await testUpload('path/to/pdf'); // Update the path before running test
  if (uploadId) {
    await testGetElements(uploadId, 3);
    await testDelete(uploadId);
  }
}

main();