const fs = require("fs").promises;

const FILE_NAME = ".gam.json";
const HOME_PATH = process.env.HOME || process.env.USERPROFILE;
const FILE_PATH = `${HOME_PATH}/${FILE_NAME}`;

const INIT_JSON_DATA = {
  accounts: {},
};

/**
 * @description 向 DB 文件中写入数据
 */
const writeFile = async (data = INIT_JSON_DATA) => {
  await fs.writeFile(FILE_PATH, JSON.stringify(data));
};

/**
 * @description 检查是否存在 DB 文件，不存在则创建
 */
const checkFile = async () => {
  try {
    const stat = await fs.stat(FILE_PATH);
    if (!stat) {
      await writeFile();
    }
  } catch (e) {
    await writeFile();
  }
};

/**
 * @description 删除 DB 文件
 */
const clearFile = async () => {
  try {
    await fs.unlink(FILE_PATH);
  } catch (e) {}
};

/**
 * @description 从 DB 文件中获取数据 object
 */
const getObject = async () => {
  await checkFile();
  const obj = JSON.parse(await fs.readFile(FILE_PATH));
  if (!obj.accounts) {
    await writeFile();
    return await getObject();
  }
  return obj;
};

module.exports = {
  writeFile,
  checkFile,
  clearFile,
  getObject,
};
