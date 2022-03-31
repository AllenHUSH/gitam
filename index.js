#!/usr/bin/env node

const fsPromises = require("fs").promises;
const child_process = require("child_process");
const commander = require("commander");
const package = require("./package.json");

const FILE_NAME = ".gam.json";
const HOME_PATH = process.env.HOME || process.env.USERPROFILE;
const FILE_PATH = `${HOME_PATH}/${FILE_NAME}`;

const INIT_JSON_DATA = {
  accounts: {},
};

const writeFile = async (data = INIT_JSON_DATA) => {
  await fsPromises.writeFile(FILE_PATH, JSON.stringify(data));
};

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

const clearFile = async () => {
  try {
    await fsPromises.unlink(FILE_PATH);
  } catch (e) {}
};

const getObject = async () => {
  await checkFile();
  const obj = JSON.parse(await fsPromises.readFile(FILE_PATH));
  if (!obj.accounts) {
    await writeFile();
    return await getObject();
  }
  return obj;
};

commander.version(package.version).description(package.description);

commander
  .command("list")
  .description("List all accounts.")
  .action(async (source, destination) => {
    const obj = await getObject();
    const arr = [];
    for (const flag in obj.accounts) {
      arr.push({
        flag,
        ...obj.accounts[flag],
      });
    }
    console.table(arr);
  });

commander
  .command("add")
  .description("Add a account.")
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
  .description("Use a account.")
  .argument("<flag>", "Account Flag")
  .action(async (flag) => {
    const obj = await getObject();
    if (obj.accounts[flag]) {
      const { username, email } = obj.accounts[flag];
      child_process.exec(`git config --global user.name "${username}"`);
      child_process.exec(`git config --global user.email "${email}"`);
      console.log("🎉 Toggle success.");
      console.log(flag, username, email);
    } else {
      console.log(
        "🤔 Not found the flag. You Can run `list` to show the list of accounts."
      );
    }
  });

commander
  .command("remove")
  .argument("<flag>", "Account Flag")
  .description("Remove a account.")
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
  .description("Remove the db file.")
  .action(async () => {
    await clearFile();
    console.log("🧹 Clear done.");
  });

commander.parse(process.argv);
