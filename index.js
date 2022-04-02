#!/usr/bin/env node

const fsPromises = require("fs").promises;
const child_process = require("child_process");
const commander = require("commander");
const package = require("./package.json");
const readline = require("readline");

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
  await fsPromises.writeFile(FILE_PATH, JSON.stringify(data));
};

/**
 * @description 检查是否存在 DB 文件，不存在则创建
 */
const checkFile = async () => {
  try {
    const stat = await fsPromises.stat(FILE_PATH);
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
    await fsPromises.unlink(FILE_PATH);
  } catch (e) {}
};

/**
 * @description 从 DB 文件中获取数据 object
 */
const getObject = async () => {
  await checkFile();
  const obj = JSON.parse(await fsPromises.readFile(FILE_PATH));
  if (!obj.accounts) {
    await writeFile();
    return await getObject();
  }
  return obj;
};

/**
 * @description 以表格的形式打印出已保存的账号
 * @param {*} obj
 */
const listAccounts = async (obj) => {
  const { accounts } = obj || (await getObject());
  const arr = [];
  for (const flag in accounts) {
    arr.push({
      flag,
      ...accounts[flag],
    });
  }
  console.table(arr);
};

/**
 * @description 使用一个账号
 */
const useAnAccount = async (flag, account) => {
  const { username, email } = account;
  child_process.exec(`git config --global user.name "${username}"`);
  child_process.exec(`git config --global user.email "${email}"`);
  console.log("🎉 Toggle success.");
  console.log(flag, username, email);
};

/**
 * @description 通过命令行交互的方式，在已存储的列表中选择一个账号
 */
const selectAnAccount = async (obj) => {
  const _obj = obj || (await getObject());
  const { accounts } = _obj;

  if (!Object.keys(accounts).length) {
    console.log("🤚 No account can be selected, please add an account first.");
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Please select a index or flag: `, (input) => {
    rl.close();
    const isIndex = !isNaN(Number(input));

    const flag = isIndex ? Object.keys(accounts)[input] : input;
    const account = accounts[flag];

    if (!account) {
      console.log("❌ No this index or flag");
      return selectAnAccount(_obj);
    } else {
      return useAnAccount(flag, account);
    }
  });
};

commander.version(package.version).description(package.description);

commander
  .command("list")
  .alias("ls")
  .description("List all accounts.")
  .action(async () => {
    await listAccounts();
  });

commander
  .command("add")
  .description("Add an account.")
  .argument("<flag>", "Account Flag")
  .argument("<username>", "Account Username")
  .argument("<email>", "Account Email")
  .action(async (flag, username, email) => {
    const obj = await getObject();
    obj.accounts[flag] = {
      username,
      email,
    };
    await writeFile(obj);
    console.log("👌 Add success.");
  });

commander
  .command("use")
  .alias("u")
  .description("Use an account.")
  .argument("[flag]", "Account Flag")
  .action(async (flag) => {
    const obj = await getObject();

    if (!Object.keys(obj.accounts).length) {
      console.log(
        "🤚 No account can be selected, please add an account first."
      );
      return;
    }

    if (!flag) {
      await listAccounts(obj);
      return selectAnAccount(obj);
    }

    const account = obj.accounts[flag];
    if (account) {
      useAnAccount(flag, account);
    } else {
      console.log(
        "🤔 Not found the flag. You Can run `list` to show the list of accounts."
      );
    }
  });

commander
  .command("remove")
  .alias("rm")
  .argument("<flag>", "Account Flag")
  .description("Remove an account.")
  .action(async (flag) => {
    const obj = await getObject();
    if (obj.accounts[flag]) {
      delete obj.accounts[flag];
      await writeFile(obj);
      console.log("👋 Remove success.");
    } else {
      console.log("🤔 Not found the flag.");
    }
  });

commander
  .command("clear")
  .description("Clear the db file.")
  .action(async () => {
    await clearFile();
    console.log("🧹 Clear done.");
  });

commander.parse(process.argv);
