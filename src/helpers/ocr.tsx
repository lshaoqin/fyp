import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

export async function extractTextFromImage(filePath: string): Promise<string> {
  const [result] = await client.documentTextDetection(filePath);
  const text = result.textAnnotations ? result.textAnnotations[0]?.description || '' : '';
  return text;
}