import fs from 'node:fs/promises';
import { Result, fail } from './railway.js';
export type LoadingStatus = Result<
  object,
  { message: string; filename: string }
>;

export type StringLoadingStatus = Result<
  string,
  { message: string; filename: string }
>;

export type StringSavingStatus = Result<
  string,
  { message: string; filename: string }
>;

export const readJson = async (filename: string): Promise<LoadingStatus> => {
  let content;
  try {
    content = await fs.readFile(filename, { encoding: 'utf8' });
  } catch {
    return fail({
      message: `The json file cannot be found: ${filename}`,
      filename,
    });
  }

  try {
    const value = JSON.parse(content);
    return {
      status: 'success',
      value,
    };
  } catch {
    return fail({
      message: `The json file cannot be parsed: ${filename}`,
      filename,
    });
  }
};

export const readText = async (
  filename: string
): Promise<StringLoadingStatus> => {
  try {
    const value = await fs.readFile(filename, { encoding: 'utf8' });
    return {
      status: 'success',
      value,
    };
  } catch {
    return fail({
      message: `The text file cannot be found: ${filename}`,
      filename,
    });
  }
};

export const writeText = async (
  filename: string,
  content: string
): Promise<StringSavingStatus> => {
  try {
    await fs.writeFile(filename, content, { encoding: 'utf8' });
    return {
      status: 'success',
      value: content,
    };
  } catch {
    return fail({
      message: `The text file cannot be found: ${filename}`,
      filename,
    });
  }
};
