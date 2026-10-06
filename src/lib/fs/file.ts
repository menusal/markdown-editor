export async function readFileText(
  handle: FileSystemFileHandle,
): Promise<string> {
  const file = await handle.getFile()
  return file.text()
}

export async function writeFileText(
  handle: FileSystemFileHandle,
  text: string,
): Promise<void> {
  const writable = await handle.createWritable()
  try {
    await writable.write(text)
  } finally {
    await writable.close()
  }
}
