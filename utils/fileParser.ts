import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth';

// Set worker source for pdf.js to use the CDN version from esm.sh which is specified in the importmap
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.5.136/build/pdf.worker.min.js`;

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

const parsePdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
};

const parseDocx = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    if (!file) {
        throw new Error("No se proporcionó ningún archivo.");
    }

    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`El archivo es demasiado grande. El tamaño máximo es ${MAX_FILE_SIZE_MB} MB.`);
    }

    const arrayBuffer = await readFileAsArrayBuffer(file);
    
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return parsePdf(arrayBuffer);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return parseDocx(arrayBuffer);
    } else {
        throw new Error("Tipo de archivo no soportado. Sube un PDF o DOCX.");
    }
};
