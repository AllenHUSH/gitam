#!/usr/bin/env node
const commander = require("commander");
const package = require("./package.json");
const { writeFile, clearFile, getObject } = require("./src/db");
const {
  logCurrentConfig,
  listAccounts,
  useAnAccount,
  selectAnAccount,
} = require("./src/actions");

commander
  .version(package.version)
  .description(package.description)
  .action(async () => {
    await logCurrentConfig();
  });

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
  .option("-g, --global", "Set global config.")
  .action(async (flag, { global }) => {
    const obj = await getObject();

    if (!Object.keys(obj.accounts).length) {
      console.log(
        "🤚 No account can be selected, please add an account first."
      );
      return;
    }

    if (!flag) {
      await listAccounts(obj);
      return selectAnAccount(obj, global);
    }

    const account = obj.accounts[flag];
    if (account) {
      useAnAccount(flag, account, global);
    } else {
      console.log(
        "🤔 Not found the flag. You Can run `list` to show the list of accounts."
      );
    }
  });

commander
  .command("remove")
  .alias("rm")
  .argument("[flag]", "Account Flag")
  .option("-a, --all", "Remove all accounts (clear the db file).")
  .description("Remove an account.")
  .action(async (flag, { all }) => {
    if (all) {
      await clearFile();
      console.log("🧹 Clear done.");
      return;
    }
    const obj = await getObject();
    if (obj.accounts[flag]) {
      delete obj.accounts[flag];
      await writeFile(obj);
      console.log("👋 Remove success.");
    } else {
      console.log("🤔 Not found the flag.");
    }
  });

commander.parse(process.argv);
