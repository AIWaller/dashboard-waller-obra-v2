require('dotenv').config({ path: '/var/www/dashboard-waller-obra-v2/backend/.env' });
const Minio = require('minio');
const fs = require('fs');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

const BUCKET = process.env.MINIO_BUCKET;

// Subir archivo a MinIO
const subirArchivo = async (rutaLocal, nombreDestino, tipo) => {
  const carpeta = `${tipo}/${nombreDestino}`;
  await minioClient.fPutObject(BUCKET, carpeta, rutaLocal);
  fs.unlinkSync(rutaLocal); // eliminar archivo temporal
  return carpeta;
};

// Obtener URL temporal para descargar
const obtenerUrl = async (rutaArchivo) => {
  const url = await minioClient.presignedGetObject(BUCKET, rutaArchivo, 3600);
  return url;
};

module.exports = { subirArchivo, obtenerUrl };
