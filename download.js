import fs from 'fs';
import https from 'https';

const fileUrl = 'https://drive.google.com/uc?export=download&id=1qTJ7s3P8XQduy3_He1EpXTswLLH6Fp3T';
const dest = './temp.xlsx';

https.get(fileUrl, (response) => {
  // Handle redirects
  if (response.statusCode === 302 || response.statusCode === 303) {
    https.get(response.headers.location, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download completed.');
      });
    });
  } else {
    const file = fs.createWriteStream(dest);
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download completed.');
    });
  }
});
