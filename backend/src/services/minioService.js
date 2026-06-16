const Minio = require('minio');
const fs = require('fs');

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: 'walleradmin',
  secretKey: 'Waller2026',
});

const BUCKET = 'waller-archivos';

const subirArchivo = async (rutaLocal, nombreDestino, tipo) => {
  const carpeta = `${tipo}/${nombreDestino}`;
  await minioClient.fPutObject(BUCKET, carpeta, rutaLocal);
  fs.unlinkSync(rutaLocal);
  return carpeta;
};

const obtenerUrl = async (rutaArchivo) => {
  const url = await minioClient.presignedGetObject(BUCKET, rutaArchivo, 3600);
  return url;
};

module.exports = { subirArchivo, obtenerUrl };
