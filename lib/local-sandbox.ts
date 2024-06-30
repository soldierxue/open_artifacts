import * as fs from 'fs/promises';
import { exec } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pythonContainer = process.env.PYTHON_DOCKER_IMAGE;

interface RunResult {
    png: string
}

interface CodeExecResult {
    logs: {
        stdout: string[]
        stderr: string[]
    }
    error?: any
    results: RunResult[]
}



function preprocessPythonCode(prefix:string, code: string): string {
    let showCount = 0;
    const lines = code.split('\n');
    const processedLines = lines.map(line => {
        if (line.trim().startsWith('plt.show()')) {
            showCount++;
            return line.replace('plt.show()', `plt.savefig('/app/${prefix}_figure_${showCount}.png')`);
        }
        return line;
    });
    return processedLines.join('\n');
}

export async function runJs(userID: string, code: string) {
    const result ={
      logs:{stdout:[],stderr:[]},
      error:undefined,
      results:[{html:code}]
    }
    return result
  }
  

export async function runPython(userID: string,code: string): Promise<CodeExecResult> {
    //create random  prefix name for temp_script.py
    const tempPrefix = Math.random().toString(36).substring(7);

    const tempFilePath = path.join(__dirname, `${tempPrefix}_temp_script.py`);
    const processedCode = preprocessPythonCode(tempPrefix,code);
    console.log(processedCode);
    const generatedFiles: string[] = [];
    let stdErrStr: string = '';
    let stdOutStr: string = '';
    try {
        // 写入处理后的 Python 代码到临时文件
        await fs.writeFile(tempFilePath, processedCode);

        // 构建 Docker 命令
        const dockerCommand = `docker run --rm -v "${__dirname}:/app" ${pythonContainer} python /app/${tempPrefix}_temp_script.py`;

        // 执行 Docker 命令
        const result = await new Promise<string>((resolve, reject) => {
            exec(dockerCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(error.message);
                    return;
                }
                if (stderr) {
                    console.error('Docker stderr:', stderr);
                    reject(stderr);
                    return;
                }
                resolve(stdout);
            });
        });

        try {
            const files = await fs.readdir(__dirname);
            // 过滤出所有 .png 文件
            const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
            for (const file of pngFiles) {
                const imagePath = path.join(__dirname, file);
                const imageBuffer = await fs.readFile(imagePath);
                const base64Image = imageBuffer.toString('base64');
                generatedFiles.push(base64Image);
                // 删除临时图片文件
                await fs.unlink(imagePath);
            }
            console.log(`Total processed images: ${generatedFiles.length}`);
        } catch (error) {
            console.error('Error processing images:', error);
            throw error;
        }


        stdOutStr = result.trim();
        console.log('Python execution result:', stdOutStr);
        generatedFiles.forEach(file => {
            console.log(`${file.substring(0, 50)}...`);
          });
    } catch (error) {
        console.error('dockerCommand Error:', error);
        stdErrStr = JSON.stringify(error);
        console.log('stdErrStr:',stdErrStr);
        throw error;
    } finally {
        // 清理临时文件
        try {
            await fs.unlink(tempFilePath);
        } catch (error) {
            console.error('Error deleting temp file:', error);
        }
        return {
            logs:{
                stdout: [stdOutStr],
                stderr: [stdErrStr]
            },
            results: generatedFiles.map(data => ({ 'png': data }))
        };
    };
}
